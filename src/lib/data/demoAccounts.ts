export interface DemoUser {
  id: string;
  email: string;
  role: 'artist' | 'venue' | 'fan';
  display_name: string;
  city: string;
  country: string;
  email_confirmed_at: string;
  user_metadata: {
    role: string;
    display_name: string;
  };
}

export const DEMO_ACCOUNTS: Record<string, DemoUser> = {
  artist: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'artist.demo@openstage.live',
    role: 'artist',
    display_name: 'Luna Velata (Band)',
    city: 'Roma',
    country: 'Italy',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    user_metadata: {
      role: 'artist',
      display_name: 'Luna Velata (Band)',
    },
  },
  venue: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'venue.demo@openstage.live',
    role: 'venue',
    display_name: 'Lanificio 159 Rooftop',
    city: 'Roma',
    country: 'Italy',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    user_metadata: {
      role: 'venue',
      display_name: 'Lanificio 159 Rooftop',
    },
  },
  fan: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'fan.demo@openstage.live',
    role: 'fan',
    display_name: 'Alex Explorer',
    city: 'Milano',
    country: 'Italy',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    user_metadata: {
      role: 'fan',
      display_name: 'Alex Explorer',
    },
  },
};
