'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AdminTablePagination } from './AdminTablePagination';
import {
  Bell,
  Check,
  CheckCheck,
  Flag,
  Radio,
  Building2,
  AlertTriangle,
  UserPlus,
  Calendar,
  Sparkles,
  Info,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export function AdminNotificationsSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter: 'all' | 'unread' | 'email-alerts'
  const [filter, setFilter] = useState<'all' | 'unread' | 'email-alerts'>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications');
      const json = await res.json();
      setNotifications(json.notifications || []);
      setUnreadCount(json.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read', id }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const emailAlertTypes = [
    'radio_review',
    'venue_verification',
    'event_report',
    'payment_failed',
    'mail_failed',
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'email-alerts') return emailAlertTypes.includes(n.type);
    return true;
  });

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event_report':
        return <Flag className="w-4 h-4 text-rose-400" />;
      case 'radio_review':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'venue_verification':
        return <Building2 className="w-4 h-4 text-cyan-400" />;
      case 'mail_failed':
      case 'payment_failed':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'signup':
        return <UserPlus className="w-4 h-4 text-violet-400" />;
      case 'new_event':
        return <Calendar className="w-4 h-4 text-pink-400" />;
      case 'pro_purchase':
        return <Sparkles className="w-4 h-4 text-amber-300" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Informative Alert explaining email rules as required by specs */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-3 shadow-lg">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white">
            {isIt ? 'Criteri di notifica e avvisi email amministratore:' : 'Admin notification & email dispatch rules:'}
          </p>
          <p className="text-slate-300 leading-relaxed">
            {t.admin.adminAlertOnlyNotice}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl space-y-4">
        {/* Header & Controls */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t.admin.notificationsTitle}</h3>
              <p className="text-xs text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} ${isIt ? 'non lette' : 'unread'}`
                  : isIt
                  ? 'Tutti gli avvisi sono letti'
                  : 'All notifications caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.admin.all}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('unread');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === 'unread'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isIt ? 'Non lette' : 'Unread'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('email-alerts');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filter === 'email-alerts'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isIt ? 'Inviate via Email' : 'Email Alerts'}
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t.admin.markAllRead}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-white/5">
          {paginatedNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              {t.admin.noNotifications}
            </div>
          ) : (
            paginatedNotifications.map((notif) => {
              const isEmailAlert = emailAlertTypes.includes(notif.type);

              return (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                    !notif.is_read ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                      {getTypeIcon(notif.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-white">{notif.title}</span>
                        {isEmailAlert && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Email Alert
                          </span>
                        )}
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <span>{isIt ? 'Apri sezione' : 'View section'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(notif.id)}
                      title="Segna come letta"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Numbered Pagination */}
        <AdminTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredNotifications.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
