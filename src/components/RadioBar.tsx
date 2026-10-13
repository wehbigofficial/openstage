'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getEventUrl } from '@/lib/utils/slug';
import { ReportTrackModal } from '@/components/ReportTrackModal';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Flag,
  ChevronDown,
  ChevronUp,
  Radio,
  ExternalLink,
  Calendar,
} from 'lucide-react';

interface RadioStreamState {
  isLive: boolean;
  minTracksRequired?: number;
  currentApprovedCount?: number;
  currentTrack: {
    id: string;
    title: string;
    artist_name: string;
    audio_url: string;
    duration_seconds: number;
    artist_id: string;
    likes_count?: number;
  } | null;
  offsetSeconds: number;
  serverTime: number;
  nextTrack?: {
    id: string;
    title: string;
    artist_name: string;
  };
  nextEvent?: {
    id: string;
    title: string;
    starts_at: string;
    city: string;
    venue_name: string;
  } | null;
}

export function RadioBar() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [streamState, setStreamState] = useState<RadioStreamState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playTimerRef = useRef<number>(0);
  const playCountedRef = useRef<boolean>(false);
  const currentTrackIdRef = useRef<string | null>(null);

  // Fetch current live radio synchronization state
  const fetchCurrentRadio = useCallback(async () => {
    try {
      const res = await fetch('/api/radio/current');
      if (res.ok) {
        const data = await res.json();
        setStreamState(data);

        if (data.currentTrack) {
          // If track changed, reset play timer
          if (currentTrackIdRef.current !== data.currentTrack.id) {
            currentTrackIdRef.current = data.currentTrack.id;
            playTimerRef.current = 0;
            playCountedRef.current = false;
            setLikesCount(data.currentTrack.likes_count || 0);
            setLiked(false);

            // If audio was already playing, sync to new track seamlessly
            if (audioRef.current && isPlaying) {
              const nowOffset = data.offsetSeconds + (Date.now() - data.serverTime) / 1000;
              audioRef.current.src = data.currentTrack.audio_url;
              audioRef.current.currentTime = Math.max(0, nowOffset);
              audioRef.current.play().catch(() => setIsPlaying(false));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching live radio current track:', err);
    }
  }, [isPlaying]);

  useEffect(() => {
    fetchCurrentRadio();
    // Poll synchronization every 25 seconds
    const interval = setInterval(fetchCurrentRadio, 25000);
    return () => clearInterval(interval);
  }, [fetchCurrentRadio]);

  // Audio setup
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const handleEnded = () => {
      fetchCurrentRadio();
    };

    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      playTimerRef.current += 0.25;

      // After 30 seconds of listening, record play count
      if (playTimerRef.current >= 30 && !playCountedRef.current && streamState?.currentTrack?.id) {
        playCountedRef.current = true;
        fetch('/api/radio/play-counted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: streamState.currentTrack.id }),
        }).catch(() => {});
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [streamState?.currentTrack?.id, fetchCurrentRadio]);

  // Handle Play / Pause
  const togglePlay = () => {
    if (!audioRef.current || !streamState?.currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Synchronize exact offset: offsetSeconds + clientElapsed
      const nowOffset =
        streamState.offsetSeconds + (Date.now() - streamState.serverTime) / 1000;

      if (!audioRef.current.src || audioRef.current.src !== streamState.currentTrack.audio_url) {
        audioRef.current.src = streamState.currentTrack.audio_url;
      }

      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.currentTime = Math.max(0, nowOffset);

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Playback prevented by browser:', err);
          setIsPlaying(false);
        });
    }
  };

  // Handle Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Handle Like
  const handleLike = async () => {
    if (!streamState?.currentTrack?.id) return;
    try {
      const res = await fetch('/api/radio/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: streamState.currentTrack.id }),
      });
      if (res.ok) {
        const json = await res.json();
        setLiked(json.liked);
        setLikesCount(json.likesCount);
      }
    } catch {}
  };

  // The bar stays hidden until minimum approved tracks count is reached
  if (!streamState || !streamState.isLive || !streamState.currentTrack) {
    return null;
  }

  const { currentTrack, nextEvent } = streamState;
  const artistUrl = `/artists/${encodeURIComponent(currentTrack.artist_name)}`;

  return (
    <>
      {/* Floating Pill when Collapsed */}
      {isCollapsed ? (
        <div className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#0A0A14]/95 border border-cyan-500/30 shadow-2xl backdrop-blur-xl text-white">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                {currentTrack.title}
              </span>
              <span className="text-slate-400 text-[11px] truncate max-w-[100px] hidden sm:inline">
                • {currentTrack.artist_name}
              </span>
            </div>

            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title="Espandi Radio Player"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Bottom Player Bar */
        <div
          id="radio-bar-container"
          className="fixed bottom-0 left-0 right-0 z-30 bg-[#090812]/95 backdrop-blur-xl border-t border-cyan-500/20 px-3 sm:px-6 py-2.5 shadow-2xl animate-in slide-in-from-bottom duration-200"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
            {/* Left: Stream badge, Live equalizer, Now playing track info */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>{t.radio.badgeLive}</span>
                </div>

                {/* Animated Equalizer */}
                <div className="flex items-end gap-0.5 h-4 w-4 shrink-0">
                  <span className={`w-1 bg-cyan-400 rounded-full transition-all duration-150 ${isPlaying ? 'h-4 animate-bounce' : 'h-1.5'}`} />
                  <span className={`w-1 bg-pink-400 rounded-full transition-all duration-200 ${isPlaying ? 'h-3 animate-pulse' : 'h-2'}`} />
                  <span className={`w-1 bg-violet-400 rounded-full transition-all duration-100 ${isPlaying ? 'h-4 animate-bounce' : 'h-1'}`} />
                </div>
              </div>

              {/* Track Info */}
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-black text-white truncate max-w-[180px] sm:max-w-xs">
                    {currentTrack.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{t.radio.byArtist}</span>
                  <Link
                    href={artistUrl}
                    className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline truncate max-w-[140px]"
                  >
                    {currentTrack.artist_name}
                  </Link>
                </div>
              </div>

              {/* Collapse button on mobile */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title="Riduci a pill"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Center: Controls (Play/Pause, Like, Next gig link) */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Play / Pause button */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white flex items-center justify-center shadow-lg shadow-pink-600/20 active:scale-95 transition-all"
                title={isPlaying ? 'Pausa' : 'Riproduci stream live'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                )}
              </button>

              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
                  liked
                    ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-pink-400 hover:bg-white/10'
                }`}
                title="Mi piace questo brano"
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-pink-400 text-pink-400' : ''}`} />
                <span className="text-[11px] font-mono">{likesCount}</span>
              </button>

              {/* Next Event Link */}
              {nextEvent ? (
                <Link
                  href={getEventUrl(nextEvent as any)}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-[11px] font-semibold text-violet-300 transition-colors truncate max-w-[220px]"
                  title={`Prossimo live: ${nextEvent.title}`}
                >
                  <Calendar className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="truncate">{nextEvent.city}: {nextEvent.title}</span>
                </Link>
              ) : null}
            </div>

            {/* Right: Volume, Report, Collapse */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Volume Slider */}
              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <button
                  onClick={toggleMute}
                  className="p-1 hover:text-white transition-colors"
                  title={isMuted ? 'Riattiva audio' : 'Muto'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Report button */}
              <button
                onClick={() => setReportModalOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors text-xs"
                title={t.radio.reportTrack}
              >
                <Flag className="w-3.5 h-3.5" />
              </button>

              {/* Collapse to Pill Button */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden md:flex items-center gap-1 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs"
                title="Riduci player a icona"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <ReportTrackModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          trackId={currentTrack.id}
          trackTitle={currentTrack.title}
          artistName={currentTrack.artist_name}
        />
      )}
    </>
  );
}
