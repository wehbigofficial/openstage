import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFutureEvents } from '@/lib/services/eventsService';
import { getEventUrl } from '@/lib/utils/slug';
import { Building, MapPin, Calendar, ExternalLink } from 'lucide-react';

interface VenuePageProps {
  params: Promise<{
    name: string;
  }>;
}

export const instant = false;

export default async function PublicVenuePage({ params }: VenuePageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const allEvents = await getFutureEvents();
  const venueEvents = allEvents.filter(
    (e) => e.venue_name.toLowerCase() === decodedName.toLowerCase()
  );

  const sample = venueEvents[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-200">
      {/* Venue Header */}
      <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shrink-0">
          <Building className="w-12 h-12" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Locale & Venue
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {decodedName}
          </h1>
          <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <MapPin className="w-4 h-4 text-pink-400" />
            <span>{sample ? sample.address || `${sample.city}, ${sample.country}` : 'Location live'}</span>
          </p>
        </div>
      </div>

      {/* Upcoming Events at this venue */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <span>Eventi in programma ({venueEvents.length})</span>
        </h2>

        {venueEvents.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel border border-white/10 text-center text-slate-400 text-sm">
            Nessun evento futuro registrato per questo locale.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {venueEvents.map((evt) => (
              <Link
                key={evt.id}
                href={getEventUrl(evt)}
                className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-white/20 transition-all flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                  <img src={evt.image_url} alt={evt.title} className="w-full h-full object-cover" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{evt.title}</p>
                  <p className="text-xs text-pink-400 truncate">{evt.artist_name}</p>
                  <p className="text-[11px] text-slate-400">{evt.starts_at ? new Date(evt.starts_at).toLocaleDateString('it-IT') : ''} • {evt.price_text}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
