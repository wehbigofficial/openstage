'use client';

import Link from 'next/link';
import { dict } from '@/lib/dictionary';
import { LogOut, Settings, PlusCircle, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface UserNavProps {
  user: any | null;
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/demo-login', { method: 'DELETE' });
    } catch {}
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {dict.common.signIn}
        </Link>
        <Link
          href="/auth/signup"
          className="text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold shadow-lg shadow-violet-600/20 hover:opacity-95 transition-all"
        >
          {dict.common.signUp}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3">
      <Link
        href="/events/new"
        className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all"
      >
        <PlusCircle className="w-3.5 h-3.5" />
        {dict.nav.createEvent}
      </Link>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1 rounded-full border border-white/20 hover:border-violet-400 transition-colors bg-white/5"
          aria-label="User menu"
        >
          <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-300">
            <User className="w-4 h-4" />
          </div>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-xl glass-panel-glow py-2 z-50 text-sm border border-white/10"
            onClick={() => setDropdownOpen(false)}
          >
            <div className="px-4 py-2 border-b border-white/10">
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              {dict.common.settings}
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-white/5 text-left transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {dict.common.signOut}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
