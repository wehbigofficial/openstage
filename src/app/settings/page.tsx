'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { getFanProfile, updateFanPreferences } from '@/lib/services/fanService';
import {
  Settings,
  Trash2,
  AlertTriangle,
  Mail,
  MapPin,
  Check,
  LocateFixed,
  Globe,
  Bell,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLanguage();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Preference fields
  const [city, setCity] = useState('');
  const [consentDigest, setConsentDigest] = useState(false);
  const [remindDayBefore, setRemindDayBefore] = useState(true);
  const [remindMorningOf, setRemindMorningOf] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login?next=/settings');
        return;
      }

      setUser(user);

      const userProfile = await getFanProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
        setCity(userProfile.city || '');
        setConsentDigest(userProfile.email_consent_digest ?? false);
        setRemindDayBefore(userProfile.email_reminders_day_before ?? true);
        setRemindMorningOf(userProfile.email_reminders_morning_of ?? true);
        setEmailMarketing(userProfile.email_marketing ?? false);
      }

      setLoading(false);
    }
    loadData();
  }, [router]);

  // Handle location detection with consent
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert(locale === 'it' ? 'Geolocalizzazione non supportata' : 'Geolocation not supported');
      return;
    }

    const consent = window.confirm(t.fan.detectCityConsent);
    if (!consent) return;

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          const detectedCity = data.city || data.address || 'Milano';

          setCity(detectedCity);
          if (user) {
            await updateFanPreferences(user.id, { city: detectedCity });
          }
          setFeedbackNotice(`${t.fan.cityDetected}: ${detectedCity}`);
          setTimeout(() => setFeedbackNotice(null), 3000);
        } catch {
          setCity('Milano');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        alert(locale === 'it' ? 'Impossibile rilevare la posizione' : 'Could not detect position');
      }
    );
  };

  // Save Preferences
  const handleSavePreferences = async () => {
    if (!user) return;
    try {
      setSavingPrefs(true);
      await updateFanPreferences(user.id, {
        city,
        email_consent_digest: consentDigest,
        email_reminders_day_before: remindDayBefore,
        email_reminders_morning_of: remindMorningOf,
        email_marketing: emailMarketing,
      });

      setFeedbackNotice(t.settings.preferencesSaved);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch {
      alert('Error saving preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Unsubscribe from all non-essential emails
  const handleUnsubscribeAll = async () => {
    if (!user) return;
    try {
      setSavingPrefs(true);
      setConsentDigest(false);
      setRemindDayBefore(false);
      setRemindMorningOf(false);
      setEmailMarketing(false);

      await updateFanPreferences(user.id, {
        email_consent_digest: false,
        email_reminders_day_before: false,
        email_reminders_morning_of: false,
        email_marketing: false,
      });

      setFeedbackNotice(t.settings.unsubscribeAll);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch {
      alert('Error unsubscribing');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t.settings.deleteAccountConfirm);
    if (!confirmed) return;

    try {
      setDeleting(true);
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      window.location.href = '/';
    } catch (err: any) {
      alert(err?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-400">
        {t.common.loading}
      </div>
    );
  }

  const role = profile?.role || user?.user_metadata?.role || 'fan';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-200">
      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-500/90 text-black font-bold text-sm shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-white/10 flex items-center gap-4">
        <div className="p-3.5 rounded-2xl bg-violet-600/20 text-cyan-400">
          <Settings className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{t.settings.title}</h1>
          <p className="text-xs sm:text-sm text-slate-400">{t.settings.subtitle}</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white mb-2">{t.common.profile}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">{t.common.email}</span>
            <span className="text-sm text-white font-medium truncate block">{user?.email}</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">Ruolo Account</span>
            <span className="text-sm text-cyan-400 capitalize font-medium">{role}</span>
          </div>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="border-b border-white/10 pb-4 flex items-center gap-2.5">
          <Mail className="w-5 h-5 text-violet-400" />
          <div>
            <h2 className="text-base font-bold text-white">{t.settings.emailPreferencesTitle}</h2>
            <p className="text-xs text-slate-400">{t.settings.emailPreferencesDesc}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Weekly Digest Toggle (Consent unchecked by default) */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
            <input
              type="checkbox"
              checked={consentDigest}
              onChange={(e) => setConsentDigest(e.target.checked)}
              className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-white block">{t.settings.weeklyDigestLabel}</span>
              <span className="text-xs text-slate-400 block mt-0.5">{t.settings.weeklyDigestDesc}</span>
            </div>
          </label>

          {/* Reminder Day Before */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
            <input
              type="checkbox"
              checked={remindDayBefore}
              onChange={(e) => setRemindDayBefore(e.target.checked)}
              className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-violet-500 focus:ring-0 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-white block">{t.settings.reminderDayBeforeLabel}</span>
              <span className="text-xs text-slate-400 block mt-0.5">{t.settings.reminderDayBeforeDesc}</span>
            </div>
          </label>

          {/* Reminder Morning Of */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
            <input
              type="checkbox"
              checked={remindMorningOf}
              onChange={(e) => setRemindMorningOf(e.target.checked)}
              className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-pink-500 focus:ring-0 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-white block">{t.settings.reminderMorningOfLabel}</span>
              <span className="text-xs text-slate-400 block mt-0.5">{t.settings.reminderMorningOfDesc}</span>
            </div>
          </label>

          {/* Marketing Toggle */}
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
            <input
              type="checkbox"
              checked={emailMarketing}
              onChange={(e) => setEmailMarketing(e.target.checked)}
              className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <div>
              <span className="text-sm font-bold text-white block">{t.settings.marketingLabel}</span>
              <span className="text-xs text-slate-400 block mt-0.5">{t.settings.marketingDesc}</span>
            </div>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            onClick={handleSavePreferences}
            disabled={savingPrefs}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all disabled:opacity-50"
          >
            {savingPrefs ? t.common.loading : t.settings.savePreferences}
          </button>

          <button
            onClick={handleUnsubscribeAll}
            disabled={savingPrefs}
            className="text-xs text-slate-400 hover:text-rose-400 underline transition-colors"
          >
            {t.settings.unsubscribeAll}
          </button>
        </div>
      </div>

      {/* City & Language */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="border-b border-white/10 pb-4 flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">{t.settings.cityAndGenresTitle}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.fan.yourCity}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Milano, Roma, Bologna, Torino..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <LocateFixed className="w-4 h-4" />
                <span>{detectingLocation ? t.common.loading : t.fan.detectCity}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.common.language}</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLocale('it')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  locale === 'it'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                🇮🇹 Italiano (Predefinito)
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  locale === 'en'
                    ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/20 bg-rose-950/10 space-y-4">
        <div className="flex items-center gap-2.5 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-base font-bold">{t.settings.dangerZone}</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{t.settings.deleteAccountDesc}</p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>{deleting ? t.common.loading : t.settings.deleteAccountButton}</span>
        </button>
      </div>
    </div>
  );
}
