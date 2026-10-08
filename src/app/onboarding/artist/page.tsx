'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { dict } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { Mic2, MapPin, Music } from 'lucide-react';

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // 1. Update profiles table with display name and city
      await supabase
        .from('profiles')
        .update({
          display_name: name,
          city: city,
        })
        .eq('id', user.id);

      // 2. Insert into artists table with genre
      await supabase.from('artists').upsert({
        profile_id: user.id,
        genre: genre,
      });

      // Redirect straight to "Create your first event"
      router.push('/events/new');
    } catch (err: any) {
      setError(err?.message || 'Failed to save onboarding details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="glass-panel-glow rounded-2xl p-8 sm:p-10 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400">
            <Mic2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{dict.onboarding.artistTitle}</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {dict.onboarding.artistSubtitle}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mic2 className="w-3.5 h-3.5 text-pink-400" />
              <span>{dict.onboarding.artistNameLabel}</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 text-sm"
              placeholder="e.g. Luna & The Beats"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{dict.onboarding.cityLabel}</span>
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
              placeholder="e.g. Berlin, London, Rome..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-violet-400" />
              <span>{dict.onboarding.genreLabel}</span>
            </label>
            <input
              type="text"
              required
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 text-sm"
              placeholder="e.g. Indie Rock, Synthwave, Jazz Fusion..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-violet-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-95 transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {loading ? dict.common.loading : dict.onboarding.submitButton}
          </button>
        </form>
      </div>
    </div>
  );
}
