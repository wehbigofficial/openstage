'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dict } from '@/lib/dictionary';
import { QuickAuthModal } from '@/components/QuickAuthModal';
import { Sparkles, Calendar, Bookmark, Bell, Music2 } from 'lucide-react';

export default function HomePage() {
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  return (
    <div className="relative isolate px-4 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#8B5CF6] to-[#22D3EE] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="max-w-4xl mx-auto pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs text-cyan-400 mb-6 border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Independent Live Music Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
          Discover Live Music.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400">
            Independent & Worldwide.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {dict.home.heroSubtitle}
        </p>

        {/* Demo Quick actions for Guests: Save & Remind */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/events/new"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 hover:opacity-95 transition-all"
          >
            {dict.home.createYourFirstEvent}
          </Link>
          <button
            onClick={() => setQuickModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40 text-sm font-medium transition-all"
          >
            <Bookmark className="w-4 h-4 text-cyan-400" />
            <span>{dict.common.save} (Guest Preview)</span>
          </button>
          <button
            onClick={() => setQuickModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-pink-400/40 text-sm font-medium transition-all"
          >
            <Bell className="w-4 h-4 text-pink-400" />
            <span>{dict.common.remind} (Guest Preview)</span>
          </button>
        </div>

        {/* Empty state container */}
        <div className="rounded-2xl glass-panel p-10 sm:p-14 text-center border border-white/10 max-w-xl mx-auto">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-5">
            <Music2 className="w-7 h-7 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{dict.home.emptyTitle}</h2>
          <p className="text-sm text-slate-400 mb-6">{dict.home.emptySubtitle}</p>
          <Link
            href="/auth/signup?role=artist"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>Join as an artist to post a gig &rarr;</span>
          </Link>
        </div>
      </div>

      <QuickAuthModal isOpen={quickModalOpen} onClose={() => setQuickModalOpen(false)} />
    </div>
  );
}
