import { NextRequest, NextResponse } from 'next/server';
import { DEMO_ACCOUNTS } from '@/lib/data/demoAccounts';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();

    if (!role || !DEMO_ACCOUNTS[role]) {
      return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });
    }

    const demoUser = DEMO_ACCOUNTS[role];

    const response = NextResponse.json({
      success: true,
      user: demoUser,
    });

    // Set cookie that lives for 7 days
    response.cookies.set('openstage_demo_user', JSON.stringify(demoUser), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      httpOnly: false, // Accessible to client as well
    });

    if (role === 'admin') {
      response.cookies.set('openstage_admin_mfa_verified', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: true,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('openstage_demo_user');
  response.cookies.delete('openstage_admin_mfa_verified');
  return response;
}
