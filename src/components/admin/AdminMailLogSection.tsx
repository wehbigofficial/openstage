'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AdminTablePagination } from './AdminTablePagination';
import {
  Mail,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export function AdminMailLogSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [logs, setLogs] = useState<any[]>([]);
  const [failuresLast24h, setFailuresLast24h] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters (default view: failed)
  const [statusFilter, setStatusFilter] = useState('failed');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Batch Drill-down state
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  // Resend Dialog & Progress State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [retryingInProgress, setRetryingInProgress] = useState(false);
  const [retryResultSummary, setRetryResultSummary] = useState<string | null>(null);

  const fetchMailLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/maillog?${params.toString()}`);
      const json = await res.json();
      setLogs(json.logs || []);
      setFailuresLast24h(json.failuresLast24h || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailLogs();
  }, [statusFilter, categoryFilter, searchQuery]);

  // Execute Try Resend Failed Mails
  const handleResendAllFailed = async () => {
    setShowConfirmModal(false);
    setRetryingInProgress(true);
    setRetryResultSummary(null);

    try {
      const res = await fetch('/api/admin/maillog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry-failed' }),
      });
      const json = await res.json();
      setRetryResultSummary(json.message || 'Tentativo di rinvio completato con successo.');
      fetchMailLogs();
    } catch (err: any) {
      setRetryResultSummary(err.message || 'Errore durante il tentativo di rinvio.');
    } finally {
      setRetryingInProgress(false);
    }
  };

  // Single Row Retry
  const handleRetrySingle = async (item: any) => {
    try {
      const targetId = item.queue_id || item.id;
      const res = await fetch('/api/admin/maillog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry-failed',
          ids: [targetId],
        }),
      });
      const json = await res.json();
      alert(json.message);
      fetchMailLogs();
    } catch (err: any) {
      alert(err.message || 'Errore rinvio');
    }
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const paginatedLogs = logs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP BANNER: 24h FAILURES & TRY RESEND BUTTON */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              failuresLast24h > 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {failuresLast24h > 0 ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white">{failuresLast24h}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                {t.admin.failuresLast24h}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isIt
                ? 'Monitoraggio continuo errori Resend, bounce e rate limiting'
                : 'Continuous monitoring of Resend errors, bounces, and rate limiting'}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={retryingInProgress}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {retryingInProgress ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.admin.retryingProgress}</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{t.admin.resendFailedButton}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary notice if resend recently completed */}
      {retryResultSummary && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{retryResultSummary}</span>
          </div>
          <button onClick={() => setRetryResultSummary(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. TABLE AND FILTERS */}
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl space-y-4">
        {/* Filters Bar */}
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
              placeholder={isIt ? 'Cerca per destinatario, template o errore...' : 'Search recipient, template or error...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status tabs - Default view: failed */}
            <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              {[
                { id: 'failed', label: t.admin.mailStatusFailed },
                { id: 'sent', label: t.admin.mailStatusSent },
                { id: 'delivered', label: t.admin.mailStatusDelivered },
                { id: 'bounced', label: t.admin.mailStatusBounced },
                { id: 'all', label: t.admin.all },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(item.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    statusFilter === item.id
                      ? item.id === 'failed'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 capitalize"
            >
              <option value="all" className="bg-slate-900">Categoria: {t.admin.all}</option>
              <option value="transactional" className="bg-slate-900">Transactional</option>
              <option value="reminder" className="bg-slate-900">Reminder</option>
              <option value="digest" className="bg-slate-900">Digest</option>
              <option value="marketing" className="bg-slate-900">Marketing</option>
              <option value="admin" className="bg-slate-900">Admin</option>
            </select>
          </div>
        </div>

        {/* Mail Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/5 border-b border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t.admin.status}</th>
                <th className="py-3 px-4 font-semibold">{isIt ? 'Destinatario / Batch' : 'Recipient / Batch'}</th>
                <th className="py-3 px-4 font-semibold">Template</th>
                <th className="py-3 px-4 font-semibold">{isIt ? 'Motivo Errore' : 'Failure Reason'}</th>
                <th className="py-3 px-4 font-semibold">{isIt ? 'Data' : 'Date'}</th>
                <th className="py-3 px-4 font-semibold text-right">{isIt ? 'Azioni' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedLogs.map((log) => {
                const isExpanded = expandedBatchId === log.batch_id;

                if (log.isBatchGroup) {
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="bg-white/[0.02] hover:bg-white/5 transition-colors font-medium">
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.failedCount > 0
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {log.failedCount > 0 ? `BATCH (${log.failedCount} ERR)` : 'BATCH (OK)'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                            <div>
                              <span className="font-bold text-sm block">
                                {log.batch_id}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {log.totalCount} {t.admin.batchItemsCount} ({log.sentCount} ok, {log.failedCount} fallite)
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                          {log.template} ({log.category})
                        </td>
                        <td className="py-3.5 px-4 text-rose-300 font-mono text-[11px]">
                          {log.error_reason || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBatchId(isExpanded ? null : log.batch_id)
                            }
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-semibold border border-white/10 inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>{t.admin.drilldown}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Drill-down rows for batch */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-black/40 border-y border-cyan-500/20">
                            <div className="p-4 space-y-2">
                              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                                {t.admin.drilldown}: {log.batch_id}
                              </span>
                              <div className="space-y-1.5">
                                {log.recipients.map((rec: any, idx: number) => (
                                  <div
                                    key={rec.id || idx}
                                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          rec.status === 'failed' ? 'bg-rose-400' : 'bg-emerald-400'
                                        }`}
                                      />
                                      <span className="font-mono text-white">{rec.to_email}</span>
                                      {rec.error_reason && (
                                        <span className="text-[10px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                                          {rec.error_reason}
                                        </span>
                                      )}
                                    </div>

                                    {rec.status === 'failed' && (
                                      <button
                                        type="button"
                                        onClick={() => handleRetrySingle(rec)}
                                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/30 transition-colors"
                                      >
                                        {t.admin.retrySingle}
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }

                // Standard Single Log Row
                return (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : log.status === 'sent' || log.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white">
                      <div>{log.to_email}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{log.subject}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {log.template}
                    </td>
                    <td className="py-3.5 px-4 text-rose-300 font-mono text-[11px] max-w-xs truncate">
                      {log.error_reason || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {log.status === 'failed' ? (
                        <button
                          type="button"
                          onClick={() => handleRetrySingle(log)}
                          className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{t.admin.retrySingle}</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination */}
        <AdminTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={logs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* CONFIRM TRY RESEND DIALOG */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-rose-500/30 p-6 sm:p-8 space-y-5 text-white shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                {t.admin.confirmResend}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t.admin.confirmResendDesc}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleResendAllFailed}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
              >
                {isIt ? 'Conferma e Riprova' : 'Confirm and Retry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
