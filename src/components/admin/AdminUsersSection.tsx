'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AdminTablePagination } from './AdminTablePagination';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Eye,
  X,
  UserCheck,
  UserX,
  MapPin,
  Mail,
  Calendar,
  Sparkles,
} from 'lucide-react';

export function AdminUsersSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [viewingUser, setViewingUser] = useState<any | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<any | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, searchQuery]);

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend',
          userId: suspendingUser.id,
          reason: suspensionReason.trim() || 'Violazione delle regole di community',
        }),
      });
      setSuspendingUser(null);
      setSuspensionReason('');
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsuspend', userId }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;
    try {
      await fetch(`/api/admin/users?id=${deletingUserId}`, { method: 'DELETE' });
      setDeletingUserId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(users.length / itemsPerPage) || 1;
  const paginatedUsers = users.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl space-y-4">
        {/* Filter and Search Bar */}
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
              placeholder={t.admin.searchUsers}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Role Filter Tabs */}
            <div className="flex items-center rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
              {['all', 'artist', 'venue', 'fan'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRoleFilter(r);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all capitalize ${
                    roleFilter === r
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'all'
                    ? t.admin.all
                    : r === 'artist'
                    ? t.admin.artists
                    : r === 'venue'
                    ? t.admin.venues
                    : t.admin.fans}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all" className="bg-slate-900">{t.admin.status}: {t.admin.all}</option>
              <option value="active" className="bg-slate-900">{t.admin.activeBadge}</option>
              <option value="suspended" className="bg-slate-900">{t.admin.suspendedBadge}</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-white/5 border-b border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t.common.name}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.role}</th>
                <th className="py-3 px-4 font-semibold">{t.common.city}</th>
                <th className="py-3 px-4 font-semibold text-center">{t.admin.status}</th>
                <th className="py-3 px-4 font-semibold text-right">{isIt ? 'Azioni' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm truncate">{user.display_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">{user.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'artist'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : user.role === 'venue'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {user.city || 'Italia'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {user.is_suspended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[10px]">
                        <UserX className="w-3 h-3" />
                        {t.admin.suspendedBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                        <UserCheck className="w-3 h-3" />
                        {t.admin.activeBadge}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingUser(user)}
                        title={t.common.viewDetails}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {user.is_suspended ? (
                        <button
                          type="button"
                          onClick={() => handleUnsuspend(user.id)}
                          title={t.admin.unsuspend}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSuspendingUser(user)}
                          title={t.admin.suspend}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingUserId(user.id)}
                        title={t.admin.deleteUser}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          totalItems={users.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* VIEW USER DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-white/15 p-6 sm:p-8 space-y-5 text-white shadow-2xl relative">
            <button
              onClick={() => setViewingUser(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{viewingUser.display_name}</h3>
                <span className="text-xs uppercase font-mono tracking-wider text-cyan-400">
                  {viewingUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Email</span>
                <p className="font-mono text-white text-sm">{viewingUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Città</span>
                  <p className="text-white">{viewingUser.city || 'N/D'}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stato</span>
                  <p className={viewingUser.is_suspended ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {viewingUser.is_suspended ? 'Sospeso' : 'Attivo'}
                  </p>
                </div>
              </div>

              {viewingUser.artists && (
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 space-y-1">
                  <span className="text-[10px] text-pink-300 uppercase tracking-wider font-semibold">Dettagli Artista</span>
                  <p className="text-slate-200">Genere: {viewingUser.artists.genre || 'Indie'}</p>
                  <p className="text-slate-200">Pro: {viewingUser.artists.is_pro ? 'Sì' : 'No'}</p>
                </div>
              )}

              {viewingUser.venues && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                  <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold">Dettagli Locale</span>
                  <p className="text-slate-200">Verificato: {viewingUser.venues.is_verified ? 'Sì (Badge attivo)' : 'Non verificato'}</p>
                </div>
              )}

              {viewingUser.suspension_reason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <span className="font-bold block text-[10px] uppercase">Motivo sospensione:</span>
                  <p>{viewingUser.suspension_reason}</p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND REASON MODAL */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-amber-500/30 p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold">Sospendi {suspendingUser.display_name}</h3>
            </div>

            <form onSubmit={handleSuspend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivo della sospensione
                </label>
                <textarea
                  rows={3}
                  required
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Es. Spam, violazione termini d'uso..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSuspendingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md"
                >
                  Conferma Sospensione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRM MODAL */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-panel rounded-3xl border border-rose-500/30 p-6 space-y-4 text-white text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold">{t.admin.deleteUser}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.admin.deleteUserConfirm}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30"
              >
                Elimina Profilo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
