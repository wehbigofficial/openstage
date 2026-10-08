'use client';

import React from 'react';
import { Calendar, MapPin, Music } from 'lucide-react';

interface PosterGeneratorProps {
  title: string;
  artistName: string;
  dateStr: string;
  venueName: string;
  city: string;
  genre?: string;
  theme?: 'neon' | 'noir' | 'sunset' | 'acid';
}

export const BrandPosterPreview = React.forwardRef<HTMLDivElement, PosterGeneratorProps>(
  ({ title, artistName, dateStr, venueName, city, genre, theme = 'neon' }, ref) => {
    // Theme gradients
    const themes = {
      neon: 'from-violet-950 via-slate-950 to-cyan-950 border-cyan-500/40',
      noir: 'from-zinc-950 via-neutral-900 to-black border-zinc-700/50',
      sunset: 'from-pink-950 via-purple-950 to-amber-950 border-pink-500/40',
      acid: 'from-emerald-950 via-slate-950 to-yellow-950 border-emerald-500/40',
    };

    const accentGradients = {
      neon: 'from-cyan-400 via-pink-500 to-violet-500',
      noir: 'from-zinc-200 via-neutral-400 to-white',
      sunset: 'from-amber-400 via-pink-500 to-purple-600',
      acid: 'from-emerald-400 via-lime-400 to-yellow-300',
    };

    return (
      <div
        ref={ref}
        id="generated-poster-canvas"
        className={`relative w-full aspect-[4/5] bg-gradient-to-b ${themes[theme]} p-8 sm:p-10 flex flex-col justify-between overflow-hidden rounded-2xl border shadow-2xl text-left select-none`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Background ambient lighting effects */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

        {/* Header brand tag */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase text-white/90">
              OPENSTAGE LIVE
            </span>
          </div>
          {genre && (
            <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10 uppercase">
              {genre}
            </span>
          )}
        </div>

        {/* Center: Title & Artist typography */}
        <div className="relative z-10 my-auto py-6 space-y-4">
          <div className="flex items-center gap-2 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide">
            <Music className="w-4 h-4 shrink-0" />
            <span className="uppercase tracking-widest">{artistName || 'Artist / Performer'}</span>
          </div>
          
          <h1
            className={`text-3xl sm:text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${accentGradients[theme]} leading-[1.05]`}
          >
            {title || 'Live Performance Tour'}
          </h1>
        </div>

        {/* Footer: Date, Location & OpenStage mark */}
        <div className="relative z-10 pt-4 border-t border-white/15 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                <span>Data & Ora</span>
              </div>
              <p className="text-white font-bold text-xs sm:text-sm tracking-wide">
                {dateStr || 'Prossimamente'}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Venue & Città</span>
              </div>
              <p className="text-white font-bold text-xs sm:text-sm truncate">
                {venueName || 'Secret Venue'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {city || 'Location riservata'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-slate-500 font-mono">
            <span>openstage.live</span>
            <span>NO TICKET FEES • INDIE MUSIC</span>
          </div>
        </div>
      </div>
    );
  }
);

BrandPosterPreview.displayName = 'BrandPosterPreview';
