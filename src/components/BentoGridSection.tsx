'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Compass,
  Radio,
  Sparkles,
  Users,
  Building2,
  Music2,
  CalendarDays,
  Globe2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2,
} from 'lucide-react';

interface BentoGridSectionProps {
  stats: {
    artistsCount: number;
    eventsCount: number;
    citiesCount: number;
  };
}

export function BentoGridSection({ stats }: BentoGridSectionProps) {
  const [animatedStats, setAnimatedStats] = useState({
    artists: 0,
    events: 0,
    cities: 0,
  });
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Trigger counter animation on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 1600;
          const steps = 30;
          const stepTime = duration / steps;
          let currentStep = 0;

          const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easeOutQuad = (t: number) => t * (2 - t);
            const factor = easeOutQuad(progress);

            setAnimatedStats({
              artists: Math.floor(stats.artistsCount * factor),
              events: Math.floor(stats.eventsCount * factor),
              cities: Math.floor(stats.citiesCount * factor),
            });

            if (currentStep >= steps) {
              clearInterval(interval);
              setAnimatedStats({
                artists: stats.artistsCount,
                events: stats.eventsCount,
                cities: stats.citiesCount,
              });
            }
          }, stepTime);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, stats]);

  return (
    <section ref={sectionRef} className="w-full pt-16 pb-20 space-y-12">
      {/* Animated Database Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-cyan-400 opacity-60" />
          <div className="flex items-center justify-center gap-2 text-violet-400 mb-2">
            <Music2 className="w-5 h-5" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Active Artists
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white">
            {animatedStats.artists}
            <span className="text-violet-400">+</span>
          </div>
          <p className="text-xs text-slate-400">Independent musicians & bands</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-pink-500 opacity-60" />
          <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
            <CalendarDays className="w-5 h-5" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Upcoming Shows
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white">
            {animatedStats.events}
            <span className="text-cyan-400">+</span>
          </div>
          <p className="text-xs text-slate-400">Published live gigs worldwide</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/10 text-center space-y-1 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 to-violet-500 opacity-60" />
          <div className="flex items-center justify-center gap-2 text-pink-400 mb-2">
            <Globe2 className="w-5 h-5" />
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Cities Connected
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white">
            {animatedStats.cities}
            <span className="text-pink-400">+</span>
          </div>
          <p className="text-xs text-slate-400">Global underground music scenes</p>
        </div>
      </div>

      {/* Bento Grid Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-semibold text-cyan-400 border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The OpenStage Ecosystem</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How Live Music Connects Worldwide
        </h2>
        <p className="text-sm text-slate-400">
          A decentralized platform built from the ground up for artists, underground venues, and true music lovers.
        </p>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Block 1: How it works (3 steps) - Spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2 glass-panel p-7 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
              <Compass className="w-4 h-4" />
              <span>How It Works</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Three simple steps to the sound.
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Discover authentic music culture without algorithms dictating your taste.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-extrabold text-xs flex items-center justify-center">
                01
              </div>
              <h4 className="font-semibold text-white text-sm">Spin or Locate</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore the 3D globe or tap Near Me to reveal live shows in your vicinity.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 font-extrabold text-xs flex items-center justify-center">
                02
              </div>
              <h4 className="font-semibold text-white text-sm">Discover Indie Talents</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter by genre, listen to previews, and bookmark shows with zero fees.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-300 font-extrabold text-xs flex items-center justify-center">
                03
              </div>
              <h4 className="font-semibold text-white text-sm">Join the Stage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Show up, meet grassroots creators, or list your own gig in 60 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Block 2: For Artists Block */}
        <div className="glass-panel p-7 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between space-y-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-cyan-500/10 text-cyan-400">
              <Music2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">For Artists</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              List your gig free in 60 seconds. Keep 100% of your ticket revenue and connect directly with a worldwide indie fanbase.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/events/new"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-xs sm:text-sm hover:opacity-95 shadow-lg shadow-violet-600/20 transition-all text-center"
            >
              <span>List your gig free in 60s</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-artists"
              className="w-full block text-center text-xs text-slate-400 hover:text-cyan-300 transition-colors py-1"
            >
              Learn about Artist Pro perks &rarr;
            </Link>
          </div>
        </div>

        {/* Block 3: For Venues and Organizers Block */}
        <div className="glass-panel p-7 sm:p-8 rounded-3xl border border-white/10 flex flex-col justify-between space-y-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">For Venues & Organizers</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Free to list, Venue Pro free trial, plans in your dashboard. Manage door lists, verified line-ups, and reach thousands of local concert seekers.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/for-venues"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 text-center"
            >
              <span>Venue Pro Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="text-center text-[11px] text-slate-400">
              No credit card required for standard listings
            </div>
          </div>
        </div>

        {/* Block 4: Free Radio Teaser - Spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2 glass-panel p-7 sm:p-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-violet-500/20 border border-pink-500/30 text-pink-400 shrink-0">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-[11px] font-bold text-pink-300">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
              <span>Free 24/7 Radio Stream</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              OpenStage Underground Radio
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Continuous live stream broadcasting emerging indie tracks, live soundboard recordings, and DJ sets straight from performing acts.
            </p>

            {/* Soundwave animation */}
            <div className="flex items-center justify-center sm:justify-start gap-1 pt-2">
              <span className="w-1 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-7 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-8 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="w-1 h-5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              <span className="text-xs text-slate-400 pl-3">Live stream ready in bottom bar</span>
            </div>
          </div>
        </div>

        {/* Block 5: Artist Pro Teaser - Spans 2 columns */}
        <div className="md:col-span-2 lg:col-span-2 glass-panel p-7 sm:p-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-cyan-500/20 border border-violet-500/30 text-violet-400 shrink-0">
            <Zap className="w-8 h-8" />
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-[11px] font-bold text-violet-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Artist Pro Suite</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Level up your touring career
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Auto-generated Electronic Press Kits (EPK), direct venue booking requests, crowd geolocation analytics, and verified artist badges.
            </p>
            <div className="pt-2">
              <Link
                href="/for-artists"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Explore Artist Pro features</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
