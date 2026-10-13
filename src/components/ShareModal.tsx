'use client';

import React, { useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import Link from 'next/link';
import {
  Share2,
  Copy,
  Check,
  Download,
  Send,
  Camera,
  Sparkles,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    artist_name: string;
    venue_name: string;
    city: string;
    starts_at: string;
    image_url?: string;
  };
  eventUrl: string;
  isPostPublish?: boolean;
}

type CardFormat = 'square' | 'portrait' | 'story';

export default function ShareModal({
  isOpen,
  onClose,
  event,
  eventUrl,
  isPostPublish = false,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>('portrait');
  const [downloading, setDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isPro, setIsPro] = useState(false);
  const [hideWatermark, setHideWatermark] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function checkProStatus() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: artist } = await supabase
            .from('artists')
            .select('is_pro')
            .eq('profile_id', user.id)
            .maybeSingle();
          if (artist?.is_pro) {
            setIsPro(true);
          }
        }
      } catch {}
    }
    checkProStatus();
  }, []);

  React.useEffect(() => {
    if (isOpen && eventUrl) {
      QRCode.toDataURL(eventUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: '#ffffff',
          light: '#00000000',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Error generating QR Code', err));
    }
  }, [isOpen, eventUrl]);

  if (!isOpen) return null;

  const dateObj = new Date(event.starts_at);
  const formattedDate = dateObj.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fullShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${eventUrl}`
    : `https://openstage.live${eventUrl}`;

  const shareText = `Vieni a sentire ${event.artist_name} dal vivo a ${event.venue_name} (${event.city})! Info e dettagli su OpenStage:`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText} ${fullShareUrl}`
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const generateCardImageBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleDownloadCard = async () => {
    try {
      setDownloading(true);
      if (!cardRef.current) return;
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `openstage-${event.id}-${selectedFormat}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error rendering card to download', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleInstagramShare = async () => {
    try {
      setDownloading(true);
      const blob = await generateCardImageBlob();
      if (!blob) return;

      const file = new File([blob], `openstage-${event.id}-story.png`, {
        type: 'image/png',
      });

      // Check Web Share API with files (supported on mobile Chrome/Safari)
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: event.title,
          text: `${event.title} - ${event.artist_name} @ ${event.venue_name}`,
        });
      } else {
        // Desktop fallback: download the story file
        const dataUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `openstage-${event.id}-instagram.png`;
        link.href = dataUrl;
        link.click();
        URL.revokeObjectURL(dataUrl);
      }
    } catch (err) {
      console.warn('Instagram share error or cancelled', err);
    } finally {
      setDownloading(false);
    }
  };

  // Dimensions aspect ratio for preview
  const formatDimensions = {
    square: 'aspect-square max-w-[340px]',
    portrait: 'aspect-[4/5] max-w-[320px]',
    story: 'aspect-[9/16] max-w-[280px]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-2xl my-8 text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div>
          {isPostPublish ? (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Evento Pubblicato con Successo!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight pt-2">
                Condividi il tuo live con il pubblico
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Fai girare la voce sui social e nelle chat con le card brandizzate ad alta risoluzione.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">Condividi Evento</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Invia su WhatsApp, genera la storia per Instagram o scarica la locandina digitale.
              </p>
            </div>
          )}
        </div>

        {/* Instant Share Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={handleInstagramShare}
            disabled={downloading}
            className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-amber-500 hover:opacity-90 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>Condividi / IG</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs sm:text-sm transition-all active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copiato!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-300" />
                <span>Copia Link</span>
              </>
            )}
          </button>
        </div>

        {/* Share Card Generator Section */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Formato Share Card Grafica
            </span>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {(['portrait', 'square', 'story'] as CardFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all ${
                    selectedFormat === fmt
                      ? 'bg-violet-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt === 'square' ? '1:1 Square' : fmt === 'portrait' ? '4:5 Feed' : '9:16 Story'}
                </button>
              ))}
            </div>

            {/* Watermark toggle */}
            <div className="flex items-center gap-2">
              {isPro ? (
                <button
                  type="button"
                  onClick={() => setHideWatermark(!hideWatermark)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    hideWatermark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/5 text-slate-300 border-white/10'
                  }`}
                >
                  {hideWatermark ? 'Marchio OpenStage: Nascosto (PRO)' : 'Mostra Marchio OpenStage'}
                </button>
              ) : (
                <Link
                  href="/go-pro"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                >
                  <Lock className="w-3 h-3" />
                  <span>Rimuovi logo OpenStage (PRO)</span>
                </Link>
              )}
            </div>
          </div>

          {/* Visual Canvas to be converted to image */}
          <div className="flex justify-center p-4 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
            <div
              ref={cardRef}
              className={`w-full ${formatDimensions[selectedFormat]} relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#16122b] via-[#0b0a14] to-black border border-white/20 p-5 flex flex-col justify-between shadow-2xl select-none`}
            >
              {/* Top Bar / Watermark */}
              {!hideWatermark ? (
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                    <span className="text-[11px] font-black tracking-widest uppercase text-white">
                      OPENSTAGE
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    Live Show
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-end pb-2">
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    Live Show
                  </span>
                </div>
              )}

              {/* Event Poster preview / Image */}
              {event.image_url ? (
                <div className="my-2 relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>
              ) : null}

              {/* Center Content */}
              <div className="my-auto py-2 space-y-1.5">
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  {event.artist_name}
                </p>
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight uppercase">
                  {event.title}
                </h3>
              </div>

              {/* Footer with Details & QR */}
              <div className="pt-3 border-t border-white/15 flex items-end justify-between gap-3">
                <div className="space-y-1 text-left">
                  <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">
                    {formattedDate}
                  </p>
                  <p className="text-xs font-bold text-white truncate max-w-[170px]">
                    {event.venue_name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[170px]">
                    {event.city}
                  </p>
                </div>

                {qrCodeDataUrl && (
                  <div className="shrink-0 p-1.5 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code"
                      className="w-14 h-14 object-contain"
                    />
                    <span className="text-[7px] text-slate-400 tracking-tighter uppercase mt-0.5">
                      Scansiona
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download button for card */}
          <div className="flex justify-end">
            <button
              onClick={handleDownloadCard}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generazione...' : 'Scarica Card Immagine'}</span>
            </button>
          </div>
        </div>

        {/* Soft Upgrade Card (never blocking) */}
        {!isPro && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                  <span>Passa ad Artist Pro</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">€3 una tantum</span>
                </p>
                <p className="text-[11px] text-slate-300">
                  Ottieni Bio Page personalizzata, rotazione nella Radio 24/7, statistiche complete e rimuovi il marchio OpenStage dalle locandine.
                </p>
              </div>
            </div>
            <Link
              href="/go-pro"
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-all"
            >
              Scopri Artist Pro
            </Link>
          </div>
        )}

        {/* Viral Growth Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/60 to-cyan-950/60 border border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="text-xs font-bold text-white">
              Conosci qualcuno che suona dal vivo?
            </p>
            <p className="text-[11px] text-slate-400">
              Invitali su OpenStage. È 100% gratuito per artisti indipendenti e locali.
            </p>
          </div>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText('https://openstage.live');
                alert('Link di invito copiato!');
              }
            }}
            className="shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-cyan-300 border border-cyan-500/30 transition-colors"
          >
            Invita un artista
          </button>
        </div>
      </div>
    </div>
  );
}
