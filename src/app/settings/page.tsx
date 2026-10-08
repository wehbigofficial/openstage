'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dict } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { Settings, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login?next=/settings');
        return;
      }
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [router]);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(dict.settings.deleteAccountConfirm);
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      const res = await fetch('/api/account/delete', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Account deleted, redirect to home
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">
        {dict.common.loading}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border border-white/10 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{dict.settings.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Manage your profile and platform preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-slate-400 block mb-1">Email</span>
            <span className="text-sm text-white font-medium">{user.email}</span>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-slate-400 block mb-1">Account Role</span>
            <span className="text-sm text-cyan-400 capitalize font-medium">
              {user.user_metadata?.role || 'fan'}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border border-rose-500/20 bg-rose-950/10">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-bold text-rose-400">{dict.settings.dangerZone}</h2>
        </div>

        <p className="text-sm text-slate-300 mb-6">{dict.settings.deleteAccountDesc}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>{deleting ? dict.common.loading : dict.settings.deleteAccountButton}</span>
        </button>
      </div>
    </div>
  );
}
