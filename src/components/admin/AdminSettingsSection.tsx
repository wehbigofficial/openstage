'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Settings,
  Euro,
  Radio,
  Star,
  ShieldAlert,
  Save,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';

export function AdminSettingsSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [settings, setSettings] = useState<any>({
    artist_pro_price_eur: 3.0,
    venue_pro_monthly_eur: 4.9,
    venue_pro_annual_eur: 39.0,
    trial_days: 14,
    featured_slots: 3,
    min_radio_tracks: 5,
    antispam_max_events_per_day: 10,
    antispam_max_reports_per_ip: 5,
    antispam_auto_hide_report_threshold: 3,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const json = await res.json();
        if (json.settings) {
          setSettings(json.settings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio impostazioni');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      <form onSubmit={handleSave} className="space-y-8">
        {/* TOP STATUS BAR */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              {t.admin.settings}
            </h3>
            <p className="text-xs text-slate-400">
              {isIt
                ? 'Configurazione globale memorizzata nella tabella settings del database'
                : 'Global configuration stored in the database settings table'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.admin.settingsSaved}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.admin.saveSettings}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. PRICING & PRO TIERS */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Euro className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Prezzi & Piani Pro</h4>
              <p className="text-xs text-slate-400">Definisci le tariffe mensili ed annuali per artisti e locali</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.admin.artistProPrice}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">€</span>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  required
                  value={settings.artist_pro_price_eur}
                  onChange={(e) =>
                    setSettings({ ...settings, artist_pro_price_eur: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 3.00 €</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.admin.venueProMonthly}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">€</span>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  required
                  value={settings.venue_pro_monthly_eur}
                  onChange={(e) =>
                    setSettings({ ...settings, venue_pro_monthly_eur: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 4.90 €</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.admin.venueProAnnual}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">€</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={settings.venue_pro_annual_eur}
                  onChange={(e) =>
                    setSettings({ ...settings, venue_pro_annual_eur: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 39.00 €</span>
            </div>
          </div>
        </div>

        {/* 2. TRIAL & SLOTS CONFIGURATION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Clock className="w-4 h-4" />
              <label className="text-xs font-bold text-white">{t.admin.trialDays}</label>
            </div>
            <input
              type="number"
              min="0"
              max="90"
              required
              value={settings.trial_days}
              onChange={(e) =>
                setSettings({ ...settings, trial_days: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[11px] text-slate-400">
              Giorni di prova gratuita per nuovi locali e artisti (default: 14)
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Star className="w-4 h-4" />
              <label className="text-xs font-bold text-white">{t.admin.featuredSlots}</label>
            </div>
            <input
              type="number"
              min="1"
              max="20"
              required
              value={settings.featured_slots}
              onChange={(e) =>
                setSettings({ ...settings, featured_slots: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[11px] text-slate-400">
              Slot massimi per eventi contrassegnati in Evidenza (default: 3)
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-violet-400">
              <Radio className="w-4 h-4" />
              <label className="text-xs font-bold text-white">{t.admin.minRadioTracks}</label>
            </div>
            <input
              type="number"
              min="1"
              max="50"
              required
              value={settings.min_radio_tracks}
              onChange={(e) =>
                setSettings({ ...settings, min_radio_tracks: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[11px] text-slate-400">
              Brani minimi approvati per abilitare la playlist radio (default: 5)
            </p>
          </div>
        </div>

        {/* 3. ANTI-SPAM & MODERATION LIMITS */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">{t.admin.antiSpamTitle}</h4>
              <p className="text-xs text-slate-400">
                Limiti di frequenza per prevenire bot, spam e abuso del sistema
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.admin.maxEventsPerDay}
              </label>
              <input
                type="number"
                min="1"
                required
                value={settings.antispam_max_events_per_day}
                onChange={(e) =>
                  setSettings({ ...settings, antispam_max_events_per_day: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 10</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.admin.maxReportsPerIp}
              </label>
              <input
                type="number"
                min="1"
                required
                value={settings.antispam_max_reports_per_ip}
                onChange={(e) =>
                  setSettings({ ...settings, antispam_max_reports_per_ip: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 5</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t.admin.autoHideThreshold}
              </label>
              <input
                type="number"
                min="1"
                required
                value={settings.antispam_auto_hide_report_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, antispam_auto_hide_report_threshold: parseInt(e.target.value) || 0 })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 3 (Auto-Hide)</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
