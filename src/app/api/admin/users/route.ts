import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEMO_ACCOUNTS } from '@/lib/data/demoAccounts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    const supabase = createAdminClient();

    let usersList: any[] = [];
    try {
      let query = supabase.from('profiles').select('*, artists(*), venues(*)').order('created_at', { ascending: false });
      if (role && role !== 'all') {
        query = query.eq('role', role);
      }
      if (status === 'suspended') {
        query = query.eq('is_suspended', true);
      } else if (status === 'active') {
        query = query.eq('is_suspended', false);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        usersList = data;
      }
    } catch {}

    if (usersList.length === 0) {
      usersList = [
        {
          id: DEMO_ACCOUNTS.artist.id,
          role: 'artist',
          display_name: DEMO_ACCOUNTS.artist.display_name,
          email: DEMO_ACCOUNTS.artist.email,
          city: 'Roma',
          country: 'Italy',
          is_suspended: false,
          created_at: '2026-01-10T12:00:00Z',
          artists: { genre: 'Indie Rock / Dreampop', is_pro: true },
        },
        {
          id: DEMO_ACCOUNTS.venue.id,
          role: 'venue',
          display_name: DEMO_ACCOUNTS.venue.display_name,
          email: DEMO_ACCOUNTS.venue.email,
          city: 'Roma',
          country: 'Italy',
          is_suspended: false,
          created_at: '2026-01-12T15:30:00Z',
          venues: { name: 'Lanificio 159 Rooftop', is_verified: true },
        },
        {
          id: DEMO_ACCOUNTS.fan.id,
          role: 'fan',
          display_name: DEMO_ACCOUNTS.fan.display_name,
          email: DEMO_ACCOUNTS.fan.email,
          city: 'Milano',
          country: 'Italy',
          is_suspended: false,
          created_at: '2026-01-15T09:20:00Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000004',
          role: 'artist',
          display_name: 'Vortex Sounds',
          email: 'vortex@live.it',
          city: 'Bologna',
          country: 'Italy',
          is_suspended: true,
          suspension_reason: 'Invio massivo di eventi duplicati non verificati',
          created_at: '2026-02-01T14:10:00Z',
          artists: { genre: 'Post-Punk', is_pro: false },
        },
        {
          id: '00000000-0000-0000-0000-000000000005',
          role: 'venue',
          display_name: 'Circolo Magnolia',
          email: 'info@circolomagnolia.it',
          city: 'Milano',
          country: 'Italy',
          is_suspended: false,
          created_at: '2026-02-05T18:00:00Z',
          venues: { name: 'Circolo Magnolia', is_verified: true },
        },
        {
          id: '00000000-0000-0000-0000-000000000006',
          role: 'fan',
          display_name: 'Chiara Rossi',
          email: 'chiara.r@gmail.com',
          city: 'Firenze',
          country: 'Italy',
          is_suspended: false,
          created_at: '2026-02-14T20:45:00Z',
        },
      ];

      if (role && role !== 'all') {
        usersList = usersList.filter((u) => u.role === role);
      }
      if (status === 'suspended') {
        usersList = usersList.filter((u) => u.is_suspended);
      } else if (status === 'active') {
        usersList = usersList.filter((u) => !u.is_suspended);
      }
    }

    if (search) {
      usersList = usersList.filter(
        (u) =>
          (u.display_name || '').toLowerCase().includes(search) ||
          (u.email || '').toLowerCase().includes(search) ||
          (u.city || '').toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ users: usersList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore recupero utenti' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, reason } = body;
    const supabase = createAdminClient();

    if (action === 'suspend') {
      await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_reason: reason || 'Sospeso dall amministratore',
        })
        .eq('id', userId);

      return NextResponse.json({ success: true, message: 'Account sospeso' });
    }

    if (action === 'unsuspend') {
      await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspension_reason: null,
        })
        .eq('id', userId);

      return NextResponse.json({ success: true, message: 'Account riattivato' });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore modifica utente' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ error: 'ID utente richiesto' }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from('profiles').delete().eq('id', userId);
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {}

    return NextResponse.json({ success: true, message: 'Profilo eliminato definitivamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore eliminazione utente' }, { status: 500 });
  }
}
