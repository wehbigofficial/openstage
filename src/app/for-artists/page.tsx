import { Metadata } from 'next';
import Link from 'next/link';
import { dict } from '@/lib/dictionary';
import { Mic2, Radio, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Artists | OpenStage',
  description: 'Everything indie artists need to share gigs and connect with fans worldwide.',
};

export default function ForArtistsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-pink-400 mb-4 border border-pink-500/30">
          <Mic2 className="w-3.5 h-3.5" />
          <span>Artists & Bands</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Own your live shows. Zero fees.
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-base">
          OpenStage gives independent musicians a clean, direct channel to announce gigs, reach local audiences, and grow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <CheckCircle2 className="w-6 h-6 text-pink-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">100% Free</h3>
          <p className="text-sm text-slate-400">
            Publish unlimited live events without booking cuts or listing fees.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <Radio className="w-6 h-6 text-cyan-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Indie Radio Rotation</h3>
          <p className="text-sm text-slate-400">
            Get your tracks featured on the OpenStage live stream automatically.
          </p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/10">
          <CheckCircle2 className="w-6 h-6 text-violet-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Instant Fan Reminders</h3>
          <p className="text-sm text-slate-400">
            Fans get one-click alerts when you announce new dates in their area.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/auth/signup?role=artist"
          className="inline-block px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-semibold shadow-lg shadow-pink-500/20 hover:opacity-95 transition-all text-sm"
        >
          Sign up as an Artist
        </Link>
      </div>
    </div>
  );
}
