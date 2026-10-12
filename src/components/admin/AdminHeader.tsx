'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  ShieldCheck,
  Bell,
  LogOut,
  ExternalLink,
  Check,
  CheckCheck,
  Flag,
  Radio,
  Building2,
  AlertTriangle,
  Menu,
} from 'lucide-react';

interface AdminHeaderProps {
  adminEmail: string | null;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  onNavigateToNotifications?: () => void;
}

export function AdminHeader({
  adminEmail,
  onLogout,
  onToggleSidebar,
  onNavigateToNotifications,
}: AdminHeaderProps) {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const json = await res.json();
      setNotifications(json.notifications || []);
      setUnreadCount(json.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      });
      fetchNotifs();
    } catch {}
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#07070D]/90 border-b border-white/10 h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-pink-500 to-cyan-400 p-[2px]">
            <div className="w-full h-full bg-[#07070D] rounded-[6px] flex items-center justify-center">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-sm">
                O
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white">
              OpenStage
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-600/30 text-violet-300 border border-violet-500/30">
              Admin
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* 2FA Active badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>2FA TOTP Attiva</span>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            aria-label={t.admin.notificationsTitle}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-panel-glow border border-white/15 p-4 z-50 shadow-2xl text-white space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{t.admin.notificationsTitle}</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                      {unreadCount} nuove
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Segna lette
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-white/5">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="pt-2 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[12px] truncate max-w-[220px]">
                        {n.title}
                      </span>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(n.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setBellOpen(false);
                    if (onNavigateToNotifications) onNavigateToNotifications();
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  Visualizza tutte le notifiche →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin email & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <span className="hidden md:inline font-mono text-[11px] text-slate-400">
            {adminEmail}
          </span>

          <button
            type="button"
            onClick={onLogout}
            title={t.common.signOut}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
