'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { dict } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import {
  PlusCircle,
  AlertCircle,
  Info,
  Sparkles,
  Upload,
  Calendar,
  MapPin,
  Music,
  ExternalLink,
  Building,
  Check,
} from 'lucide-react';
import { BrandPosterPreview } from '@/components/BrandPosterPreview';
import MiniLocationPicker from '@/components/MiniLocationPicker';
import ShareModal from '@/components/ShareModal';
import { validateEventContent } from '@/lib/utils/contentFilter';
import { getRegisteredVenues } from '@/lib/services/eventsService';
import { getEventUrl } from '@/lib/utils/slug';

export default function CreateEventPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueId, setVenueId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(41.9028); // Default Rome
  const [lng, setLng] = useState<number>(12.4964);
  const [approximateLocation, setApproximateLocation] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [timezone, setTimezone] = useState('Europe/Rome');
  const [genre, setGenre] = useState('');
  const [eventType, setEventType] = useState<'concert' | 'club night' | 'festival' | 'party' | 'open mic' | 'other'>('concert');
  const [priceText, setPriceText] = useState('Free entry');
  const [isFree, setIsFree] = useState(true);
  const [description, setDescription] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [lineup, setLineup] = useState('');
  const [links, setLinks] = useState({ spotify: '', instagram: '', youtube: '' });

  // Image & Poster Generation
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [posterTheme, setPosterTheme] = useState<'neon' | 'noir' | 'sunset' | 'acid'>('neon');
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  // Registered Venues
  const [registeredVenues, setRegisteredVenues] = useState<
    Array<{ id: string; name: string; address?: string; lat?: number; lng?: number }>
  >([]);

  // Geocoding autocomplete
  const [geocodeQuery, setGeocodeQuery] = useState('');
  const [geocodeResults, setGeocodeResults] = useState<any[]>([]);
  const [searchingGeocode, setSearchingGeocode] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Share Modal on success
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login?next=/events/new');
        return;
      }
      setUser(user);

      // Fetch user profile for default artist name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, city')
        .eq('id', user.id)
        .single();

      if (profile?.display_name) {
        setArtistName(profile.display_name);
      }

      // Fetch registered venues list
      const venues = await getRegisteredVenues();
      setRegisteredVenues(venues);

      setLoading(false);
    }
    init();
  }, [router]);

  // Geocoding lookup with debounce
  useEffect(() => {
    if (!geocodeQuery || geocodeQuery.length < 3) {
      setGeocodeResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingGeocode(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(geocodeQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setGeocodeResults(data.results || []);
        }
      } catch {
        setGeocodeResults([]);
      } finally {
        setSearchingGeocode(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [geocodeQuery]);

  // Pick Geocode Result
  const handleSelectGeocode = (item: any) => {
    setAddress(item.name);
    setLat(item.lat);
    setLng(item.lng);
    setGeocodeResults([]);
    setGeocodeQuery('');
  };

  // Pick Registered Venue
  const handleSelectRegisteredVenue = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = e.target.value;
    if (!vId) {
      setVenueId(null);
      return;
    }
    const found = registeredVenues.find((v) => v.id === vId);
    if (found) {
      setVenueId(found.id);
      setVenueName(found.name);
      if (found.address) setAddress(found.address);
      if (found.lat && found.lng) {
        setLat(found.lat);
        setLng(found.lng);
      }
    }
  };

  // Handle client-side image compression & resize
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                setImageFile(resizedFile);
                setImageUrl(canvas.toDataURL('image/jpeg', 0.85));
              }
            },
            'image/jpeg',
            0.85
          );
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Generate poster in 1 click using BrandPosterPreview via html-to-image
  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    try {
      setGeneratingPoster(true);
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      setImageUrl(dataUrl);

      // Convert dataUrl to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const generatedFile = new File([blob], 'openstage-poster.png', {
        type: 'image/png',
      });
      setImageFile(generatedFile);
    } catch (err) {
      console.error('Error generating poster', err);
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setStatusError(null);
    setStatusMessage(null);

    // 1. Anti-abuse validation (banned words, spam links)
    const validation = validateEventContent({
      title,
      description,
      ticket_url: ticketUrl,
      links,
    });
    if (!validation.valid) {
      setStatusError(validation.reason || 'Contenuto non conforme.');
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createClient();

      // 2. Anti-abuse: check max 10 events per day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: dailyEventsCount } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .gte('created_at', todayStart.toISOString());

      if (Number(dailyEventsCount) >= 10) {
        setStatusError('Hai raggiunto il limite anti-abuso di 10 eventi creati nelle ultime 24 ore.');
        setSubmitting(false);
        return;
      }

      // Check email confirmation status
      const isEmailConfirmed = Boolean(user.email_confirmed_at);
      const initialStatus = isEmailConfirmed ? 'published' : 'draft';

      // 3. Upload image if present, else fallback to standard image
      let finalImageUrl = imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80';
      if (imageFile) {
        try {
          const fileExt = imageFile.name.split('.').pop() || 'jpg';
          const filePath = `${user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('event_images')
            .upload(filePath, imageFile, { upsert: true });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from('event_images')
              .getPublicUrl(filePath);
            if (publicData?.publicUrl) {
              finalImageUrl = publicData.publicUrl;
            }
          }
        } catch {
          // If storage upload fails, keep current finalImageUrl / dataUrl
        }
      }

      // 4. Extract city from address
      const parts = address.split(',');
      const city = parts.length > 1 ? parts[parts.length - 2].trim() : parts[0].trim() || 'Global';

      // 5. Insert event into DB
      const eventPayload: any = {
        owner_id: user.id,
        title,
        artist_name: artistName,
        venue_name: venueName,
        venue_id: venueId || null,
        address,
        lat,
        lng,
        approximate_location: approximateLocation,
        starts_at: new Date(startsAt).toISOString(),
        timezone,
        genre: genre || 'Indie',
        event_type: eventType,
        image_url: finalImageUrl,
        description,
        ticket_url: ticketUrl || null,
        price_text: isFree ? 'Free entry' : priceText,
        is_free: isFree,
        lineup: lineup ? lineup.split(',').map((s) => s.trim()).filter(Boolean) : null,
        links: {
          spotify: links.spotify || null,
          instagram: links.instagram || null,
          youtube: links.youtube || null,
        },
        status: initialStatus,
      };

      const { data: insertedEvent, error: insertError } = await supabase
        .from('events')
        .insert(eventPayload)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const eventData = insertedEvent || {
        ...eventPayload,
        id: crypto.randomUUID(),
        city,
      };

      setCreatedEvent(eventData);

      if (!isEmailConfirmed) {
        setStatusMessage(
          'Evento salvato in Bozza! Conferma l’email per pubblicarlo automaticamente nella directory pubblica.'
        );
      } else {
        setShowShareModal(true);
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      setStatusError(`Errore durante il salvataggio: ${err.message || 'Riprova più tardi'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Caricamento form...</span>
      </div>
    );
  }

  const isEmailConfirmed = Boolean(user?.email_confirmed_at);
  const formattedDatePreview = startsAt
    ? new Date(startsAt).toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <PlusCircle className="w-8 h-8 text-cyan-400" />
            <span>Crea un Nuovo Evento</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pubblica subito il tuo live show sulla mappa e nella directory mondiale OpenStage.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Pubblicazione immediata (Zero pre-approvazione)</span>
        </div>
      </div>

      {!isEmailConfirmed && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold mb-1">Verifica email in attesa</p>
            <p>
              I tuoi eventi rimarranno in bozza fino alla conferma della tua email. Una volta confermata, appariranno automaticamente online!
            </p>
          </div>
        </div>
      )}

      {statusError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{statusError}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-3">
          <Sparkles className="w-5 h-5 shrink-0 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Form on the Left, Live Poster Preview on the Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM (7 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {/* Card 1: Informazioni Principali */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Music className="w-4 h-4 text-pink-400" />
              <span>1. Dettagli Live & Artista</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Titolo dell’Evento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="es. Neon Horizons Live Debut"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Artista o Band *
                </label>
                <input
                  type="text"
                  required
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="es. The Velvet Undergrounds"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Genere Musicale *
                </label>
                <input
                  type="text"
                  required
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="es. Post-Punk, Synthwave, Jazz"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tipologia Evento *
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="concert" className="bg-slate-900">Concerto</option>
                  <option value="club night" className="bg-slate-900">Club Night / DJ Set</option>
                  <option value="festival" className="bg-slate-900">Festival</option>
                  <option value="open mic" className="bg-slate-900">Open Mic / Jam Session</option>
                  <option value="party" className="bg-slate-900">Festa / Secret Gig</option>
                  <option value="other" className="bg-slate-900">Altro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Data e Ora di Inizio *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Line-up completa (separata da virgole)
              </label>
              <input
                type="text"
                value={lineup}
                onChange={(e) => setLineup(e.target.value)}
                placeholder="es. Main Act, Support Act, Opening DJ"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descrizione dell’evento
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Spiega l'atmosfera, orari porte, opening band..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Card 2: Venue, Indirizzo e Mini Mappa */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>2. Luogo, Geocoding & Posizione Esatta</span>
            </h2>

            {/* Registered venue selector */}
            {registeredVenues.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-pink-400" />
                  <span>Seleziona da un locale registrato (Opzionale)</span>
                </label>
                <select
                  value={venueId || ''}
                  onChange={handleSelectRegisteredVenue}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="" className="bg-slate-900">-- Inserisci locale libero / non registrato --</option>
                  {registeredVenues.map((v) => (
                    <option key={v.id} value={v.id} className="bg-slate-900">
                      {v.name} ({v.address || 'Registrato'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome del Locale / Venue *
              </label>
              <input
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="es. SubClub Underground o Private Loft"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Address with autocomplete */}
            <div className="relative space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Indirizzo o Città (con Autocompletamento) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setGeocodeQuery(e.target.value);
                  }}
                  placeholder="Cerca via, piazza, civico e città..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
                {searchingGeocode && (
                  <div className="absolute right-3.5 top-3.5 w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Autocomplete dropdown */}
              {geocodeResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl bg-slate-900/95 border border-white/20 backdrop-blur-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {geocodeResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectGeocode(item)}
                      className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center justify-between border-b border-white/5 last:border-b-0"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="text-[10px] text-cyan-400 shrink-0 ml-2">Seleziona</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mini map with draggable pin & approximate location toggle */}
            <MiniLocationPicker
              initialLat={lat}
              initialLng={lng}
              approximateLocation={approximateLocation}
              onLocationChange={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
              }}
              onApproximateChange={setApproximateLocation}
            />
          </div>

          {/* Card 3: Biglietti, Prezzo & Link Social */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>3. Ingresso, Biglietti & Social</span>
            </h2>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <input
                type="checkbox"
                id="isFreeCheckbox"
                checked={isFree}
                onChange={(e) => {
                  setIsFree(e.target.checked);
                  if (e.target.checked) setPriceText('Free entry');
                }}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-400 cursor-pointer"
              />
              <label htmlFor="isFreeCheckbox" className="text-xs font-semibold text-white cursor-pointer select-none">
                Ingresso Gratuito / Nessun biglietto a pagamento
              </label>
            </div>

            {!isFree && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Testo Prezzo
                  </label>
                  <input
                    type="text"
                    value={priceText}
                    onChange={(e) => setPriceText(e.target.value)}
                    placeholder="es. €10 alla porta / €15 con consumazione"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Link Prevendite (DICE, Eventbrite, RA...)
                  </label>
                  <input
                    type="url"
                    value={ticketUrl}
                    onChange={(e) => setTicketUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Spotify / Brano
                </label>
                <input
                  type="url"
                  value={links.spotify}
                  onChange={(e) => setLinks({ ...links, spotify: e.target.value })}
                  placeholder="https://spotify..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  value={links.instagram}
                  onChange={(e) => setLinks({ ...links, instagram: e.target.value })}
                  placeholder="https://instagram..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  YouTube / Video
                </label>
                <input
                  type="url"
                  value={links.youtube}
                  onChange={(e) => setLinks({ ...links, youtube: e.target.value })}
                  placeholder="https://youtube..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 text-white font-extrabold text-base shadow-xl shadow-pink-600/25 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {submitting ? 'Pubblicazione in corso...' : 'Pubblica Evento Subito'}
          </button>
        </form>

        {/* LIVE PREVIEW & POSTER GENERATOR (5 cols sticky) */}
        <div className="lg:col-span-5 sticky top-8 space-y-5">
          <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Preview Locandina</span>
              </span>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg text-[10px]">
                {(['neon', 'noir', 'sunset', 'acid'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPosterTheme(t)}
                    className={`px-2 py-0.5 rounded capitalize transition-all ${
                      posterTheme === t
                        ? 'bg-violet-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Poster Template Ref Component */}
            <BrandPosterPreview
              ref={posterRef}
              title={title}
              artistName={artistName}
              dateStr={formattedDatePreview}
              venueName={venueName}
              city={address}
              genre={genre}
              theme={posterTheme}
            />

            {/* Actions for Poster */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleGeneratePoster}
                disabled={generatingPoster}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                <span>{generatingPoster ? 'Generazione...' : 'Usa Come Poster'}</span>
              </button>

              <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs cursor-pointer transition-all active:scale-[0.98]">
                <Upload className="w-3.5 h-3.5 text-cyan-300" />
                <span>Carica Immagine</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Le immagini caricate vengono automaticamente ridimensionate e compresse nel browser.
            </p>
          </div>
        </div>
      </div>

      {/* Post-publish Share Modal */}
      {createdEvent && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            router.push(getEventUrl(createdEvent));
          }}
          event={createdEvent}
          eventUrl={getEventUrl(createdEvent)}
          isPostPublish={true}
        />
      )}
    </div>
  );
}
