'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Mail,
  MapPin,
  Music,
  Sparkles,
  Globe,
  Camera,
  PlayCircle,
  Image as ImageIcon,
  Save,
  Check,
  Lock,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function DashboardProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [artist, setArtist] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [genre, setGenre] = useState('');
  const [bio, setBio] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Social & Streaming links
  const [spotify, setSpotify] = useState('');
  const [appleMusic, setAppleMusic] = useState('');
  const [youtube, setYoutube] = useState('');
  const [instagram, setInstagram] = useState('');
  const [bandcamp, setBandcamp] = useState('');
  const [website, setWebsite] = useState('');

  // Gallery & Video
  const [galleryInput, setGalleryInput] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const { data: artData } = await supabase
          .from('artists')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();

        setProfile(profData || { display_name: user.email?.split('@')[0], city: 'Roma, Italia' });
        setArtist(artData || { is_pro: false });

        setDisplayName(profData?.display_name || '');
        setCity(profData?.city || '');
        setAvatarUrl(profData?.avatar_url || '');
        setGenre(artData?.genre || '');
        setBio(artData?.bio || '');
        setCoverUrl(artData?.cover_url || '');

        const links = artData?.social_links || {};
        setSpotify(links.spotify || '');
        setAppleMusic(links.apple_music || '');
        setYoutube(links.youtube || '');
        setInstagram(links.instagram || '');
        setBandcamp(links.bandcamp || '');
        setWebsite(links.website || '');

        if (artData?.gallery_photos?.length > 0) {
          setGalleryInput(artData.gallery_photos.join('\n'));
        }

        if (artData?.video_embeds?.length > 0) {
          setVideoUrl(artData.video_embeds[0]?.url || '');
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setSaveSuccess(false);

      const supabase = createClient();

      // Update profiles
      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          city,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      // Parse gallery URLs
      const galleryPhotos = galleryInput
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.startsWith('http'));

      const videoEmbeds = videoUrl.trim()
        ? [{ type: 'video', url: videoUrl.trim() }]
        : [];

      // Update artists via API
      await fetch('/api/artist/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: user.id,
          coverUrl: coverUrl || null,
          genre,
          bio,
          socialLinks: {
            spotify: spotify.trim() || undefined,
            apple_music: appleMusic.trim() || undefined,
            youtube: youtube.trim() || undefined,
            instagram: instagram.trim() || undefined,
            bandcamp: bandcamp.trim() || undefined,
            website: website.trim() || undefined,
          },
          galleryPhotos,
          videoEmbeds,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        <span className="text-xs">Caricamento profilo...</span>
      </div>
    );
  }

  const isPro = Boolean(artist?.is_pro);

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-cyan-400" />
            <span>Profilo & Bio Page Ufficiale</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Personalizza la tua presenza pubblica, i tuoi link streaming, video e galleria fotografica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {displayName && (
            <Link
              href={`/artists/${encodeURIComponent(displayName)}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
            >
              <span>Vedi Pagina Pubblica</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          {!isPro && (
            <Link
              href="/go-pro"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sblocca Bio PRO</span>
            </Link>
          )}
        </div>
      </div>

      {!isPro && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Le funzioni avanzate (copertina panoramica, link streaming, video YouTube e galleria foto) saranno visibili pubblicamente una volta attivato Artist Pro.</span>
          </div>
          <Link href="/go-pro" className="shrink-0 font-bold underline hover:text-white">
            Attiva a €3
          </Link>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Profilo e Bio aggiornati con successo!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Informazioni di Base</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Nome d'Arte / Band *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Genere Principale</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Es. Indie Rock, Cantautorato, Jazz..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Città di Riferimento</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Es. Bologna, Italia"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">URL Foto Profilo / Avatar</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-300">Biografia Artistica</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Racconta la tua storia, il tuo percorso musicale e le tue sonorità..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Pro Banner & Media */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span>Copertina & Media Visivi (PRO)</span>
            </h3>
            {!isPro && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>PRO</span>
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">URL Immagine Copertina Panoramica</label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... (consigliato 1200x400 px)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Galleria Fotografica (un URL immagine per riga)
            </label>
            <textarea
              rows={3}
              value={galleryInput}
              onChange={(e) => setGalleryInput(e.target.value)}
              placeholder="https://immagine1.jpg&#10;https://immagine2.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Video Incorporato (URL YouTube Embed o Spotify Embed)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/... oppure https://open.spotify.com/embed/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Social & Streaming Links */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Link Social & Piattaforme di Streaming</span>
            </h3>
            {!isPro && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>PRO</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Spotify Artist URL</label>
              <input
                type="url"
                value={spotify}
                onChange={(e) => setSpotify(e.target.value)}
                placeholder="https://open.spotify.com/artist/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Apple Music URL</label>
              <input
                type="url"
                value={appleMusic}
                onChange={(e) => setAppleMusic(e.target.value)}
                placeholder="https://music.apple.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Canale YouTube</label>
              <input
                type="url"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Profilo Instagram</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Bandcamp</label>
              <input
                type="url"
                value={bandcamp}
                onChange={(e) => setBandcamp(e.target.value)}
                placeholder="https://...bandcamp.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Sito Web Ufficiale</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-pink-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Salvataggio in corso...' : 'Salva Modifiche Profilo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
