'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles,
  Check,
  Radio,
  BarChart3,
  Globe2,
  ShieldCheck,
  Music,
  Calendar,
  Image as ImageIcon,
  PlayCircle,
  Play,
  Lock,
  ArrowRight,
  Loader2,
  Share2,
} from 'lucide-react';

export default function GoProPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const isIt = locale === 'it';

  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priceEur, setPriceEur] = useState(3.0);
  const [paying, setPaying] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadUserAndSettings() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

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

        // Fetch price
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const json = await res.json();
          if (json.settings?.artist_pro_price_eur) {
            setPriceEur(Number(json.settings.artist_pro_price_eur));
          }
        }
      } catch (err) {
        console.error('Error loading pro page details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserAndSettings();
  }, []);

  const handlePayPalCheckout = async () => {
    if (!user) {
      router.push('/auth/signin?redirect=/go-pro');
      return;
    }

    try {
      setPaying(true);
      setPaymentNotice(null);

      // 1. Create PayPal Order on server
      const createRes = await fetch('/api/payments/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!createRes.ok) {
        throw new Error('Impossibile creare ordine PayPal');
      }

      const orderData = await createRes.json();

      // 2. Capture Order on server
      const captureRes = await fetch('/api/payments/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          userId: user.id,
        }),
      });

      if (!captureRes.ok) {
        throw new Error('Impossibile completare il pagamento');
      }

      setIsPro(true);
      setPaymentNotice({
        type: 'success',
        message: t.pro.paymentSuccess,
      });
    } catch (err: any) {
      console.error('PayPal checkout error:', err);
      setPaymentNotice({
        type: 'error',
        message: t.pro.paymentError,
      });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{t.pro.badge}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {t.pro.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {t.pro.subtitle}
        </p>
      </div>

      {paymentNotice && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-4 max-w-2xl mx-auto ${
            paymentNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{paymentNotice.message}</span>
          {paymentNotice.type === 'success' && (
            <Link
              href="/dashboard"
              className="shrink-0 px-4 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs"
            >
              Dashboard
            </Link>
          )}
        </div>
      )}

      {/* Pricing Card Section */}
      <div className="max-w-xl mx-auto p-8 sm:p-10 rounded-3xl glass-panel border border-amber-500/30 bg-gradient-to-b from-[#131024] to-[#0A0A14] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 relative z-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
            {t.pro.oneTimePrice}
          </span>

          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl sm:text-6xl font-black text-white">€{priceEur.toFixed(2)}</span>
            <span className="text-slate-400 text-sm font-semibold">/ {isIt ? 'una tantum' : 'one-time'}</span>
          </div>

          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t.pro.oneTimePriceDesc}
          </p>

          <div className="pt-6">
            {isPro ? (
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-amber-400" />
                <span>{t.pro.alreadyProBadge}</span>
              </div>
            ) : (
              <button
                onClick={handlePayPalCheckout}
                disabled={paying}
                className="w-full py-4 px-6 rounded-2xl bg-[#0070BA] hover:bg-[#005ea6] text-white font-extrabold text-base shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.pro.processingPayment}</span>
                  </>
                ) : (
                  <>
                    <span className="font-serif italic font-black text-lg">PayPal</span>
                    <span>{t.pro.upgradeButton}</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>PayPal Business</span>
            </span>
            <span>•</span>
            <span>{isIt ? 'Nessun rinnovo automatico' : 'No recurring fees'}</span>
            <span>•</span>
            <span>{isIt ? 'Attivazione istantanea' : 'Instant activation'}</span>
          </div>
        </div>
      </div>

      {/* Visual Previews Section */}
      <div className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isIt ? 'Cosa ottieni con Artist Pro' : 'What you get with Artist Pro'}
          </h2>
          <p className="text-sm text-slate-400">
            {isIt ? 'Tre strumenti essenziali pensati su misura per musicisti e band indipendenti' : 'Three essential tools built specifically for independent artists and bands'}
          </p>
        </div>

        {/* Feature 1: Bio Page Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 sm:p-10 rounded-3xl glass-panel border border-white/10">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-white">{t.pro.bioPreviewTitle}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{t.pro.bioPreviewSubtitle}</p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2">
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copertina panoramica, avatar personalizzato e biografia formattata</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Link a Spotify, Apple Music, YouTube, Instagram e Bandcamp</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Player audio integrato e video incorporati</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Archivio storico delle date passate e prossimi live in programma</span>
              </li>
            </ul>
          </div>

          {/* Visual Mock of Bio Page */}
          <div className="rounded-2xl border border-white/15 bg-[#090812] overflow-hidden shadow-2xl p-4 space-y-4">
            <div className="h-28 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 relative p-3 flex items-end">
              <div className="w-16 h-16 rounded-2xl bg-black/60 border-2 border-white/30 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shadow-lg -mb-6 ml-2">
                LP
              </div>
            </div>
            <div className="pt-4 px-2 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-white">Luna & The Waves</h4>
                  <p className="text-xs text-cyan-400 font-medium">Indie Rock • Bologna, IT</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                Sonorità psichedeliche e testi introspettivi. Attivi nei club indipendenti italiani dal 2023.
              </p>
              {/* Media mock */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Play className="w-4 h-4 text-pink-400" />
                  <span className="text-[11px] text-white font-semibold truncate">Neon Horizon (Single)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-[11px] text-white font-semibold truncate">3 Live in programma</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Radio Rotation Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 sm:p-10 rounded-3xl glass-panel border border-white/10">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/15 bg-[#090812] p-5 space-y-4 shadow-2xl">
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-white">OpenStage Indie Radio</p>
                  <p className="text-[11px] text-cyan-300">In rotazione continua in tutta Italia</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                LIVE
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white">
                  <Music className="w-4 h-4 text-pink-400" />
                  <span>Midnight in Bologna</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">In Rotazione</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white">
                  <Music className="w-4 h-4 text-pink-400" />
                  <span>Trastevere Sunset</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">In Rotazione</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-white">{t.pro.radioPreviewTitle}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{t.pro.radioPreviewSubtitle}</p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2">
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Carica fino a 3 tracce MP3 ad alta fedeltà (max 10 MB)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Flusso continuo sincronizzato live: tutti gli utenti ascoltano lo stesso brano</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Pulsanti diretti "Vedi Artista" e "Prossimo Concerto" visibili durante l'ascolto</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3: Detailed Stats Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8 sm:p-10 rounded-3xl glass-panel border border-white/10">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-white">{t.pro.statsPreviewTitle}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{t.pro.statsPreviewSubtitle}</p>
            <ul className="space-y-2 text-xs text-slate-400 pt-2">
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Grafico dell'andamento visualizzazioni negli ultimi 14 e 30 giorni</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Provenienza geografica dei fan: scopri in quali città c'è richiesta per i tuoi live</span>
              </li>
              <li className="flex items-center gap-2 text-slate-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Ascolti radio completi (dopo 30 secondi), click sui biglietti e promemoria attivati</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/15 bg-[#090812] p-5 space-y-4 shadow-2xl">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-slate-400">Ascolti Radio</p>
                <p className="text-lg font-bold text-cyan-400">142</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-slate-400">Visite Profilo</p>
                <p className="text-lg font-bold text-pink-400">95</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[10px] text-slate-400">Click Biglietti</p>
                <p className="text-lg font-bold text-violet-400">38</p>
              </div>
            </div>

            {/* City bars */}
            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-bold text-white uppercase tracking-wider">Top Città</p>
              <div className="space-y-1.5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                    <span>Milano</span>
                    <span className="font-mono">46%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 w-[46%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                    <span>Bologna</span>
                    <span className="font-mono">26%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 w-[26%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free vs Pro Comparison Table */}
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center">
          {t.pro.freeVsProTitle}
        </h2>

        <div className="rounded-3xl glass-panel border border-white/10 overflow-hidden max-w-4xl mx-auto">
          <div className="grid grid-cols-3 p-4 sm:p-6 bg-white/5 border-b border-white/10 font-bold text-xs sm:text-sm">
            <span className="text-slate-400">Funzionalità</span>
            <span className="text-center text-slate-300">{t.pro.freePlan}</span>
            <span className="text-center text-amber-400">{t.pro.proPlan}</span>
          </div>

          <div className="divide-y divide-white/5 text-xs sm:text-sm">
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="text-white font-medium">{t.pro.freeEvents}</span>
              <span className="text-center text-emerald-400 font-bold">✓</span>
              <span className="text-center text-emerald-400 font-bold">✓</span>
            </div>
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="text-white font-medium">{t.pro.proBioPage}</span>
              <span className="text-center text-slate-500">Base</span>
              <span className="text-center text-amber-400 font-bold">Completa (Gallery, Video, Brani)</span>
            </div>
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="text-white font-medium">{t.pro.proRadio}</span>
              <span className="text-center text-slate-500">—</span>
              <span className="text-center text-cyan-400 font-bold">✓ Fino a 3 MP3</span>
            </div>
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="text-white font-medium">{t.pro.proDetailedStats}</span>
              <span className="text-center text-slate-400">Solo totale visualizzazioni</span>
              <span className="text-center text-pink-400 font-bold">✓ Grafici, Città & Ascolti</span>
            </div>
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="text-white font-medium">{t.pro.proNoWatermark}</span>
              <span className="text-center text-slate-500">Logo OpenStage</span>
              <span className="text-center text-amber-400 font-bold">✓ Senza watermark</span>
            </div>
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="text-white font-medium">{t.pro.proFeatured}</span>
              <span className="text-center text-slate-500">—</span>
              <span className="text-center text-emerald-400 font-bold">✓ Prioritaria</span>
            </div>
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="text-white font-medium">{t.pro.proVenueCalls}</span>
              <span className="text-center text-slate-500">—</span>
              <span className="text-center text-violet-400 font-bold">✓ Abilitato</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free alternative invite banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-950/40 via-cyan-950/40 to-black border border-violet-500/20 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Vuoi ottenere Artist Pro gratis?</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-md">
            Invita 3 colleghi musicisti: quando verificano l'account e pubblicano un live show, sblocchi Artist Pro per sempre a costo zero!
          </p>
        </div>

        <Link
          href="/dashboard"
          className="shrink-0 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
        >
          {isIt ? 'Scopri il Programma Inviti' : 'View Invites Program'}
        </Link>
      </div>
    </div>
  );
}
