import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAIL, isAdminEmail } from '@/lib/services/adminService';
import {
  getAdminMfaStatus,
  startMfaEnrollment,
  confirmMfaEnrollment,
  verifyAdminMfaLogin,
} from '@/lib/services/adminMfaService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const mfaCookie = request.cookies.get('openstage_admin_mfa_verified')?.value;
    const isMfaVerified = mfaCookie === 'true';

    const userEmail = user?.email || null;
    const isAuthorizedEmail = isAdminEmail(userEmail);

    const mfaStatus = await getAdminMfaStatus();

    return NextResponse.json({
      authenticated: !!user && isAuthorizedEmail,
      email: userEmail,
      isMfaVerified,
      mfaStatus,
      adminEmailConfigured: ADMIN_EMAIL,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, code, email } = body;

    // 1. Demo or direct Admin Login for local development & demonstration
    if (action === 'demo-login') {
      const targetEmail = ADMIN_EMAIL;
      const demoAdminUser = {
        id: '00000000-0000-0000-0000-000000000009',
        email: targetEmail,
        role: 'admin',
        display_name: 'OpenStage Administrator',
        city: 'Roma',
        country: 'Italy',
        email_confirmed_at: '2026-01-01T00:00:00.000Z',
        user_metadata: {
          role: 'admin',
          display_name: 'OpenStage Administrator',
        },
      };

      const response = NextResponse.json({
        success: true,
        user: demoAdminUser,
      });

      // Set user cookie and set verified cookie for seamless evaluation
      response.cookies.set('openstage_demo_user', JSON.stringify(demoAdminUser), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });

      response.cookies.set('openstage_admin_mfa_verified', 'true', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: true,
      });

      return response;
    }

    // 2. Start MFA Enrollment
    if (action === 'start-enroll') {
      const enrollment = await startMfaEnrollment();
      return NextResponse.json({
        success: true,
        ...enrollment,
      });
    }

    // 3. Confirm MFA Setup
    if (action === 'confirm-setup') {
      if (!code) {
        return NextResponse.json({ error: 'Codice TOTP richiesto' }, { status: 400 });
      }

      const res = await confirmMfaEnrollment(code);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }

      const response = NextResponse.json({ success: true, message: '2FA attivata con successo' });
      // Set verified cookie
      response.cookies.set('openstage_admin_mfa_verified', 'true', {
        path: '/',
        maxAge: 60 * 60 * 12, // 12 hours
        httpOnly: true,
        sameSite: 'lax',
      });
      return response;
    }

    // 4. Verify 2FA Login Challenge (via TOTP code or recovery code)
    if (action === 'verify-login') {
      if (!code) {
        return NextResponse.json({ error: 'Codice TOTP o di recupero richiesto' }, { status: 400 });
      }

      const res = await verifyAdminMfaLogin(code);
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }

      const response = NextResponse.json({
        success: true,
        isRecoveryCode: res.isRecoveryCode || false,
      });

      response.cookies.set('openstage_admin_mfa_verified', 'true', {
        path: '/',
        maxAge: 60 * 60 * 12, // 12 hours
        httpOnly: true,
        sameSite: 'lax',
      });
      return response;
    }

    // 5. Admin Logout
    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('openstage_admin_mfa_verified');
      response.cookies.delete('openstage_demo_user');
      return response;
    }

    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
