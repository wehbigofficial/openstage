'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AdminTablePagination } from './AdminTablePagination';
import {
  UserPlus,
  Building2,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  Send,
  Check,
  X,
  Loader2,
  Clock,
  Sparkles,
  ShieldCheck,
  Copy,
} from 'lucide-react';

export function AdminOnBehalfSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [claimRequests, setClaimRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation Type: 'artist' | 'venue' | 'event'
  const [creationType, setCreationType] = useState<'artist' | 'venue' | 'event'>('artist');
  const [formData, setFormData] = useState<any>({
    name: '',
    title: '',
    artist_name: '',
    venue_name: '',
    genre: 'Indie Rock',
    city: 'Roma',
    address: '',
    bio: '',
    description: '',
    invite_email: '',
  });

  const [creating, setCreating] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/on-behalf');
      const json = await res.json();
      setClaimRequests(json.claimRequests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreatedSuccess(null);

    try {
      const res = await fetch('/api/admin/on-behalf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-on-behalf',
          targetType: creationType,
          data: formData,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setCreatedSuccess(
        formData.invite_email
          ? `${t.admin.claimInvitedSuccess} (${formData.invite_email})`
          : 'Elemento creato con successo come non rivendicato.'
      );

      // Reset form
      setFormData({
        name: '',
        title: '',
        artist_name: '',
        venue_name: '',
        genre: 'Indie Rock',
        city: 'Roma',
        address: '',
        bio: '',
        description: '',
        invite_email: '',
      });

      fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Errore creazione per conto');
    } finally {
      setCreating(false);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    try {
      const res = await fetch('/api/admin/on-behalf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve-claim', claimId }),
      });
      const json = await res.json();
      alert(json.message);
      fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Errore approvazione');
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    try {
      const res = await fetch('/api/admin/on-behalf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject-claim', claimId }),
      });
      const json = await res.json();
      alert(json.message);
      fetchClaims();
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(claimRequests.length / itemsPerPage) || 1;
  const paginatedClaims = claimRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. CREATION FORM ON BEHALF */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              {t.admin.createOnBehalfTitle}
            </h3>
            <p className="text-xs text-slate-400">
              Crea profili artisti, locali ed eventi senza proprietario (is_unclaimed = true) e invia l invito di rivendicazione.
            </p>
          </div>

          {/* Type Selector */}
          <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setCreationType('artist')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                creationType === 'artist'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.admin.artists}
            </button>
            <button
              type="button"
              onClick={() => setCreationType('venue')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                creationType === 'venue'
                  ? 'bg-cyan-500 text-black shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.admin.venues}
            </button>
            <button
              type="button"
              onClick={() => setCreationType('event')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                creationType === 'event'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.admin.events}
            </button>
          </div>
        </div>

        {createdSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{createdSuccess}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* ARTIST FORM */}
          {creationType === 'artist' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome Artista / Band *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="Nome d'arte o band"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Genere Musicale
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="Es. Indie Rock"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Città di Origine
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="Roma, Milano..."
                />
              </div>
            </div>
          )}

          {/* VENUE FORM */}
          {creationType === 'venue' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome del Locale *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="Nome locale"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Città
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="Roma, Milano..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Indirizzo
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  placeholder="Via..."
                />
              </div>
            </div>
          )}

          {/* EVENT FORM */}
          {creationType === 'event' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Titolo Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="Nome concerto"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Artista
                  </label>
                  <input
                    type="text"
                    value={formData.artist_name}
                    onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="Artista principale"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Locale
                  </label>
                  <input
                    type="text"
                    value={formData.venue_name}
                    onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                    placeholder="Locale ospitante"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email Invitation Field */}
          <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
              <Mail className="w-4 h-4" />
              <span>{t.admin.sendClaimInvitation}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Inserisci l indirizzo email del titolare. Riceverà un invito personalizzato con link crittografato per richiedere la rivendicazione del profilo.
            </p>
            <input
              type="email"
              value={formData.invite_email}
              onChange={(e) => setFormData({ ...formData, invite_email: e.target.value })}
              placeholder="booking@artista-o-locale.it (opzionale)"
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="text-right pt-2">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 ml-auto transition-all disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creazione in corso...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Crea Elemento Non Rivendicato</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. CLAIM REQUESTS & UNCLAIMED QUEUE */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl space-y-4">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              {t.admin.claimRequestsQueue}
            </h3>
            <p className="text-xs text-slate-400">
              Le richieste di rivendicazione inviate tramite email vengono approvate manualmente dall amministratore.
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {claimRequests.length} inviti / richieste
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/5 border-b border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t.common.name}</th>
                <th className="py-3 px-4 font-semibold">{t.admin.role}</th>
                <th className="py-3 px-4 font-semibold">Email Invitata</th>
                <th className="py-3 px-4 font-semibold">Richiedente & Note</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.status}</th>
                <th className="py-3 px-4 font-semibold text-right">{isIt ? 'Azioni' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {claim.target_name}
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[10px] font-mono text-cyan-400">
                    {claim.target_type}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {claim.invite_email || '-'}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    {claim.claimant_name ? (
                      <div>
                        <div className="font-semibold text-white">{claim.claimant_name} ({claim.claimant_email})</div>
                        {claim.claimant_notes && (
                          <div className="text-[10px] text-slate-400 truncate italic">
                            "{claim.claimant_notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">In attesa di richiesta</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        claim.status === 'requested'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          : claim.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : claim.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {claim.status === 'requested' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveClaim(claim.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                          >
                            {t.admin.approveClaim}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectClaim(claim.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors"
                          >
                            {t.admin.rejectClaim}
                          </button>
                        </>
                      ) : claim.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const url = `https://openstage.it/claim?token=${claim.token}`;
                            navigator.clipboard.writeText(url);
                            alert('Link di rivendicazione copiato: ' + url);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-[11px] font-semibold border border-white/10 flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copia Link</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs capitalize">{claim.status}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <AdminTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={claimRequests.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
}
