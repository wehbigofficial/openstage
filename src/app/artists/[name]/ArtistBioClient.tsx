'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { format } from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import {
  Music,
  Calendar,
  MapPin,
  Heart,
  Bookmark,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Camera,
  PlayCircle,
  Music2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface ArtistData {
  artist: any;
  profiles: any;
  events: any[];
  radioTracks: any[];
  stats: any;
}

interface ArtistBioClientProps {
  dict: any;
  locale: 'it' | 'en';
  artistData: ArtistData;
}

export default function ArtistBioClient({ dict, locale, artistData }: ArtistBioClientProps) {
  const { t } = useLanguage();
  const isIt = locale === 'it';
  const dateLocale = isIt ? it : enUS;

  const { artist, profiles, events, radioTracks, stats } = artistData;
  const isPro = artist?.is_pro;

  const displayName = profiles?.display_name || artist?.artist_name || 'Artista';
  const avatarUrl = profiles?.avatar_url;
  const coverUrl = artist?.cover_url;
  const bio = artist?.bio;
  const city = profiles?.city;
  const country = profiles?.country || 'IT';
  const genre = artist?.genre;
  const socialLinks = artist?.social_links || {};
  const galleryPhotos = artist?.gallery_photos || [];
  const videoEmbeds = artist?.video_embeds || [];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const upcomingEvents = events.filter(e => new Date(e.starts_at) >= new Date());
  const pastEvents = events.filter(e => new Date(e.starts_at) < new Date());

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, isIt ? "EEEE d MMMM, 'ore' HH:mm" : "EEEE MMMM d, 'at' HH:mm", { locale: dateLocale });
  };

  const handlePlayTrack = (index: number) => {
    if (!radioTracks[index]?.audio_url) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(radioTracks[index].audio_url);
    audio.volume = volume;
    audioRef.current = audio;
    setCurrentTrackIndex(index);
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    audio.onended = () => {
      const next = (currentTrackIndex + 1) % radioTracks.length;
      handlePlayTrack(next);
    };
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const socialIcons: Record<string, React.ReactNode> = {
    instagram: <Camera className="w-5 h-5" />,
    youtube: <PlayCircle className="w-5 h-5" />,
    spotify: <Music className="w-5 h-5" />,
    apple_music: <Music2 className="w-5 h-5" />,
    bandcamp: <Music className="w-5 h-5" />,
    soundcloud: <Music className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-[#07070D] text-slate-100">
      {/* Cover Hero */}
      <div className="relative w-full">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${displayName} cover`}
            fill
            className="h-[50vh] w-full object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-[50vh] w-full bg-gradient-to-br from-violet-900/50 via-pink-900/30 to-cyan-900/50 flex items-center justify-center">
            <Music className="w-24 h-24 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070D] via-transparent to-transparent h-full" />
        
        {/* Avatar & Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 pb-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={120}
                  height={120}
                  className="rounded-2xl border-4 border-white/20 shadow-2xl"
                />
              ) : (
                <div className="w-30 h-30 rounded-2xl border-4 border-white/20 bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center">
                  <Music className="w-16 h-16 text-white/50" />
                </div>
              )}
              {isPro && (
                <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  PRO
                </span>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">{displayName}</h1>
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-3 mt-3 text-slate-300">
                {genre && (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium">
                    {genre}
                  </span>
                )}
                {city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {city}{country && `, ${country}`}
                  </span>
                )}
              </div>
              
              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 hover:border-white/30 transition-all"
                      aria-label={platform}
                    >
                      {socialIcons[platform] || <ExternalLink className="w-5 h-5" />}
                    </a>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-3 mt-6">
                {upcomingEvents.length > 0 && (
                  <Link
                    href={getEventUrl(upcomingEvents[0])}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 text-white font-bold text-sm shadow-lg hover:opacity-95 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Prossimo Live</span>
                  </Link>
                )}
                <Link
                  href={`/events?artist=${encodeURIComponent(displayName)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Tutti i Concerti</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 -mt-10 relative z-10">
        {/* Bio Section */}
        {bio && (
          <section className="mb-16 animate-in fade-in duration-300">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-400" />
              <span>{isIt ? 'Biografia' : 'Bio'}</span>
            </h2>
            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
              {bio}
            </div>
          </section>
        )}

        {/* Music Player - Radio Tracks */}
        {radioTracks.length > 0 && (
          <section className="mb-16 animate-in fade-in duration-300 delay-100">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Music className="w-6 h-6 text-cyan-400" />
              <span>{isIt ? 'Brani in Radio' : 'Radio Tracks'}</span>
              {isPro && <span className="text-amber-400 text-sm font-bold">({radioTracks.length}/3)</span>}
            </h2>
            
            <div className="space-y-3">
              {radioTracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`p-4 rounded-2xl glass-panel border border-white/10 flex items-center gap-4 transition-all ${
                    currentTrackIndex === index && isPlaying ? 'border-cyan-500/50 bg-cyan-500/5' : ''
                  }`}
                >
                  <button
                    onClick={() => handlePlayTrack(index)}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors shrink-0"
                  >
                    {currentTrackIndex === index && isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-1" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{track.title}</h4>
                    <p className="text-xs text-slate-400">{track.plays_count} ascolti • {track.likes_count} mi piace</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-white/20 rounded-lg appearance-none accent-cyan-400"
                    />
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Video Embeds */}
        {videoEmbeds.length > 0 && (
          <section className="mb-16 animate-in fade-in duration-300 delay-200">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-rose-400" />
              <span>{isIt ? 'Video' : 'Videos'}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoEmbeds.map((video: any, index: number) => (
                <div key={index} className="aspect-video rounded-2xl overflow-hidden bg-white/5">
                  {video.url?.includes('youtube') || video.url?.includes('youtu.be') ? (
                    <iframe
                      src={video.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title={video.title || `Video ${index + 1}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : video.url?.includes('spotify') ? (
                    <iframe
                      src={video.url.replace('open.spotify.com/track/', 'open.spotify.com/embed/track/').replace('open.spotify.com/album/', 'open.spotify.com/embed/album/')}
                      title={video.title || `Spotify ${index + 1}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ExternalLink className="w-12 h-12" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Photo Gallery */}
        {galleryPhotos.length > 0 && (
          <section className="mb-16 animate-in fade-in duration-300 delay-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-violet-400" />
                <span>{isIt ? 'Galleria' : 'Gallery'}</span>
              </h2>
              {galleryPhotos.length > 1 && (
                <button
                  onClick={() => { setGalleryIndex(0); setShowGalleryModal(true); }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {isIt ? 'Visualizza tutto' : 'View all'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryPhotos.slice(0, 8).map((photo: string, index: number) => (
                <button
                  key={index}
                  onClick={() => { setGalleryIndex(index); setShowGalleryModal(true); }}
                  className="aspect-square rounded-xl overflow-hidden bg-white/5 relative group"
                >
                  <Image
                    src={photo}
                    alt={`${displayName} gallery ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="mb-16 animate-in fade-in duration-300 delay-400">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <span>{isIt ? 'Prossimi Concerti' : 'Upcoming Shows'}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 6).map((event) => (
                <Link
                  key={event.id}
                  href={getEventUrl(event)}
                  className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="aspect-video rounded-xl overflow-hidden bg-white/5 mb-3 relative">
                    {event.image_url && (
                      <Image
                        src={event.image_url}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    )}
                    {event.is_free && (
                      <span className="absolute top-2 left-2 px-2 py-1 rounded bg-emerald-500/90 text-black text-[10px] font-extrabold">
                        {isIt ? 'GRATIS' : 'FREE'}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{event.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{event.venue_name} • {event.city}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatEventDate(event.starts_at)}</p>
                </Link>
              ))}
            </div>
            {upcomingEvents.length > 6 && (
              <div className="text-center mt-6">
                <Link
                  href={`/events?artist=${encodeURIComponent(displayName)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm transition-all"
                >
                  <span>{isIt ? 'Vedi tutti i concerti' : 'View all shows'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Past Events Archive */}
        {pastEvents.length > 0 && isPro && (
          <section className="mb-16 animate-in fade-in duration-300 delay-500">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-slate-400" />
              <span>{isIt ? 'Archivio Date Passate' : 'Past Shows Archive'}</span>
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pastEvents.slice(0, 20).map((event) => (
                <Link
                  key={event.id}
                  href={getEventUrl(event)}
                  className="flex items-center gap-4 p-4 rounded-xl glass-panel border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{event.title}</h4>
                    <p className="text-xs text-slate-400">{event.venue_name} • {event.city}</p>
                    <p className="text-xs text-slate-500">{formatEventDate(event.starts_at)}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
            {pastEvents.length > 20 && (
              <p className="text-center text-xs text-slate-500 mt-3">
                {isIt ? `E altri ${pastEvents.length - 20} concerti...` : `And ${pastEvents.length - 20} more shows...`}
              </p>
            )}
          </section>
        )}

        {/* Free User Teaser */}
        {!isPro && (
          <section className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-violet-500/5 to-transparent border border-amber-500/30 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{isIt ? 'Sblocca la Bio Page completa' : 'Unlock Full Bio Page'}</h3>
                <p className="text-xs text-slate-300">
                  {isIt
                    ? 'Con Artist Pro (€3 una tantum): copertina, galleria foto, video embed, player brani, archivio date e link streaming.'
                    : 'With Artist Pro (€3 one-time): cover, photo gallery, video embeds, track player, past events archive & streaming links.'
                  }
                </p>
              </div>
            </div>
            <Link
              href="/go-pro"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0070BA] text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all"
            >
              <span>{isIt ? 'Attiva Artist Pro' : 'Get Artist Pro'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}
      </main>

      {/* Gallery Modal */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur animate-in fade-in duration-200">
          <button
            onClick={() => setShowGalleryModal(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 z-10"
          >
            ✕
          </button>
          <button
            onClick={() => setGalleryIndex((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1))}
            className="absolute left-4 p-3 rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 hidden sm:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <Image
            src={galleryPhotos[galleryIndex]}
            alt={`${displayName} gallery ${galleryIndex + 1}`}
            width={1200}
            height={800}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
            priority
          />
          
          <button
            onClick={() => setGalleryIndex((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1))}
            className="absolute right-4 p-3 rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 hidden sm:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400">
            {galleryIndex + 1} / {galleryPhotos.length}
          </p>
        </div>
      )}
    </div>
  );
}

// Need to import getEventUrl
import { getEventUrl } from '@/lib/utils/slug';