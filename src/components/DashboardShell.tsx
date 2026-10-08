'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  PlusCircle,
  User,
  Bell,
  Settings,
  Lock,
  Sparkles,
} from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'I miei eventi',
      href: '/dashboard',
      icon: Calendar,
      active: pathname === '/dashboard' || pathname === '/dashboard/events',
    },
    {
      label: 'Crea evento',
      href: '/dashboard/events/new',
      icon: PlusCircle,
      active: pathname === '/dashboard/events/new',
    },
    {
      label: 'Profilo',
      href: '/dashboard/profile',
      icon: User,
      active: pathname === '/dashboard/profile',
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

  return (
    <div className="min-h-screen bg-[#07070D] flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#0A0A14]/80 backdrop-blur-xl shrink-0 p-5 justify-between">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Dashboard
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    item.active
                      ? 'bg-gradient-to-r from-violet-600/30 to-pink-600/30 border border-violet-500/40 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? 'text-pink-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Pro Items (Locked Cards) */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between px-3 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Funzioni PRO</span>
              </span>
              <Lock className="w-3 h-3 text-amber-400/70" />
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Biglietteria Diretta 0%</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Vendi biglietti direttamente senza commissioni tramite Stripe Connect.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent border border-pink-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Statistiche Fan & CRM</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Dati demografici, origini delle visualizzazioni e lista email fan.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400">
          <p className="text-slate-300 font-medium">OpenStage Indie Club</p>
          <p className="text-[10px]">Tutti gli eventi sono aperti e gratuiti da pubblicare.</p>
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
