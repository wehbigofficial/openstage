import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getFutureEvents } from '@/lib/services/eventsService';
import { getEventUrl } from '@/lib/utils/slug';
import { Music, MapPin, Sparkles, Calendar } from 'lucide-react';

interface ArtistPageProps {
  params: Promise<{
    name: string;
  }>;
}

export const instant = false;

export default async function PublicArtistPage({ params }: ArtistPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const allEvents = await getFutureEvents();
  const artistEvents = allEvents.filter(
    (e) => e.artist_name.toLowerCase() === decodedName.toLowerCase()
  );

  const sample = artistEvents[0];
  const isPro = false; // By default non-pro demo

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-200">
      {/* Artist Header */}
      <div className="p-8 sm:p-10 rounded-3xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-violet-600 via-pink-600 to-cyan-500 flex items-center justify-center text-white text-4xl font-black shadow-2xl shrink-0">
          {decodedName.charAt(0)}
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Artista OpenStage
            </span>
            {sample?.genre && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 text-slate-300">
                {sample.genre}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {decodedName}
          </h1>
          <p className="text-sm text-slate-400">
            {sample ? `${sample.city}, ${sample.country}` : 'Città globale'}
          </p>
        </div>
      </div>

      {/* Non-Pro artist note */}
      {!isPro && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sei l'artista o il manager? Sblocca la tua biografia completa, link social e merchandising con OpenStage Pro.</span>
          </div>
          <Link
            href="/for-artists"
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition-colors"
          >
            Sblocca Bio PRO
          </Link>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-400" />
          <span>Prossimi Concerti ({artistEvents.length})</span>
        </h2>

        {artistEvents.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel border border-white/10 text-center text-slate-400 text-sm">
            Nessun concerto in programma al momento. Torna a controllare presto!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {artistEvents.map((evt) => (
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
                  <p className="text-xs text-cyan-400 truncate">{evt.venue_name}</p>
                  <p className="text-[11px] text-slate-400">{evt.city} • {evt.price_text}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
