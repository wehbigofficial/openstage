import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findEventByIdOrSlug, getAllEvents, getFutureEvents } from '@/lib/services/eventsService';
import EventPageClient from '@/components/EventPageClient';
import { getEventUrl } from '@/lib/utils/slug';

interface EventPageProps {
  params: Promise<{
    city: string;
    slug: string;
  }>;
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { city, slug } = await params;
  const event = await findEventByIdOrSlug(slug);

  if (!event) {
    return {
      title: 'Evento non trovato | OpenStage',
      description: 'Questo concerto potrebbe essere terminato o l’URL non è corretto.',
    };
  }

  const title = `${event.title} - ${event.artist_name} @ ${event.venue_name} | OpenStage`;
  const description = `${event.title} dal vivo a ${event.venue_name} (${event.city}). Genere: ${event.genre}. Trova biglietti e informazioni ufficiali su OpenStage.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://openstage.live${getEventUrl(event)}`,
      siteName: 'OpenStage',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export const instant = false;

export default async function EventPage({ params }: EventPageProps) {
  const { city, slug } = await params;
  const event = await findEventByIdOrSlug(slug);

  if (!event) {
    notFound();
  }

  // Fetch contextual events: more by artist, more at venue, nearby
  const allEvents = await getFutureEvents();
  const artistEvents = allEvents.filter(
    (e) => e.artist_name.toLowerCase() === event.artist_name.toLowerCase() && e.id !== event.id
  );
  const venueEvents = allEvents.filter(
    (e) => e.venue_name.toLowerCase() === event.venue_name.toLowerCase() && e.id !== event.id
  );
  const nearbyEvents = allEvents.filter(
    (e) => e.city.toLowerCase() === event.city.toLowerCase() && e.id !== event.id
  );

  // Schema.org JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: event.title,
    startDate: event.starts_at,
    endDate: new Date(new Date(event.starts_at).getTime() + 3 * 3600 * 1000).toISOString(),
    eventStatus:
      event.status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue_name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.approximate_location ? undefined : event.address,
        addressLocality: event.city,
        addressCountry: event.country,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: event.lat,
        longitude: event.lng,
      },
    },
    image: [event.image_url],
    description: event.description || `${event.title} live at ${event.venue_name}`,
    performer: {
      '@type': 'MusicGroup',
      name: event.artist_name,
    },
    offers: {
      '@type': 'Offer',
      url: event.ticket_url || `https://openstage.live${getEventUrl(event)}`,
      price: event.is_free ? '0' : event.price_text.replace(/[^0-9.]/g, '') || '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventPageClient
        event={event}
        artistEvents={artistEvents}
        venueEvents={venueEvents}
        nearbyEvents={nearbyEvents}
      />
    </>
  );
}
