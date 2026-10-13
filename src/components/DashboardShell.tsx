'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  Calendar,
  PlusCircle,
  User,
  Bell,
  Settings,
  Lock,
  Sparkles,
  Compass,
  Bookmark,
  Heart,
  Radio,
  BarChart3,
  Gift,
} from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
}

function DashboardShellInner({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const tab = searchParams.get('tab');

  const [role, setRole] = useState<'artist' | 'venue' | 'fan'>('fan');
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    async function checkRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role) {
          setRole(profile.role);
        } else if (user.user_metadata?.role) {
          setRole(user.user_metadata.role);
        }

        const { data: artist } = await supabase
          .from('artists')
          .select('is_pro')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (artist?.is_pro) {
          setIsPro(true);
        }
      }
    }
    checkRole();
  }, []);

  const isFan = role === 'fan';

  // Navigation items for fans
  const fanNavItems = [
    {
      label: t.fan.forYouTab,
      href: '/dashboard?tab=for-you',
      icon: Compass,
      active: pathname === '/dashboard' && (!tab || tab === 'for-you'),
    },
    {
      label: t.fan.savedTab,
      href: '/dashboard?tab=saved',
      icon: Bookmark,
      active: pathname === '/dashboard' && tab === 'saved',
    },
    {
      label: t.fan.remindersTab,
      href: '/dashboard?tab=reminders',
      icon: Bell,
      active: pathname === '/dashboard' && tab === 'reminders',
    },
    {
      label: t.fan.followingTab,
      href: '/dashboard?tab=following',
      icon: Heart,
      active: pathname === '/dashboard' && tab === 'following',
    },
    {
      label: t.common.settings,
      href: '/dashboard?tab=settings',
      icon: Settings,
      active: pathname === '/settings' || (pathname === '/dashboard' && tab === 'settings'),
    },
  ];

  // Navigation items for artists and venues
  const creatorNavItems = [
    {
      label: 'I miei eventi',
      href: '/dashboard',
      icon: Calendar,
      active: pathname === '/dashboard' && (!tab || tab === 'events'),
    },
    {
      label: 'Statistiche',
      href: '/dashboard?tab=stats',
      icon: BarChart3,
      active: pathname === '/dashboard' && tab === 'stats',
    },
    {
      label: 'Radio Indie 24/7',
      href: '/dashboard?tab=radio',
      icon: Radio,
      active: pathname === '/dashboard' && tab === 'radio',
    },
    {
      label: 'Inviti & Pro gratis',
      href: '/dashboard?tab=invites',
      icon: Gift,
      active: pathname === '/dashboard' && tab === 'invites',
    },
    {
      label: 'Crea evento',
      href: '/dashboard/events/new',
      icon: PlusCircle,
      active: pathname === '/dashboard/events/new',
    },
    {
      label: 'Profilo & Bio',
      href: '/dashboard/profile',
      icon: User,
      active: pathname === '/dashboard/profile',
    },
    {
      label: isPro ? 'Artist Pro Attivo' : 'Passa a Pro',
      href: '/go-pro',
      icon: Sparkles,
      active: pathname === '/go-pro',
      isProHighlight: !isPro,
    },
    {
      label: 'Notifiche',
      href: '/dashboard/notifications',
      icon: Bell,
      active: pathname === '/dashboard/notifications',
    },
    {
      label: 'Impostazioni',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  const navItems = isFan ? fanNavItems : creatorNavItems;

  return (
    <div className="min-h-screen bg-[#07070D] flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#0A0A14]/80 backdrop-blur-xl shrink-0 p-5 justify-between">
        <div className="space-y-6">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {isFan ? t.fan.dashboardTitle : 'Creator Hub'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {role}
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    item.isProHighlight
                      ? 'bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-violet-500/20 border border-amber-500/40 text-amber-300 hover:text-white shadow-sm'
                      : item.active
                      ? 'bg-gradient-to-r from-violet-600/30 to-pink-600/30 border border-violet-500/40 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.isProHighlight ? 'text-amber-400' : item.active ? 'text-pink-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Pro Items (Locked Cards) - ONLY for artists and venues when not yet Pro */}
          {!isFan && !isPro && (
            <div className="pt-6 border-t border-white/10 space-y-3">
              <Link
                href="/go-pro"
                className="flex items-center justify-between px-3 text-xs font-bold text-amber-400 uppercase tracking-wider hover:underline"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Funzioni PRO</span>
                </span>
                <Lock className="w-3 h-3 text-amber-400/70" />
              </Link>

              <Link
                href="/go-pro"
                className="block p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/20 space-y-1 hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Rotazione Radio 24/7</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                      PRO
                    </span>
                    <Lock className="w-3 h-3 text-amber-400" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Trasmetti fino a 3 brani MP3 in rotazione continua a tutti i visitatori.
                </p>
              </Link>

              <Link
                href="/go-pro"
                className="block p-3.5 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent border border-pink-500/20 space-y-1 hover:border-pink-500/40 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Statistiche & Top Città</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono">
                      PRO
                    </span>
                    <Lock className="w-3 h-3 text-pink-400" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Andamento nel tempo, ascolti radio, visite profilo e provenienza fan.
                </p>
              </Link>
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400">
          <p className="text-slate-300 font-medium">OpenStage Community</p>
          <p className="text-[10px]">
            {isFan
              ? 'Nessun abbonamento a pagamento per i fan. Musica dal vivo aperta a tutti.'
              : 'Tutti gli eventi sono aperti e gratuiti da pubblicare.'}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A14]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-semibold transition-all ${
                item.active ? 'text-pink-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070D]" />}>
      <DashboardShellInner>{children}</DashboardShellInner>
    </Suspense>
  );
}
