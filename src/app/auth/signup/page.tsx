'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { dict } from '@/lib/dictionary';
import { RoleCard } from '@/components/RoleCard';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { createClient } from '@/lib/supabase/client';
import { Mic2, Building2, Compass, AlertCircle } from 'lucide-react';

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams?.get('role') as 'artist' | 'venue' | 'fan') || 'artist';

  const [role, setRole] = useState<'artist' | 'venue' | 'fan'>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [consentDigest, setConsentDigest] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            display_name: displayName,
            city: city.trim() || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Enqueue welcome email in background
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            email,
            name: displayName || email.split('@')[0],
            role,
          }),
        }).catch(() => {});

        await supabase.from('profiles').upsert({
          id: data.user.id,
          role,
          display_name: displayName || email.split('@')[0],
          city: city.trim() || null,
          country: 'Italy',
          email_consent_digest: consentDigest,
          email_reminders_day_before: true,
          email_reminders_morning_of: true,
        });

        if (!data.session) {
          setSuccessMessage(dict.auth.checkEmailConfirmation);
          return;
        }

        if (role === 'artist') {
          router.push('/onboarding/artist');
        } else if (role === 'venue') {
          router.push('/events/new');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          {dict.auth.chooseRoleTitle}
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          {dict.auth.chooseRoleSubtitle}
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
        <RoleCard
          id="artist"
          title={dict.auth.roleArtistTitle}
          description={dict.auth.roleArtistDesc}
          icon={<Mic2 className="w-6 h-6" />}
          selected={role === 'artist'}
          accentColor="pink"
          onSelect={(r) => setRole(r)}
        />
        <RoleCard
          id="venue"
          title={dict.auth.roleVenueTitle}
          description={dict.auth.roleVenueDesc}
          icon={<Building2 className="w-6 h-6" />}
          selected={role === 'venue'}
          accentColor="violet"
          onSelect={(r) => setRole(r)}
        />
        <RoleCard
          id="fan"
          title={dict.auth.roleFanTitle}
          description={dict.auth.roleFanDesc}
          icon={<Compass className="w-6 h-6" />}
          selected={role === 'fan'}
          accentColor="cyan"
          onSelect={(r) => setRole(r)}
        />
      </div>

      {/* Form Container */}
      <div className="max-w-md mx-auto glass-panel-glow rounded-2xl p-8 border border-white/10">
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-300 mx-auto flex items-center justify-center mb-4">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Check your inbox</h3>
            <p className="text-sm text-slate-300 mb-6">{successMessage}</p>
            <Link
              href="/auth/login"
              className="inline-block px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm"
            >
              Go to Log in
            </Link>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all shadow-md active:scale-[0.98] mb-6"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{dict.auth.googleButton}</span>
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0e0e1a] px-3 text-xs text-slate-500 uppercase">
                {dict.common.or}
              </span>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {role === 'artist'
                    ? 'Stage / Band Name'
                    : role === 'venue'
                    ? 'Venue Name'
                    : 'Display Name'}
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                  placeholder="e.g. The Midnight Echoes"
                />
              </div>

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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {dict.common.password}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {dict.auth.optionalCityLabel}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                  placeholder="e.g. Milano, Bologna, Roma..."
                />
              </div>

              {/* Weekly Digest Consent Box (Unchecked by default as required) */}
              <div className="flex items-start gap-2.5 pt-2 p-3 rounded-xl bg-white/5 border border-white/5">
                <input
                  type="checkbox"
                  id="consentDigest"
                  checked={consentDigest}
                  onChange={(e) => setConsentDigest(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="consentDigest" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  {dict.auth.consentWeeklyDigest}
                </label>
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-cyan-400 underline hover:text-cyan-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-cyan-400 underline hover:text-cyan-300">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-violet-600/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? dict.common.loading : dict.common.signUp}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              {dict.auth.haveAccount}{' '}
              <Link href="/auth/login" className="text-cyan-400 underline hover:text-cyan-300">
                {dict.common.signIn}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">{dict.common.loading}</div>}>
      <SignUpForm />
    </Suspense>
  );
}
