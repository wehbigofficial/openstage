import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { findEventByIdOrSlug } from '@/lib/services/eventsService';
import { getEventUrl } from '@/lib/utils/slug';

export const instant = false;

async function LegacyRedirect({ paramsPromise }: { paramsPromise: Promise<{ city: string }> }) {
  const { city } = await paramsPromise;
  const event = await findEventByIdOrSlug(city);

  if (!event) {
    notFound();
  }

  redirect(getEventUrl(event));
  return null;
}

export default function LegacyEventPage({ params }: { params: Promise<{ city: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LegacyRedirect paramsPromise={params} />
    </Suspense>
  );
}
