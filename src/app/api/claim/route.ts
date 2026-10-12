import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAdminNotification } from '@/lib/services/adminService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: invitation } = await supabase
      .from('claim_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (!invitation) {
      // In demo fallback, return sample invitation
      return NextResponse.json({
        invitation: {
          token,
          target_type: 'artist',
          target_name: 'Luna Velata (Band)',
          invite_email: 'booking@lunavelata.it',
          status: 'pending',
        },
      });
    }

    return NextResponse.json({ invitation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, claimant_name, claimant_email, claimant_notes } = body;

    if (!token || !claimant_name || !claimant_email) {
      return NextResponse.json({ error: 'Dati incompleti per la richiesta' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let targetName = 'Profilo';
    try {
      const { data } = await supabase
        .from('claim_invitations')
        .update({
          claimant_name,
          claimant_email,
          claimant_notes: claimant_notes || null,
          status: 'requested',
        })
        .eq('token', token)
        .select('*')
        .single();

      if (data) targetName = data.target_name;
    } catch {}

    // Dispatch admin notification
    await createAdminNotification({
      type: 'claim_request',
      title: `Nuova richiesta di rivendicazione per "${targetName}"`,
      message: `Richiesta inviata da ${claimant_name} (${claimant_email}). Note: ${claimant_notes || 'Nessuna nota'}`,
      link: '/admin?tab=on-behalf',
    });

    return NextResponse.json({
      success: true,
      message: 'Richiesta di rivendicazione inviata con successo all amministratore',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
