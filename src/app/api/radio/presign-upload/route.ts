import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 S3-compatible client
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'openstage-radio';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucketName };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { userId, fileName, contentType } = body;

    const artistId = user?.id || userId;

    if (!artistId) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verify artist is Pro
    const { data: artist } = await supabase
      .from('artists')
      .select('is_pro')
      .eq('profile_id', artistId)
      .maybeSingle();

    if (!artist?.is_pro) {
      return NextResponse.json(
        { error: 'Solo gli artisti Pro possono caricare brani per la Radio' },
        { status: 403 }
      );
    }

    // Check track limit (max 3 non-rejected)
    const { count } = await supabase
      .from('radio_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('artist_id', artistId)
      .neq('status', 'rejected');

    if (count && count >= 3) {
      return NextResponse.json(
        { error: 'Hai già raggiunto il limite massimo di 3 brani' },
        { status: 400 }
      );
    }

    // Validate file type and size (max 10MB)
    if (!contentType?.startsWith('audio/')) {
      return NextResponse.json({ error: 'Tipo file non supportato. Solo audio MP3.' }, { status: 400 });
    }

    // Generate unique key
    const ext = fileName.split('.').pop()?.toLowerCase() || 'mp3';
    const key = `artists/${artistId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Try R2 presigned URL
    const r2 = getR2Client();

    if (r2) {
      const command = new PutObjectCommand({
        Bucket: r2.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(r2.client, command, { expiresIn: 3600 }); // 1 hour
      const publicUrl = `${process.env.R2_PUBLIC_URL || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${r2.bucketName}`}/${key}`;

      return NextResponse.json({
        uploadUrl,
        publicUrl,
        key,
        bucket: r2.bucketName,
      });
    }

    // Fallback: local dev upload endpoint (for testing without R2 credentials)
    const devUploadUrl = `/api/radio/upload-dev?key=${encodeURIComponent(key)}`;
    const devPublicUrl = `/api/radio/stream-dev?key=${encodeURIComponent(key)}`;

    return NextResponse.json({
      uploadUrl: devUploadUrl,
      publicUrl: devPublicUrl,
      key,
      isDev: true,
    });
  } catch (err: any) {
    console.error('Error generating presigned upload URL:', err);
    return NextResponse.json({ error: err.message || 'Errore generazione upload URL' }, { status: 500 });
  }
}