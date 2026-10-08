import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );

  // Check for openstage_demo_user cookie on server side
  const demoCookie = cookieStore.get('openstage_demo_user')?.value;
  if (demoCookie) {
    try {
      const demoUser = JSON.parse(decodeURIComponent(demoCookie));
      const originalGetUser = client.auth.getUser.bind(client.auth);
      client.auth.getUser = async (jwt?: string) => {
        const res = await originalGetUser(jwt);
        if (!res.data.user) {
          return {
            data: {
              user: {
                ...demoUser,
                app_metadata: {},
              } as any,
            },
            error: null,
          };
        }
        return res;
      };
    } catch {
      // ignore
    }
  }

  return client;
}
