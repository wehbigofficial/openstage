'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dict } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { PlusCircle, AlertCircle, Info } from 'lucide-react';

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [genre, setGenre] = useState('');
  const [priceText, setPriceText] = useState('Free entry');
  const [isFree, setIsFree] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login?next=/events/new');
        return;
      }
      setUser(user);
      setLoading(false);
    }
    loadUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);
      const supabase = createClient();

      const isEmailConfirmed = Boolean(user.email_confirmed_at);
      const initialStatus = isEmailConfirmed ? 'published' : 'draft';

      const { data, error } = await supabase.from('events').insert({
        owner_id: user.id,
        title,
        venue_name: venueName,
        address,
        starts_at: new Date(startsAt).toISOString(),
        genre,
        price_text: priceText,
        is_free: isFree,
        status: initialStatus,
      }).select().single();

      if (error) {
        throw error;
      }

      if (!isEmailConfirmed) {
        setStatusMessage(
          'Your event has been saved as a Draft! Once you confirm your email address, it will automatically publish to the public live directory.'
        );
      } else {
        setStatusMessage('Your event has been published successfully!');
        setTimeout(() => {
          router.push('/explore');
        }, 2000);
      }
    } catch (err: any) {
      setStatusMessage(`Error creating event: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">
        {dict.common.loading}
      </div>
    );
  }

  const isEmailConfirmed = Boolean(user?.email_confirmed_at);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Your Event</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Fill in the live show details to put it on the OpenStage directory
            </p>
          </div>
        </div>

        {!isEmailConfirmed && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold mb-1">Email verification pending</p>
              <p>
                Email confirmation is required before an event can be published. Until confirmed, your event will remain saved as a Draft and publish automatically once verified.
              </p>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
              placeholder="e.g. Neon Horizon Tour - Live at SubClub"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Venue / Place Name
              </label>
              <input
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="e.g. The Electric Lounge"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Address / City
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="e.g. 42 Cyber Street, Berlin"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Date and Time
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Music Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="e.g. Post-Punk, Synthwave"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isFree"
              checked={isFree}
              onChange={(e) => {
                setIsFree(e.target.checked);
                if (e.target.checked) setPriceText('Free entry');
              }}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400"
            />
            <label htmlFor="isFree" className="text-xs text-slate-300 cursor-pointer">
              Free Admission / No tickets required
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-violet-600/20 active:scale-[0.98] disabled:opacity-50 mt-4"
          >
            {submitting ? dict.common.loading : 'Save & Publish Event'}
          </button>
        </form>
      </div>
    </div>
  );
}
