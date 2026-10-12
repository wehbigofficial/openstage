'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AdminTablePagination } from './AdminTablePagination';
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  AlertCircle,
  X,
  Loader2,
  HelpCircle,
} from 'lucide-react';

export function AdminContactSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Ticket for View / Reply
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/contact?${params.toString()}`);
      const json = await res.json();
      setTickets(json.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, typeFilter, searchQuery]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    setSendingReply(true);

    try {
      const res = await fetch('/api/admin/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          replyText: replyText.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setReplySuccess(true);
      setTimeout(() => {
        setReplySuccess(false);
        setActiveTicket(null);
        setReplyText('');
      }, 2000);

      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Errore invio risposta');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await fetch('/api/admin/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status }),
      });
      fetchTickets();
      if (activeTicket && activeTicket.id === ticketId) {
        setActiveTicket({ ...activeTicket, status });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(tickets.length / itemsPerPage) || 1;
  const paginatedTickets = tickets.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const newCount = tickets.filter((tk) => tk.status === 'new').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl space-y-4">
        {/* Header and Filters */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={isIt ? 'Cerca per nome, email o ticket...' : 'Search by name, email or ticket...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Tabs */}
            <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              {[
                { id: 'all', label: t.admin.all },
                { id: 'new', label: t.admin.newTicket, count: newCount },
                { id: 'answered', label: t.admin.answeredTicket },
                { id: 'closed', label: t.admin.closedTicket },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(item.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                    statusFilter === item.id
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count && item.count > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 capitalize"
            >
              <option value="all" className="bg-slate-900">{t.admin.role}: {t.admin.all}</option>
              <option value="artist" className="bg-slate-900">{t.admin.artists}</option>
              <option value="venue" className="bg-slate-900">{t.admin.venues}</option>
              <option value="fan" className="bg-slate-900">{t.admin.fans}</option>
              <option value="other" className="bg-slate-900">Altro / Other</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/5 border-b border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t.admin.ticket}</th>
                <th className="py-3 px-4 font-semibold">{t.common.name}</th>
                <th className="py-3 px-4 font-semibold">{t.admin.role}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.status}</th>
                <th className="py-3 px-4 font-semibold">{isIt ? 'Data' : 'Date'}</th>
                <th className="py-3 px-4 font-semibold text-right">{isIt ? 'Azioni' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-cyan-300 font-bold">
                    {ticket.ticket_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                    <div>{ticket.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{ticket.email}</div>
                  </td>
                  <td className="py-3.5 px-4 capitalize">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                      {ticket.user_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ticket.status === 'new'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : ticket.status === 'answered'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {ticket.status === 'new'
                        ? t.admin.newTicket
                        : ticket.status === 'answered'
                        ? t.admin.answeredTicket
                        : t.admin.closedTicket}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(ticket.created_at).toLocaleDateString(isIt ? 'it-IT' : 'en-US', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTicket(ticket);
                        setReplyText(ticket.admin_reply || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/20 transition-colors"
                    >
                      {ticket.status === 'new' ? (isIt ? 'Rispondi' : 'Reply') : (isIt ? 'Visualizza' : 'View')}
                    </button>
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
          totalItems={tickets.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* TICKET DETAILS & REPLY MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-5 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveTicket(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{activeTicket.name}</h3>
                    <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                      #{activeTicket.ticket_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{activeTicket.email} ({activeTicket.user_type})</p>
                </div>
              </div>

              {/* Status Action */}
              <div className="flex items-center gap-2">
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleUpdateStatus(activeTicket.id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-xs text-white focus:outline-none"
                >
                  <option value="new">{t.admin.newTicket}</option>
                  <option value="answered">{t.admin.answeredTicket}</option>
                  <option value="closed">{t.admin.closedTicket}</option>
                </select>
              </div>
            </div>

            {/* Original Message */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isIt ? 'Messaggio dell utente' : 'User message'}
              </span>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {activeTicket.message}
              </div>
            </div>

            {/* Previous Admin Reply if any */}
            {activeTicket.admin_reply && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  {t.admin.adminReply}
                </span>
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-white leading-relaxed whitespace-pre-wrap">
                  {activeTicket.admin_reply}
                </div>
                {activeTicket.replied_at && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Inviata via Resend il {new Date(activeTicket.replied_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Admin Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-4 pt-2 border-t border-white/10">
              {replySuccess ? (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs text-center font-semibold">
                  {t.admin.replySentSuccess}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isIt ? 'Scrivi risposta via email (Resend)' : 'Write email response (Resend)'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isIt ? 'Gentile utente...' : 'Hello...'}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{t.admin.noReplyNotice}</span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTicket(null)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                    >
                      {t.common.close}
                    </button>
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-xs text-white shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50"
                    >
                      {sendingReply ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Invio in corso...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{t.admin.sendReply}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
