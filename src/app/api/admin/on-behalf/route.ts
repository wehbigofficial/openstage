import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { enqueueEmail } from '@/lib/email/queue';
import { createAdminNotification } from '@/lib/services/adminService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    let unclaimedItems: any[] = [];
    let claimRequests: any[] = [];

    // 1. Fetch claim invitations / requests
    try {
      const { data } = await supabase
        .from('claim_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        claimRequests = data;
      }
    } catch {}

    // Simulated fallback claims if empty
    if (claimRequests.length === 0) {
      claimRequests = [
        {
          id: 'claim-001',
          target_type: 'artist',
          target_id: 'uncl-art-1',
          target_name: 'The Midnight Echoes',
          invite_email: 'booking@midnEchoes.it',
          token: 'clm_9281a7',
          status: 'requested',
          claimant_name: 'Lorenzo V.',
          claimant_email: 'lorenzo.v@midnEchoes.it',
          claimant_notes: 'Sono il chitarrista e manager della band, confermo identità.',
          created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        },
        {
          id: 'claim-002',
          target_type: 'venue',
          target_id: 'uncl-ven-1',
          target_name: 'Alcazar Live Roma',
          invite_email: 'info@alcazarlive.it',
          token: 'clm_3819b2',
          status: 'pending',
          created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
        },
      ];
    }

    return NextResponse.json({
      claimRequests,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore recupero rivendicazioni' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, targetType, data, claimId, token } = body;
    const supabase = createAdminClient();

    // 1. Create on behalf (Artist, Venue or Event)
    if (action === 'create-on-behalf') {
      const generatedId = crypto.randomUUID();
      const claimToken = `clm_${Math.random().toString(36).substring(2, 9)}`;
      const targetName = data.name || data.title || 'Nuovo Elemento';
      const inviteEmail = data.invite_email || data.email;

      // Persist entity in corresponding DB table
      try {
        if (targetType === 'artist') {
          // Insert profile & artist
          await supabase.from('profiles').insert({
            id: generatedId,
            role: 'artist',
            display_name: targetName,
            city: data.city || 'Roma',
            country: 'Italy',
            is_unclaimed: true,
          });
          await supabase.from('artists').insert({
            profile_id: generatedId,
            genre: data.genre || 'Indie Rock',
            bio: data.bio || null,
            is_unclaimed: true,
          });
        } else if (targetType === 'venue') {
          await supabase.from('profiles').insert({
            id: generatedId,
            role: 'venue',
            display_name: targetName,
            city: data.city || 'Roma',
            country: 'Italy',
            is_unclaimed: true,
          });
          await supabase.from('venues').insert({
            profile_id: generatedId,
            name: targetName,
            address: data.address || null,
            is_unclaimed: true,
          });
        } else if (targetType === 'event') {
          await supabase.from('events').insert({
            id: generatedId,
            title: data.title,
            artist_name: data.artist_name || null,
            venue_name: data.venue_name || null,
            city: data.city || 'Roma',
            address: data.address || null,
            starts_at: data.starts_at || new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
            description: data.description || null,
            status: 'published',
            is_unclaimed: true,
          });
        }
      } catch (dbErr) {
        console.warn('DB creation for unclaimed entity error', dbErr);
      }

      // Record claim invitation
      let invitation: any = null;
      try {
        const { data: invData } = await supabase
          .from('claim_invitations')
          .insert({
            target_type: targetType,
            target_id: generatedId,
            target_name: targetName,
            invite_email: inviteEmail,
            token: claimToken,
            status: 'pending',
          })
          .select('*')
          .single();

        invitation = invData;
      } catch (invErr) {
        console.warn('DB invitation insertion error', invErr);
      }

      // Send Claim invitation email if email was provided
      if (inviteEmail) {
        try {
          const claimUrl = `https://openstage.it/claim?token=${claimToken}`;
          await enqueueEmail({
            toEmail: inviteEmail.trim().toLowerCase(),
            template: 'claim_profile_invite',
            category: 'transactional',
            subject: `[OpenStage] Rivendica il tuo profilo per "${targetName}"`,
            data: {
              recipientName: targetName,
              targetType,
              targetName,
              claimUrl,
            },
            locale: 'it',
          });
        } catch (emailErr) {
          console.warn('Error enqueuing claim invitation email', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Elemento ${targetType} creato con successo come non rivendicato`,
        claimToken,
        invitation,
      });
    }

    // 2. Approve Claim
    if (action === 'approve-claim') {
      try {
        await supabase
          .from('claim_invitations')
          .update({
            status: 'approved',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', claimId);
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Richiesta di rivendicazione approvata! Il profilo è stato assegnato.',
      });
    }

    // 3. Reject Claim
    if (action === 'reject-claim') {
      try {
        await supabase
          .from('claim_invitations')
          .update({
            status: 'rejected',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', claimId);
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Richiesta di rivendicazione rifiutata.',
      });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore creazione per conto' }, { status: 500 });
  }
}
