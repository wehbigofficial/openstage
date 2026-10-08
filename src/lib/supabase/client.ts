import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );

  // If client-side has a demo session cookie, wrap getUser/getSession to seamlessly return demo user
  if (typeof document !== 'undefined') {
    const rawDemo = document.cookie
      .split('; ')
      .find((row) => row.startsWith('openstage_demo_user='))
      ?.split('=')[1];

    if (rawDemo) {
      try {
        const demoUser = JSON.parse(decodeURIComponent(rawDemo));
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

        const originalGetSession = client.auth.getSession.bind(client.auth);
        client.auth.getSession = async () => {
          const res = await originalGetSession();
          if (!res.data.session) {
            return {
              data: {
                session: {
                  access_token: 'demo-token',
                  refresh_token: 'demo-refresh',
                  expires_in: 3600,
                  token_type: 'bearer',
                  user: demoUser as any,
                } as any,
              },
              error: null,
            };
          }
          return res;
        };
      } catch {
        // ignore parse error
      }
    }
  }

  return client;
}
