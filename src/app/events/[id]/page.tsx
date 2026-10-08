import { redirect, notFound } from 'next/navigation';
import { findEventByIdOrSlug } from '@/lib/services/eventsService';
import { getEventUrl } from '@/lib/utils/slug';

interface LegacyEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const instant = false;

export default async function LegacyEventPage({ params }: LegacyEventPageProps) {
  const { id } = await params;
  const event = await findEventByIdOrSlug(id);

  if (!event) {
    notFound();
  }

  // Canonical 301/permanent redirect to new SEO readable URL /events/[city]/[slug]
  redirect(getEventUrl(event));
}
