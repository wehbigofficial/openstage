'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface AdminMfaGateProps {
  authenticated: boolean;
  isMfaVerified: boolean;
  mfaStatus: { isEnrolled: boolean; hasRecoveryCodes: boolean };
  adminEmailConfigured: string;
  userEmail: string | null;
  onVerified: () => void;
  children: React.ReactNode;
}

export function AdminMfaGate({
  authenticated,
  isMfaVerified,
  mfaStatus,
  adminEmailConfigured,
  userEmail,
  onVerified,
  children,
}: AdminMfaGateProps) {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  // Mode: 'login' | 'setup' | 'verify'
  const initialMode = !authenticated
    ? 'login'
    : !mfaStatus.isEnrolled
    ? 'setup'
    : 'verify';

  const [mode, setMode] = useState<'login' | 'setup' | 'verify'>(initialMode);
  const [totpCode, setTotpCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  // Setup state
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    recoveryCodes: string[];
  } | null>(null);
  const [codesCopied, setCodesCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // If already authenticated and 2FA verified for this session, render children!
  if (authenticated && isMfaVerified) {
    return <>{children}</>;
  }

  // Handle Demo Admin Login
  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'demo-login' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Check MFA status
      const statusRes = await fetch('/api/admin/auth');
      const statusData = await statusRes.json();

      if (statusData.mfaStatus.isEnrolled) {
        setMode('verify');
      } else {
        await handleStartSetup();
      }
    } catch (err: any) {
      setError(err.message || 'Errore di autenticazione');
    } finally {
      setLoading(false);
    }
  };

  // Start 2FA Setup
  const handleStartSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-enroll' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSetupData({
        secret: data.secret,
        qrCodeDataUrl: data.qrCodeDataUrl,
        recoveryCodes: data.recoveryCodes,
      });
      setMode('setup');
    } catch (err: any) {
      setError(err.message || 'Impossibile iniziare la configurazione 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Confirm 2FA Setup
  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm-setup', code: totpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onVerified();
    } catch (err: any) {
      setError(err.message || 'Codice TOTP non valido');
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA Login Challenge
  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const codeToSend = useRecovery ? recoveryCode : totpCode;
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-login', code: codeToSend }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onVerified();
    } catch (err: any) {
      setError(err.message || 'Codice errato');
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    if (!setupData?.recoveryCodes) return;
    const text = setupData.recoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 3000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl relative overflow-hidden text-white">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* 1. LOGIN SCREEN */}
        {mode === 'login' && (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto shadow-lg shadow-violet-600/20">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                {t.admin.adminTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5">
                {t.admin.accessRestricted} (<code>{adminEmailConfigured}</code>)
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleDemoLogin}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-sm hover:opacity-95 transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{t.admin.demoAdminLogin}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 2. 2FA SETUP SCREEN */}
        {mode === 'setup' && setupData && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {t.admin.twoFactorSetupTitle}
                </h2>
                <p className="text-xs text-slate-400">Supabase TOTP + Codici di Recupero</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.admin.twoFactorSetupDesc}
            </p>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* QR Code and Secret */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="QR Code TOTP"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <div className="space-y-2 text-left">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t.admin.totpSecretKey}
                </p>
                <p className="font-mono text-xs text-cyan-300 bg-black/40 px-2.5 py-1.5 rounded-lg border border-cyan-500/30 break-all select-all">
                  {setupData.secret}
                </p>
                <p className="text-[11px] text-slate-400">
                  Compatibile con Google Authenticator, 1Password, Authy o Keychain.
                </p>
              </div>
            </div>

            {/* Recovery Codes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  {t.admin.recoveryCodes}
                </span>
                <button
                  type="button"
                  onClick={copyRecoveryCodes}
                  className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {codesCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{t.admin.codesCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.admin.copyCodes}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-center text-slate-300">
                {setupData.recoveryCodes.map((code, idx) => (
                  <div key={idx} className="p-1 rounded bg-white/5 border border-white/5 select-all">
                    {code}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{t.admin.recoveryCodesWarning}</span>
              </p>
            </div>

            {/* Confirm with 6-digit TOTP code */}
            <form onSubmit={handleConfirmSetup} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t.admin.enterTotpCode}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.5em] font-mono text-xl py-3 rounded-xl bg-white/5 border border-white/10 text-cyan-300 focus:outline-none focus:border-cyan-400"
                  placeholder="123456"
                />
              </div>

              <button
                type="submit"
                disabled={loading || totpCode.length < 6}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-sm hover:opacity-95 transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{t.admin.confirmSetup}</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 3. 2FA VERIFICATION LOGIN SCREEN */}
        {mode === 'verify' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  {t.admin.twoFactorVerifyTitle}
                </h2>
                <p className="text-xs text-slate-400">{userEmail || adminEmailConfigured}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.admin.twoFactorVerifyDesc}
            </p>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyLogin} className="space-y-4">
              {!useRecovery ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.admin.enterTotpCode}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 rounded-xl bg-white/5 border border-white/10 text-cyan-300 focus:outline-none focus:border-cyan-400"
                    placeholder="••••••"
                  />
                  <div className="text-right mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseRecovery(true);
                        setError(null);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      {t.admin.useRecoveryCode}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.admin.enterRecoveryCode}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full text-center font-mono text-lg py-3 rounded-xl bg-white/5 border border-white/10 text-amber-300 focus:outline-none focus:border-amber-400"
                    placeholder="1234-5678"
                  />
                  <div className="text-right mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseRecovery(false);
                        setError(null);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      {t.admin.useTotpCode}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!useRecovery && totpCode.length < 6) || (useRecovery && !recoveryCode)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-sm hover:opacity-95 transition-all shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{t.admin.verifyAndLogin}</span>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleStartSetup}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Reimposta configurazione 2FA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
