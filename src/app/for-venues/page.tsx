import { Metadata } from 'next';
import Link from 'next/link';
import { Building2, CalendarCheck, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Venues & Organizers | OpenStage',
  description: 'Promote live venues, club stages, and festivals on OpenStage.',
};

export default function ForVenuesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-violet-400 mb-4 border border-violet-500/30">
          <Building2 className="w-3.5 h-3.5" />
          <span>Venues & Promoters</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Put your stage on the map.
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-base">
          From basement bars to indie concert halls, list your upcoming events and connect with touring bands.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <CalendarCheck className="w-6 h-6 text-violet-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Effortless Calendars</h3>
          <p className="text-sm text-slate-400">
            Publish single shows or monthly residencies in minutes.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <ShieldCheck className="w-6 h-6 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Verified Venue Badges</h3>
          <p className="text-sm text-slate-400">
            Gain trust with verified listings and official venue management.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <Building2 className="w-6 h-6 text-pink-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Local Community</h3>
          <p className="text-sm text-slate-400">
            Reach music discovery seekers who live around your neighborhood.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/auth/signup?role=venue"
          className="inline-block px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold shadow-lg shadow-violet-600/20 hover:opacity-95 transition-all text-sm"
        >
          Sign up as Venue / Organizer
        </Link>
      </div>
    </div>
  );
}
