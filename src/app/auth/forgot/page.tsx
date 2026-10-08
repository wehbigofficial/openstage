'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dict } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      setLoading(true);
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError(err?.message || 'Error requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-panel-glow rounded-2xl p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-white">{dict.auth.resetPassword}</h1>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Enter your registered email address and we will send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {dict.common.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-violet-600/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? dict.common.loading : dict.auth.sendResetLink}
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link
            href="/auth/login"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            &larr; Back to {dict.common.signIn}
          </Link>
        </div>
      </div>
    </div>
  );
}
