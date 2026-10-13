import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'openstage-audio';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://audio.openstage.live';

function getS3Client(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Generate a presigned upload URL for Cloudflare R2 (MP3 track up to 10 MB)
 */
export async function generatePresignedAudioUpload({
  artistId,
  fileName,
  contentType = 'audio/mpeg',
}: {
  artistId: string;
  fileName: string;
  contentType?: string;
}): Promise<{
  uploadUrl: string;
  publicUrl: string;
  key: string;
  isMock: boolean;
}> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `tracks/${artistId}/${Date.now()}-${sanitizedName}`;

  const client = getS3Client();

  if (!client) {
    // Development fallback: direct upload endpoint
    return {
      uploadUrl: `/api/radio/upload-dev?key=${encodeURIComponent(key)}`,
      publicUrl: `/api/radio/stream-dev?key=${encodeURIComponent(key)}`,
      key,
      isMock: true,
    };
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;

  return {
    uploadUrl,
    publicUrl,
    key,
    isMock: false,
  };
}
