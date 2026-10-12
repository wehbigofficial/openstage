'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AdminTablePagination } from './AdminTablePagination';
import {
  Calendar,
  Search,
  Filter,
  Check,
  EyeOff,
  Star,
  Edit,
  Trash2,
  Flag,
  AlertTriangle,
  Loader2,
  X,
  MapPin,
  Clock,
} from 'lucide-react';

export function AdminEventsSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [activeSubTab, setActiveSubTab] = useState<'events' | 'reports'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [eventsPage, setEventsPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const itemsPerPage = 8;

  // Edit Modal State
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Confirmation Modal
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (cityFilter !== 'all') params.set('city', cityFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/events?${params.toString()}`);
      const json = await res.json();
      setEvents(json.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/events?view=reports');
      const json = await res.json();
      setReports(json.reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [statusFilter, cityFilter, searchQuery]);

  useEffect(() => {
    fetchReports();
  }, []);

  // Action handlers
  const handleApprove = async (eventId: string) => {
    try {
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', eventId }),
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleHide = async (eventId: string) => {
    try {
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hide', eventId }),
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFeatured = async (eventId: string, currentFeatured: boolean) => {
    try {
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-featured',
          eventId,
          data: { is_featured: !currentFeatured },
        }),
      });
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingEventId) return;
    try {
      await fetch(`/api/admin/events?id=${deletingEventId}`, { method: 'DELETE' });
      setDeletingEventId(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setActionLoading(true);
    try {
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          eventId: editingEvent.id,
          data: editFormData,
        }),
      });
      setEditingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve-report', reportId }),
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss-report', reportId }),
      });
      fetchReports();
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination slices
  const totalEventsPages = Math.ceil(events.length / itemsPerPage) || 1;
  const paginatedEvents = events.slice(
    (eventsPage - 1) * itemsPerPage,
    eventsPage * itemsPerPage
  );

  const totalReportsPages = Math.ceil(reports.length / itemsPerPage) || 1;
  const paginatedReports = reports.slice(
    (reportsPage - 1) * itemsPerPage,
    reportsPage * itemsPerPage
  );

  const openReportsCount = reports.filter((r) => r.status === 'open').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub tabs: Events vs Reports */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'events'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{isIt ? 'Tutti gli Eventi' : 'All Events'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/40 font-mono">
            {events.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'reports'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-black'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>{t.admin.reportsQueue}</span>
          {openReportsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-mono animate-pulse">
              {openReportsCount}
            </span>
          )}
        </button>
      </div>

      {/* 1. EVENTS TABLE VIEW */}
      {activeSubTab === 'events' && (
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
                  setEventsPage(1);
                }}
                placeholder={t.admin.searchEventsPlaceholder}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setEventsPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-900">{t.admin.filterStatus}: {t.admin.all}</option>
                <option value="published" className="bg-slate-900">{t.admin.published}</option>
                <option value="draft" className="bg-slate-900">{t.admin.draft}</option>
                <option value="hidden" className="bg-slate-900">{t.admin.hidden}</option>
                <option value="cancelled" className="bg-slate-900">{t.admin.cancelled}</option>
              </select>

              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setEventsPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="all" className="bg-slate-900">{t.common.city}: {t.admin.all}</option>
                <option value="Roma" className="bg-slate-900">Roma</option>
                <option value="Milano" className="bg-slate-900">Milano</option>
                <option value="Bologna" className="bg-slate-900">Bologna</option>
                <option value="Napoli" className="bg-slate-900">Napoli</option>
                <option value="Torino" className="bg-slate-900">Torino</option>
                <option value="Firenze" className="bg-slate-900">Firenze</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/5 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">{t.admin.events}</th>
                  <th className="py-3 px-4 font-semibold">{t.common.city}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t.admin.status}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t.admin.featured}</th>
                  <th className="py-3 px-4 font-semibold text-center">{isIt ? 'Segnalazioni' : 'Reports'}</th>
                  <th className="py-3 px-4 font-semibold text-right">{isIt ? 'Azioni' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedEvents.map((evt) => {
                  const isAutoHidden = evt.openReportsCount >= 3 || evt.isAutoHidden;

                  return (
                    <tr key={evt.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm truncate">{evt.title}</span>
                          <span className="text-[11px] text-slate-400">
                            {evt.artist_name || evt.venue_name || 'OpenStage'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          {evt.city || 'Roma'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            evt.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : evt.status === 'hidden'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(evt.id, evt.is_featured)}
                          title={evt.is_featured ? t.admin.removeFeatured : t.admin.setFeatured}
                          className={`p-1.5 rounded-lg border transition-all ${
                            evt.is_featured
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" fill={evt.is_featured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isAutoHidden ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[10px] animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            {evt.openReportsCount} (3+ Auto-Hide)
                          </span>
                        ) : evt.openReportsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
                            {evt.openReportsCount}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {evt.status !== 'published' ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(evt.id)}
                              title={t.admin.approve}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleHide(evt.id)}
                              title={t.admin.hide}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setEditingEvent(evt);
                              setEditFormData(evt);
                            }}
                            title={t.admin.edit}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingEventId(evt.id)}
                            title={t.admin.delete}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Numbered Pagination */}
          <AdminTablePagination
            currentPage={eventsPage}
            totalPages={totalEventsPages}
            totalItems={events.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setEventsPage(page)}
          />
        </div>
      )}

      {/* 2. REPORTS QUEUE VIEW */}
      {activeSubTab === 'reports' && (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl space-y-4">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                {t.admin.reportsQueue}
              </h3>
              <p className="text-xs text-slate-400">
                Regola di moderazione automatica: un evento con 3 o più segnalazioni aperte viene oscurato automaticamente e posto sotto revisione.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {openReportsCount} {t.admin.openReportsCount}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/5 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">{t.admin.events}</th>
                  <th className="py-3 px-4 font-semibold">{t.admin.reason}</th>
                  <th className="py-3 px-4 font-semibold">{t.admin.details}</th>
                  <th className="py-3 px-4 font-semibold">{t.admin.reporter}</th>
                  <th className="py-3 px-4 font-semibold text-center">{t.admin.status}</th>
                  <th className="py-3 px-4 font-semibold text-right">{isIt ? 'Azioni' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                      <span className="font-bold text-sm block truncate">
                        {rep.events?.title || 'Concerto ID: ' + rep.event_id}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {rep.events?.city || 'Italia'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-300">
                      {rep.reason}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {rep.details || 'Nessun dettaglio aggiuntivo'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <div>{rep.reporter_email || 'Anonimo'}</div>
                      <div className="text-[10px] text-slate-500">{rep.reporter_ip || 'IP N/D'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rep.status === 'open'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rep.status === 'open' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResolveReport(rep.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition-colors"
                            >
                              {t.admin.resolveReport}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDismissReport(rep.id)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-semibold border border-white/10 transition-colors"
                            >
                              {t.admin.dismissReport}
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Archiviata</span>
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
            currentPage={reportsPage}
            totalPages={totalReportsPages}
            totalItems={reports.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setReportsPage(page)}
          />
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-5 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingEvent(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Edit className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Modifica Evento: {editingEvent.title}</h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Titolo</label>
                <input
                  type="text"
                  required
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Artista</label>
                  <input
                    type="text"
                    value={editFormData.artist_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, artist_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Locale</label>
                  <input
                    type="text"
                    value={editFormData.venue_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, venue_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Città</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stato</label>
                  <select
                    value={editFormData.status || 'published'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="published">published</option>
                    <option value="draft">draft</option>
                    <option value="hidden">hidden</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrizione</label>
                <textarea
                  rows={3}
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 font-bold text-xs text-white shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-panel rounded-3xl border border-rose-500/30 p-6 space-y-4 text-white text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">Conferma eliminazione evento</h3>
            <p className="text-xs text-slate-300">
              Questa azione eliminerà definitivamente l evento dalla piattaforma e non può essere annullata.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEventId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30"
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
