'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { AudioWaveform, Play, Pause, CheckCircle2, XCircle, Trash2, Loader2, Music, Clock, Check } from 'lucide-react';

interface RadioTrack {
  id: string;
  artist_id: string;
  artist_name: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  status: 'pending' | 'approved' | 'rejected' | 'taken_down';
  rights_confirmed: boolean;
  rejection_reason?: string | null;
  plays_count: number;
  likes_count: number;
  created_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  profiles?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    city: string | null;
  } | null;
}

interface RadioReport {
  id: string;
  track_id: string;
  reporter_ip: string | null;
  reporter_email: string | null;
  reason: string;
  details: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  track?: {
    id: string;
    title: string;
    artist_name: string;
    audio_url: string;
  } | null;
}

type TabType = 'pending' | 'approved' | 'rejected' | 'taken_down' | 'reports';

function ReportsTable({ reports, handleAction, actionLoading, t, isIt }: {
  reports: RadioReport[];
  handleAction: (trackId: string, action: 'approve' | 'reject' | 'takedown', reason?: string) => void;
  actionLoading: string | null;
  t: any;
  isIt: boolean;
}) {
  return (
    <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-left font-bold text-slate-300 uppercase tracking-wider text-[11px]">Brano</th>
              <th className="p-4 text-left font-bold text-slate-300 uppercase tracking-wider text-[11px]">Segnalatore</th>
              <th className="p-4 text-left font-bold text-slate-300 uppercase tracking-wider text-[11px]">Motivo</th>
              <th className="p-4 text-left font-bold text-slate-300 uppercase tracking-wider text-[11px]">Data</th>
              <th className="p-4 text-left font-bold text-slate-300 uppercase tracking-wider text-[11px]">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reports.filter(r => r.status === 'open').map((report) => (
              <tr key={report.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-white">{report.track?.title || 'Brano rimosso'}</div>
                  <div className="text-xs text-slate-400">{report.track?.artist_name || '—'}</div>
                </td>
                <td className="p-4 text-xs text-slate-300">
                  {report.reporter_email || report.reporter_ip || 'Anonimo'}
                </td>
                <td className="p-4">
                  <div className="text-xs text-slate-300 font-medium">{report.reason}</div>
                  {report.details && (
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{report.details}</div>
                  )}
                </td>
                <td className="p-4 text-[11px] text-slate-500">
                  {new Date(report.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(report.track_id, 'takedown', 'Auto-takedown per 3+ segnalazioni')}
                      disabled={actionLoading === report.track_id}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Rimuovi Brano</span>
                    </button>
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/radio-reports', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ reportId: report.id, action: 'dismiss' }),
                        });
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-xs font-bold transition-colors"
                    >
                      Archivia
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.filter(r => r.status === 'open').length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                  {t.admin.noReportsOpen}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TracksGrid({ tracks, activeTab, handlePlay, handleAction, actionLoading, playingTrack, getStatusBadge, formatDuration, t, isIt, tabs }: {
  tracks: RadioTrack[];
  activeTab: TabType;
  handlePlay: (track: RadioTrack) => void;
  handleAction: (trackId: string, action: 'approve' | 'reject' | 'takedown', reason?: string) => void;
  actionLoading: string | null;
  playingTrack: string | null;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDuration: (seconds: number) => string;
  t: any;
  isIt: boolean;
  tabs: { id: TabType; label: string; count: number }[];
}) {
  const filteredTracks = tracks.filter(t => t.status === activeTab);
  
  if (filteredTracks.length === 0) {
    const emptyMessages: Record<TabType, string> = {
      pending: t.admin.noTracksPending,
      approved: t.admin.noTracksApproved,
      rejected: t.admin.noTracksRejected,
      taken_down: t.admin.noTracksTakenDown,
      reports: t.admin.noReportsOpen,
    };
    return (
      <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 space-y-4">
        <AudioWaveform className="w-12 h-12 text-slate-500 mx-auto" />
        <h4 className="text-base font-bold text-white">
          {activeTab === 'pending' ? (isIt ? 'Nessun brano in attesa' : 'No pending tracks') : tabs.find(t => t.id === activeTab)?.label.toLowerCase()}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {activeTab === 'pending'
            ? (isIt ? 'Quando un artista Pro carica un brano, apparirà qui per la revisione.' : 'When a Pro artist uploads a track, it will appear here for review.')
            : (isIt ? 'I brani con questo stato appariranno qui.' : 'Tracks with this status will appear here.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {filteredTracks.map((track) => (
          <div
            key={track.id}
            className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Music className="w-6 h-6" />
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                  {getStatusBadge(track.status)}
                  {track.rights_confirmed && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{t.admin.rightsConfirmed}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  {track.artist_name} • {formatDuration(track.duration_seconds)} • {track.plays_count} ascolti • {track.likes_count} mi piace
                </p>

                <p className="text-[11px] text-slate-500">
                  Caricato: {new Date(track.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {track.profiles?.city && ` • ${track.profiles.city}`}
                </p>

                {track.rejection_reason && (
                  <p className="text-xs text-rose-400 font-medium">
                    {t.admin.rejectionReason}: {track.rejection_reason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => handlePlay(track)}
                disabled={actionLoading === track.id}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                title={playingTrack === track.id ? (isIt ? 'Pausa' : 'Pause') : (isIt ? 'Ascolta' : 'Listen')}
              >
                {playingTrack === track.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {track.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      const reason = prompt(isIt ? 'Motivo del rifiuto (obbligatorio):' : 'Rejection reason (required):');
                      if (reason) handleAction(track.id, 'reject', reason);
                    }}
                    disabled={actionLoading === track.id}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t.admin.rejectTrack}</span>
                  </button>
                  <button
                    onClick={() => handleAction(track.id, 'approve')}
                    disabled={actionLoading === track.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t.admin.approveTrack}</span>
                  </button>
                </>
              )}

              {track.status === 'approved' && (
                <button
                  onClick={() => handleAction(track.id, 'takedown', 'Rimosso manualmente dall\'amministratore')}
                  disabled={actionLoading === track.id}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.admin.takedownTrack}</span>
                </button>
              )}

              {actionLoading === track.id && (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminRadioSection() {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [reports, setReports] = useState<RadioReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/radio');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Errore recupero dati radio');

      setTracks(data.pending || []);
      setReports(data.reports || []);
      // Also merge other track statuses
      const allTracks = [
        ...(data.pending || []),
        ...(data.approved || []),
        ...(data.rejected || []),
        ...(data.takenDown || []),
      ];
      setTracks(allTracks);
    } catch (err) {
      console.error('Error fetching radio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (trackId: string, action: 'approve' | 'reject' | 'takedown', reason?: string) => {
    if (action === 'reject' && !reason) return;

    try {
      setActionLoading(trackId);
      const res = await fetch('/api/admin/radio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, trackId, reason: reason || '' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Errore durante l\'azione');
      }

      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Errore');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlay = (track: RadioTrack) => {
    if (playingTrack === track.id) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      audioRef.current?.pause();
      const audio = new Audio(track.audio_url);
      audioRef.current = audio;
      audio.play().catch(() => {});
      setPlayingTrack(track.id);
      audio.onended = () => setPlayingTrack(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      rejected: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      taken_down: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    };
    const labels: Record<string, string> = {
      pending: 'In Attesa',
      approved: 'Approvato',
      rejected: 'Rifiutato',
      taken_down: 'Rimosso',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'pending', label: 'In Attesa', count: tracks.filter(t => t.status === 'pending').length },
    { id: 'approved', label: 'Approvati', count: tracks.filter(t => t.status === 'approved').length },
    { id: 'rejected', label: 'Rifiutati', count: tracks.filter(t => t.status === 'rejected').length },
    { id: 'taken_down', label: 'Rimossi', count: tracks.filter(t => t.status === 'taken_down').length },
    { id: 'reports', label: 'Segnalazioni', count: reports.filter(r => r.status === 'open').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Music className="w-6 h-6 text-cyan-400" />
            <span>{t.admin.radioTracks}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isIt
              ? 'Gestisci i brani caricati dagli artisti Pro per la rotazione Radio 24/7'
              : 'Manage tracks uploaded by Pro artists for 24/7 Radio rotation'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === tab.id ? 'bg-cyan-500 text-black' : 'bg-white/10 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          <span className="text-xs">{t.common.loading}</span>
        </div>
      ) : activeTab === 'reports' ? (
        <ReportsTable
          reports={reports}
          handleAction={handleAction}
          actionLoading={actionLoading}
          t={t}
          isIt={isIt}
        />
      ) : (
        <TracksGrid
          tracks={tracks}
          activeTab={activeTab}
          handlePlay={handlePlay}
          handleAction={handleAction}
          actionLoading={actionLoading}
          playingTrack={playingTrack}
          getStatusBadge={getStatusBadge}
          formatDuration={formatDuration}
          t={t}
          isIt={isIt}
          tabs={tabs}
        />
      )}
    </div>
  );
}