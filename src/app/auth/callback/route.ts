import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role');
  const next = searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // If user logged in and has role from OAuth query, ensure profile exists
        const chosenRole = role || user.user_metadata?.role || 'fan';
        const displayName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'OpenStage User';

        await supabase.from('profiles').upsert({
          id: user.id,
          role: chosenRole,
          display_name: displayName,
          avatar_url: user.user_metadata?.avatar_url || null,
        });

        if (chosenRole === 'artist') {
          return NextResponse.redirect(`${origin}/onboarding/artist`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to an error page or login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
