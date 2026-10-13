'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Mail,
  Bell,
  Settings,
  UserPlus,
  Database,
  ShieldCheck,
  ChevronRight,
  Music,
  UserCheck,
} from 'lucide-react';

export type AdminSectionTab =
  | 'overview'
  | 'events'
  | 'users'
  | 'contact'
  | 'maillog'
  | 'notifications'
  | 'settings'
  | 'on-behalf'
  | 'export'
  | 'radio'
  | 'referrals';

interface AdminSidebarProps {
  currentTab: AdminSectionTab;
  onSelectTab: (tab: AdminSectionTab) => void;
  openReportsCount?: number;
  newTicketsCount?: number;
  mailFailuresCount?: number;
  unreadNotifsCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  currentTab,
  onSelectTab,
  openReportsCount = 0,
  newTicketsCount = 0,
  mailFailuresCount = 0,
  unreadNotifsCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const menuItems: {
    id: AdminSectionTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'overview',
      label: t.admin.overview,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'events',
      label: t.admin.events,
      icon: <Calendar className="w-4 h-4" />,
      badge: openReportsCount,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'users',
      label: t.admin.users,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'contact',
      label: t.admin.contact,
      icon: <MessageSquare className="w-4 h-4" />,
      badge: newTicketsCount,
      badgeColor: 'bg-cyan-500 text-black',
    },
    {
      id: 'maillog',
      label: t.admin.mailLog,
      icon: <Mail className="w-4 h-4" />,
      badge: mailFailuresCount,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'notifications',
      label: t.admin.notifications,
      icon: <Bell className="w-4 h-4" />,
      badge: unreadNotifsCount,
      badgeColor: 'bg-violet-500',
    },
    {
      id: 'radio',
      label: 'Radio Tracks',
      icon: <Music className="w-4 h-4" />,
    },
    {
      id: 'referrals',
      label: t.admin.referrals,
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: t.admin.settings,
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: 'on-behalf',
      label: t.admin.createOnBehalf,
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      id: 'export',
      label: t.admin.export,
      icon: <Database className="w-4 h-4" />,
    },
  ];

  const sidebarContent = (
    <aside className="w-64 h-[calc(100vh-4rem)] sticky top-16 flex flex-col justify-between p-4 border-r border-white/10 bg-[#07070D]/95 backdrop-blur-md">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Amministrazione OpenStage
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && item.badge > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      item.badgeColor || 'bg-cyan-500 text-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security Footer Note */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1 text-slate-400">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sessione 2FA Attiva</span>
        </div>
        <p className="text-[10px] leading-tight">
          Accesso riservato. Tutte le azioni di moderazione vengono registrate.
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0">{sidebarContent}</div>

      {/* Mobile Sidebar Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-md flex">
          <div className="relative w-64 max-w-[80vw] h-full bg-[#07070D]">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
}
