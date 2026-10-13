import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, action } = body;

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Report ID e action richiesti' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (action === 'dismiss') {
      const { error } = await supabase
        .from('radio_reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}