import { MetadataRoute } from 'next';
import { getAllEvents } from '@/lib/services/eventsService';
import { getEventUrl } from '@/lib/utils/slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://openstage.live';
  const events = await getAllEvents();

  const eventEntries = events.map((evt) => ({
    url: `${baseUrl}${getEventUrl(evt)}`,
    lastModified: new Date(evt.created_at || evt.starts_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const staticEntries = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/for-artists`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-venues`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  return [...staticEntries, ...eventEntries];
}
