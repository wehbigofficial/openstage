'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { EventItem } from '@/lib/data/demoEvents';
import { formatEventDateTime } from '@/lib/utils/eventTime';
import { getEventUrl } from '@/lib/utils/slug';
import {
  getFanProfile,
  updateFanPreferences,
  getFanSavedEvents,
  toggleFanSaveEvent,
  getFanReminders,
  toggleFanReminder,
  getFanFollows,
  toggleFanFollow,
  getFanRecommendations,
  FanFollowItem,
  FanReminderItem,
} from '@/lib/services/fanService';
import {
  Compass,
  Bookmark,
  Bell,
  Heart,
  Settings,
  MapPin,
  Music,
  Trash2,
  Ticket,
  Calendar,
  ExternalLink,
  Sparkles,
  Check,
  AlertTriangle,
  LocateFixed,
  X,
  Share2,
} from 'lucide-react';

const ALL_GENRES = [
  'Indie Rock',
  'Post-Punk',
  'Elettronica',
  'Jazz / Soul',
  'Folk / Acustico',
  'Hip-Hop / Rap',
  'Ambient / Techno',
  'Metal / Hardcore',
  'Pop / Cantautorato',
];

interface FanDashboardProps {
  initialUser: any;
}

function FanDashboardInner({ initialUser }: FanDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale, setLocale } = useLanguage();

  const urlTab = searchParams.get('tab') as 'for-you' | 'saved' | 'reminders' | 'following' | 'settings' | null;
  const [activeTab, setActiveTab] = useState<'for-you' | 'saved' | 'reminders' | 'following' | 'settings'>(
    urlTab || 'for-you'
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [city, setCity] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Data states
  const [recommendations, setRecommendations] = useState<EventItem[]>([]);
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [reminders, setReminders] = useState<FanReminderItem[]>([]);
  const [follows, setFollows] = useState<FanFollowItem[]>([]);

  // Email toggles
  const [consentDigest, setConsentDigest] = useState(false);
  const [remindDayBefore, setRemindDayBefore] = useState(true);
  const [remindMorningOf, setRemindMorningOf] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);

  // Status & feedback
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (urlTab && ['for-you', 'saved', 'reminders', 'following', 'settings'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Load all fan data
  const loadFanData = async () => {
    try {
      setLoading(true);
      const userProfile = await getFanProfile(initialUser.id);
      setProfile(userProfile);

      const userCity = userProfile?.city || '';
      const userGenres = userProfile?.favorite_genres || [];

      setCity(userCity);
      setSelectedGenres(userGenres);
      setConsentDigest(userProfile?.email_consent_digest ?? false);
      setRemindDayBefore(userProfile?.email_reminders_day_before ?? true);
      setRemindMorningOf(userProfile?.email_reminders_morning_of ?? true);
      setEmailMarketing(userProfile?.email_marketing ?? false);

      // Recommendations
      const recs = await getFanRecommendations(initialUser.id, userCity, userGenres);
      setRecommendations(recs.recommended);

      // Saved, Reminders, Follows
      const [saved, rems, folls] = await Promise.all([
        getFanSavedEvents(initialUser.id),
        getFanReminders(initialUser.id),
        getFanFollows(initialUser.id),
      ]);

      setSavedEvents(saved);
      setReminders(rems);
      setFollows(folls);
    } catch (err) {
      console.error('Error loading fan dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFanData();
  }, [initialUser.id]);

  // Geolocation detector with user consent
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert(locale === 'it' ? 'Geolocalizzazione non supportata dal tuo browser' : 'Geolocation is not supported');
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
          await updateFanPreferences(initialUser.id, { city: detectedCity });
          setFeedbackNotice(`${t.fan.cityDetected}: ${detectedCity}`);
          setTimeout(() => setFeedbackNotice(null), 3000);

          // Refresh recommendations with new city
          const recs = await getFanRecommendations(initialUser.id, detectedCity, selectedGenres);
          setRecommendations(recs.recommended);
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

  // Toggle Genre
  const handleToggleGenre = async (genre: string) => {
    const updated = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];

    setSelectedGenres(updated);
    await updateFanPreferences(initialUser.id, { favorite_genres: updated });

    // Refresh recommendations
    const recs = await getFanRecommendations(initialUser.id, city, updated);
    setRecommendations(recs.recommended);
  };

  // Save Preferences
  const handleSavePreferences = async () => {
    try {
      setSavingPrefs(true);
      await updateFanPreferences(initialUser.id, {
        city,
        favorite_genres: selectedGenres,
        email_consent_digest: consentDigest,
        email_reminders_day_before: remindDayBefore,
        email_reminders_morning_of: remindMorningOf,
        email_marketing: emailMarketing,
      });

      setFeedbackNotice(t.settings.preferencesSaved);
      setTimeout(() => setFeedbackNotice(null), 3500);

      // Refresh recommendations with updated city
      const recs = await getFanRecommendations(initialUser.id, city, selectedGenres);
      setRecommendations(recs.recommended);
    } catch {
      alert('Error saving preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  // Unsave event
  const handleUnsave = async (eventId: string) => {
    await toggleFanSaveEvent(initialUser.id, eventId);
    setSavedEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // Toggle Reminder
  const handleToggleReminderSwitch = async (
    eventId: string,
    field: 'day_before' | 'morning_of',
    value: boolean
  ) => {
    const current = reminders.find((r) => r.event_id === eventId);
    if (!current) return;

    const newDayBefore = field === 'day_before' ? value : current.remind_day_before;
    const newMorningOf = field === 'morning_of' ? value : current.remind_morning_of;

    await toggleFanReminder(initialUser.id, eventId, {
      remindDayBefore: newDayBefore,
      remindMorningOf: newMorningOf,
    });

    setReminders((prev) =>
      prev.map((r) =>
        r.event_id === eventId
          ? { ...r, remind_day_before: newDayBefore, remind_morning_of: newMorningOf }
          : r
      )
    );
  };

  const handleRemoveReminder = async (eventId: string) => {
    await toggleFanReminder(initialUser.id, eventId);
    setReminders((prev) => prev.filter((r) => r.event_id !== eventId));
  };

  // Unfollow artist or venue
  const handleUnfollow = async (targetId: string, targetType: 'artist' | 'venue', name: string) => {
    await toggleFanFollow(initialUser.id, targetId, targetType, name);
    setFollows((prev) => prev.filter((f) => f.target_id !== targetId));
    setFeedbackNotice(`${t.fan.unfollowedToast} ${name}`);
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t.settings.deleteAccountConfirm);
    if (!confirmed) return;

    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/';
      } else {
        alert('Failed to delete account');
      }
    } catch {
      alert('Failed to delete account');
    }
  };

  interface TabItem {
    id: 'for-you' | 'saved' | 'reminders' | 'following' | 'settings';
    label: string;
    icon: any;
    badge?: number;
  }

  const tabs: TabItem[] = [
    { id: 'for-you', label: t.fan.forYouTab, icon: Compass },
    { id: 'saved', label: t.fan.savedTab, icon: Bookmark, badge: savedEvents.length },
    { id: 'reminders', label: t.fan.remindersTab, icon: Bell, badge: reminders.length },
    { id: 'following', label: t.fan.followingTab, icon: Heart, badge: follows.length },
    { id: 'settings', label: t.fan.settingsTab, icon: Settings },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-500/90 text-black font-bold text-sm shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Fan Member
            </span>
            {city && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{city}</span>
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t.fan.dashboardTitle}
          </h1>
        </div>

        {/* Action quick links */}
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            {t.home.exploreEvents}
          </Link>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.replace(`/dashboard?tab=${tab.id}`, { scroll: false });
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PER TE (FOR YOU) */}
      {activeTab === 'for-you' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">{t.fan.forYouTab}</h2>
              <p className="text-xs text-slate-400">{t.fan.forYouSubtitle}</p>
            </div>

            {/* Quick city detector */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>{detectingLocation ? t.common.loading : t.fan.detectCity}</span>
              </button>
            </div>
          </div>

          {/* Quick genre filter pills */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t.fan.favoriteGenres}
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => handleToggleGenre(g)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
                    }`}
                  >
                    {isSelected ? `✓ ${g}` : `+ ${g}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommendations Grid */}
          {recommendations.length === 0 ? (
            <div className="p-12 rounded-3xl glass-panel border border-white/10 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-base font-bold text-white">{t.fan.emptyForYou}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{t.fan.emptyForYouDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((evt) => {
                const { dateStr, timeStr } = formatEventDateTime(evt.starts_at, evt.timezone);
                const isSaved = savedEvents.some((s) => s.id === evt.id);
                return (
                  <div
                    key={evt.id}
                    className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-violet-500/40 transition-all"
                  >
                    <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
                      <img
                        src={evt.image_url}
                        alt={evt.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white">
                          {evt.genre}
                        </span>
                        {city && evt.city?.toLowerCase().includes(city.toLowerCase()) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-black">
                            {t.fan.nearYou}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={async () => {
                            await toggleFanSaveEvent(initialUser.id, evt.id);
                            const updatedSaved = await getFanSavedEvents(initialUser.id);
                            setSavedEvents(updatedSaved);
                          }}
                          className={`p-2 rounded-xl backdrop-blur-md transition-all ${
                            isSaved
                              ? 'bg-violet-600 text-white shadow-md'
                              : 'bg-black/60 text-slate-300 hover:text-white border border-white/10'
                          }`}
                          title={isSaved ? t.common.saved : t.common.save}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-xs text-cyan-400 font-semibold mb-1 flex items-center gap-1">
                          <Music className="w-3.5 h-3.5" />
                          <span>{evt.artist_name}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {evt.title}
                        </h4>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-violet-400" />
                          <span>{dateStr} • {timeStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="truncate">{evt.venue_name} • {evt.city}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                        <Link
                          href={getEventUrl(evt)}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                        >
                          {t.common.viewDetails} →
                        </Link>
                        {evt.ticket_url && (
                          <a
                            href={evt.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20"
                            title={t.common.tickets}
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EVENTI SALVATI (SAVED EVENTS) */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <h2 className="text-lg font-bold text-white mb-1">{t.fan.savedTab} ({savedEvents.length})</h2>
            <p className="text-xs text-slate-400">{t.fan.savedSubtitle}</p>
          </div>

          {savedEvents.length === 0 ? (
            <div className="p-12 rounded-3xl glass-panel border border-white/10 text-center space-y-3">
              <Bookmark className="w-10 h-10 text-violet-400 mx-auto" />
              <h3 className="text-base font-bold text-white">{t.fan.emptySaved}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{t.fan.emptySavedDesc}</p>
              <div className="pt-2">
                <Link
                  href="/explore"
                  className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-xs"
                >
                  {t.home.exploreEvents}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedEvents.map((evt) => {
                const { dateStr, timeStr } = formatEventDateTime(evt.starts_at, evt.timezone);
                return (
                  <div
                    key={evt.id}
                    className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative aspect-[16/9] bg-slate-900">
                      <img src={evt.image_url} alt={evt.title} className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleUnsave(evt.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-semibold text-cyan-400">{evt.artist_name}</span>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{evt.title}</h4>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-violet-400" />
                          <span>{dateStr} • {timeStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="truncate">{evt.venue_name} • {evt.city}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                        <Link
                          href={getEventUrl(evt)}
                          className="text-xs font-semibold text-cyan-400 hover:underline"
                        >
                          {t.common.viewDetails} →
                        </Link>
                        {evt.ticket_url && (
                          <a
                            href={evt.ticket_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold"
                          >
                            {t.common.tickets}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROMEMORIA (REMINDERS) */}
      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <h2 className="text-lg font-bold text-white mb-1">{t.fan.remindersTab} ({reminders.length})</h2>
            <p className="text-xs text-slate-400">{t.fan.remindersSubtitle}</p>
          </div>

          {reminders.length === 0 ? (
            <div className="p-12 rounded-3xl glass-panel border border-white/10 text-center space-y-3">
              <Bell className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-base font-bold text-white">{t.fan.emptyReminders}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{t.fan.emptyRemindersDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((rem) => {
                const evt = rem.event;
                if (!evt) return null;
                const { fullStr } = formatEventDateTime(evt.starts_at, evt.timezone);

                return (
                  <div
                    key={rem.id}
                    className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-cyan-400">{evt.artist_name}</span>
                      <h4 className="text-base font-bold text-white">{evt.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <span>📅 {fullStr}</span>
                        <span>•</span>
                        <span>📍 {evt.venue_name} ({evt.city})</span>
                      </p>
                    </div>

                    {/* Toggle switches for day before & morning of */}
                    <div className="flex flex-wrap items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rem.remind_day_before}
                          onChange={(e) =>
                            handleToggleReminderSwitch(rem.event_id, 'day_before', e.target.checked)
                          }
                          className="rounded bg-white/10 border-white/20 text-violet-600 focus:ring-0"
                        />
                        <span>{t.fan.remindDayBefore}</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rem.remind_morning_of}
                          onChange={(e) =>
                            handleToggleReminderSwitch(rem.event_id, 'morning_of', e.target.checked)
                          }
                          className="rounded bg-white/10 border-white/20 text-cyan-600 focus:ring-0"
                        />
                        <span>{t.fan.remindMorningOf}</span>
                      </label>

                      <button
                        onClick={() => handleRemoveReminder(rem.event_id)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SEGUITI (FOLLOWING) */}
      {activeTab === 'following' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <h2 className="text-lg font-bold text-white mb-1">{t.fan.followingTab} ({follows.length})</h2>
            <p className="text-xs text-slate-400">{t.fan.followingSubtitle}</p>
          </div>

          {follows.length === 0 ? (
            <div className="p-12 rounded-3xl glass-panel border border-white/10 text-center space-y-3">
              <Heart className="w-10 h-10 text-pink-400 mx-auto" />
              <h3 className="text-base font-bold text-white">{t.fan.emptyFollowing}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{t.fan.emptyFollowingDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {follows.map((item) => {
                const targetUrl =
                  item.target_type === 'artist'
                    ? `/artists/${encodeURIComponent(item.target_name)}`
                    : `/venues/${encodeURIComponent(item.target_name)}`;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-600 flex items-center justify-center font-bold text-white text-sm">
                        {item.target_name.charAt(0)}
                      </div>
                      <div>
                        <Link href={targetUrl} className="text-sm font-bold text-white hover:underline">
                          {item.target_name}
                        </Link>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          {item.target_type === 'artist' ? 'Artista' : 'Locale'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnfollow(item.target_id, item.target_type, item.target_name)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold border border-white/5 transition-colors"
                    >
                      {t.common.unfollow}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: IMPOSTAZIONI (SETTINGS) */}
      {activeTab === 'settings' && (
        <div className="space-y-8 max-w-3xl">
          <div className="p-5 rounded-2xl glass-panel border border-white/10">
            <h2 className="text-lg font-bold text-white mb-1">{t.settings.title}</h2>
            <p className="text-xs text-slate-400">{t.settings.subtitle}</p>
          </div>

          {/* Email Preferences Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white mb-1">{t.settings.emailPreferencesTitle}</h3>
              <p className="text-xs text-slate-400">{t.settings.emailPreferencesDesc}</p>
            </div>

            <div className="space-y-4">
              {/* Digest switch (unchecked by default consent) */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentDigest}
                  onChange={(e) => setConsentDigest(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="text-sm font-bold text-white block">{t.settings.weeklyDigestLabel}</span>
                  <span className="text-xs text-slate-400 block">{t.settings.weeklyDigestDesc}</span>
                </div>
              </label>

              {/* Day before reminder */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remindDayBefore}
                  onChange={(e) => setRemindDayBefore(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-violet-500 focus:ring-0"
                />
                <div>
                  <span className="text-sm font-bold text-white block">{t.settings.reminderDayBeforeLabel}</span>
                  <span className="text-xs text-slate-400 block">{t.settings.reminderDayBeforeDesc}</span>
                </div>
              </label>

              {/* Morning of reminder */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remindMorningOf}
                  onChange={(e) => setRemindMorningOf(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-pink-500 focus:ring-0"
                />
                <div>
                  <span className="text-sm font-bold text-white block">{t.settings.reminderMorningOfLabel}</span>
                  <span className="text-xs text-slate-400 block">{t.settings.reminderMorningOfDesc}</span>
                </div>
              </label>

              {/* Marketing updates */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailMarketing}
                  onChange={(e) => setEmailMarketing(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded bg-white/10 border-white/20 text-amber-500 focus:ring-0"
                />
                <div>
                  <span className="text-sm font-bold text-white block">{t.settings.marketingLabel}</span>
                  <span className="text-xs text-slate-400 block">{t.settings.marketingDesc}</span>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all disabled:opacity-50"
              >
                {savingPrefs ? t.common.loading : t.settings.savePreferences}
              </button>

              <button
                onClick={async () => {
                  setConsentDigest(false);
                  setRemindDayBefore(false);
                  setRemindMorningOf(false);
                  setEmailMarketing(false);
                  await updateFanPreferences(initialUser.id, {
                    email_consent_digest: false,
                    email_reminders_day_before: false,
                    email_reminders_morning_of: false,
                    email_marketing: false,
                  });
                  setFeedbackNotice(t.settings.unsubscribeAll);
                  setTimeout(() => setFeedbackNotice(null), 3000);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 underline"
              >
                {t.settings.unsubscribeAll}
              </button>
            </div>
          </div>

          {/* City & Language Card */}
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white">{t.settings.cityAndGenresTitle}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.fan.yourCity}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Milano, Bologna, Roma..."
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">{t.common.language}</label>
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
          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-rose-500/20 bg-rose-950/10 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">{t.settings.dangerZone}</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{t.settings.deleteAccountDesc}</p>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.settings.deleteAccountButton}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FanDashboard(props: FanDashboardProps) {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-12 text-center text-slate-400">Caricamento...</div>}>
      <FanDashboardInner {...props} />
    </Suspense>
  );
}
