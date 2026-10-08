import { ImageResponse } from 'next/og';
import { findEventByIdOrSlug } from '@/lib/services/eventsService';

export const alt = 'OpenStage Live Event';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ city: string; slug: string }>;
}) {
  const { slug } = await params;
  const event = await findEventByIdOrSlug(slug);

  const title = event?.title || 'OpenStage Live Show';
  const artist = event?.artist_name || 'Independent Live Music';
  const venue = event?.venue_name || 'Live Venue';
  const city = event?.city || 'Global';
  const dateStr = event?.starts_at
    ? new Date(event.starts_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Upcoming Show';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#090912',
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(236, 72, 153, 0.25) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.25) 0%, transparent 40%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#ec4899',
              }}
            />
            <span
              style={{
                fontSize: '28px',
                fontWeight: 900,
                letterSpacing: '4px',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              OPENSTAGE
            </span>
          </div>

          <div
            style={{
              padding: '8px 24px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              fontSize: '20px',
              fontWeight: 700,
              color: '#38bdf8',
            }}
          >
            {event?.genre || 'LIVE EVENT'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            {artist}
          </span>
          <span
            style={{
              fontSize: '64px',
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#ffffff',
              maxWidth: '950px',
            }}
          >
            {title}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '32px',
          }}
        >
          <div style={{ display: 'flex', gap: '48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '16px', color: '#94a3b8', textTransform: 'uppercase' }}>
                Date
              </span>
              <span style={{ fontSize: '26px', fontWeight: 700, color: '#f43f5e' }}>
                {dateStr}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '16px', color: '#94a3b8', textTransform: 'uppercase' }}>
                Venue & City
              </span>
              <span style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff' }}>
                {venue} • {city}
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: '20px',
              fontFamily: 'monospace',
              color: '#64748b',
            }}
          >
            openstage.live
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
