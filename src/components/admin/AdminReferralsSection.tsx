'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { createAdminClient } from '@/lib/supabase/admin';
import { Loader2, Gift, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Users, ChevronDown, ChevronUp } from 'lucide-react';

interface ReferralItem {
  id: string;
  referrer_id: string;
  invited_id: string;
  invite_code: string;
  is_email_verified: boolean;
  has_published_event: boolean;
  is_qualified: boolean;
  is_revoked: boolean;
  revocation_reason: string | null;
  created_at: string;
  qualified_at: string | null;
  referrer?: {
    id: string;
    display_name: string;
  } | null;
  invited?: {
    id: string;
    display_name: string;
  } | null;
}

interface ReferrerAggregate {
  referrerId: string;
  referrerName: string;
  inviteCode: string;
  invitedCount: number;
  verifiedCount: number;
  qualifiedCount: number;
  isRewarded: boolean;
  referrals: ReferralItem[];
}

export function AdminReferralsSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [referrers, setReferrers] = useState<ReferrerAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedReferrer, setExpandedReferrer] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createAdminClient();

      const { data: referrals, error } = await supabase
        .from('artist_referrals')
        .select(`
          *,
          referrer:referrer_id (
            id,
            display_name
          ),
          invited:invited_id (
            id,
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by referrer
      const map = new Map<string, ReferrerAggregate>();

      for (const r of referrals || []) {
        const refId = r.referrer_id;
        if (!map.has(refId)) {
          map.set(refId, {
            referrerId: refId,
            referrerName: r.referrer?.display_name || 'Artista ' + refId.substring(0, 6),
            inviteCode: r.invite_code,
            invitedCount: 0,
            verifiedCount: 0,
            qualifiedCount: 0,
            isRewarded: false,
            referrals: [],
          });
        }

        const item = map.get(refId)!;
        item.invitedCount += 1;
        if (r.is_email_verified) item.verifiedCount += 1;
        if (r.is_qualified && !r.is_revoked) item.qualifiedCount += 1;
        item.referrals.push(r);
      }

      // Check Pro status for each referrer
      const list = Array.from(map.values());
      for (const item of list) {
        const { data: artist } = await supabase
          .from('artists')
          .select('is_pro, pro_granted_by')
          .eq('profile_id', item.referrerId)
          .maybeSingle();

        item.isRewarded = Boolean(artist?.is_pro && artist?.pro_granted_by === 'referral');
      }

      setReferrers(list);
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRevoke = async (referralId: string, referrerId: string) => {
    const reason = prompt(isIt ? 'Motivo della revoca (obbligatorio):' : 'Revocation reason (required):');
    if (!reason) return;

    try {
      setActionLoading(referralId);
      const supabase = createAdminClient();

      // Revoke the referral
      const { data: ref, error } = await supabase
        .from('artist_referrals')
        .update({
          is_revoked: true,
          revocation_reason: reason,
        })
        .eq('id', referralId)
        .select()
        .single();

      if (error) throw error;

      // Re-check referrer qualified count
      const { count } = await supabase
        .from('artist_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', referrerId)
        .eq('is_qualified', true)
        .eq('is_revoked', false);

      const validCount = count || 0;

      // If referrer was granted Pro via referral and now has less than 3, revoke Pro
      const { data: artist } = await supabase
        .from('artists')
        .select('is_pro, pro_granted_by')
        .eq('profile_id', referrerId)
        .maybeSingle();

      if (artist?.pro_granted_by === 'referral' && validCount < 3) {
        await supabase
          .from('artists')
          .update({
            is_pro: false,
            featured_eligible: false,
          })
          .eq('profile_id', referrerId);
      }

      fetchData();
    } catch (err: any) {
      alert(err.message || 'Errore durante la revoca');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (referral: ReferralItem) => {
    if (referral.is_revoked) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Revocato
        </span>
      );
    }
    if (referral.is_qualified) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Qualificato</span>
        </span>
      );
    }
    const badges = [];
    if (referral.is_email_verified) {
      badges.push(
        <span key="v" className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Email OK
        </span>
      );
    } else {
      badges.push(
        <span key="v" className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Email Pending
        </span>
      );
    }
    if (referral.has_published_event) {
      badges.push(
        <span key="e" className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
          Evento Pubblicato
        </span>
      );
    } else {
      badges.push(
        <span key="e" className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-500 border border-white/10">
          Nessun Evento
        </span>
      );
    }
    return <span className="flex flex-wrap gap-1.5">{badges}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Gift className="w-6 h-6 text-pink-400" />
            <span>{t.admin.referrals}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isIt
              ? 'Programma inviti: 3 artisti qualificati = Artist Pro gratis a vita. Revoca abusi qui.'
              : 'Referral program: 3 qualified artists = free Artist Pro for life. Revoke abuse here.'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isIt ? 'Totale Inviti Inviati' : 'Total Invites Sent'}</span>
            <Gift className="w-4 h-4 text-pink-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {referrers.reduce((sum, r) => sum + r.invitedCount, 0)}
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isIt ? 'Email Verificate' : 'Verified Emails'}</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {referrers.reduce((sum, r) => sum + r.verifiedCount, 0)}
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isIt ? 'Artisti Qualificati' : 'Qualified Artists'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {referrers.reduce((sum, r) => sum + r.qualifiedCount, 0)}
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isIt ? 'Pro Sbloccati Gratis' : 'Pro Unlocked Free'}</span>
            <Gift className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {referrers.filter(r => r.isRewarded).length}
          </p>
        </div>
      </div>

      {/* Referrers List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          <span className="text-xs">{t.common.loading}</span>
        </div>
      ) : referrers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 space-y-4">
          <Gift className="w-12 h-12 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-white">Nessun invito registrato</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Gli artisti iniziano a invitare colleghi dal loro dashboard. I dati appariranno qui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {referrers.map((referrer) => (
            <div
              key={referrer.referrerId}
              className="rounded-2xl glass-panel border border-white/10 overflow-hidden"
            >
              {/* Referrer Header */}
              <button
                onClick={() => setExpandedReferrer(expandedReferrer === referrer.referrerId ? null : referrer.referrerId)}
                className="w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-600 flex items-center justify-center text-white font-black text-lg">
                    {referrer.referrerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{referrer.referrerName}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{referrer.referrerId.substring(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        {referrer.inviteCode}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>{referrer.invitedCount} inviati • {referrer.verifiedCount} verificati • <strong className="text-emerald-400">{referrer.qualifiedCount} qualificati</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {referrer.isRewarded && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      <span>{isIt ? 'PRO GRATIS' : 'FREE PRO'}</span>
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${referrer.qualifiedCount >= 3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                    {referrer.qualifiedCount}/3
                  </span>
                  <span className="transition-transform" style={{ transform: expandedReferrer === referrer.referrerId ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </span>
                </div>
              </button>

              {/* Expanded Referrals Detail */}
              {expandedReferrer === referrer.referrerId && (
                <div className="border-t border-white/10 p-4">
                  <div className="space-y-3">
                    {referrer.referrals.map((ref) => (
                      <div key={ref.id} className="p-4 rounded-xl glass-panel border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-slate-400">#{ref.invited?.display_name || ref.invited_id.substring(0, 6)}</span>
                            {getStatusBadge(ref)}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Invito: {new Date(ref.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {ref.qualified_at && (' • Qualificato: ' + new Date(ref.qualified_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }))}
                          </p>
                          {ref.is_revoked && ref.revocation_reason && (
                            <p className="text-xs text-rose-400">Revoca: {ref.revocation_reason}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {!ref.is_revoked && ref.is_qualified && (
                            <button
                              onClick={() => handleRevoke(ref.id, referrer.referrerId)}
                              disabled={actionLoading === ref.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{isIt ? 'Revoca' : 'Revoke'}</span>
                            </button>
                          )}
                          {ref.is_revoked && (
                            <span className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-500 text-xs font-bold">Revocato</span>
                          )}
                          {actionLoading === ref.id && (
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}