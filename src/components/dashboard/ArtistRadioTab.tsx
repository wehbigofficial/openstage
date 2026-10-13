'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { RadioTrackItem } from '@/lib/services/radioService';
import {
  Radio,
  Music,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Lock,
  Sparkles,
  Upload,
  AlertCircle,
  Play,
  Loader2,
} from 'lucide-react';

interface ArtistRadioTabProps {
  artistId: string;
  isPro: boolean;
}

export function ArtistRadioTab({ artistId, isPro }: ArtistRadioTabProps) {
  const { t, locale } = useLanguage();
  const isIt = locale === 'it';

  const [tracks, setTracks] = useState<RadioTrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Upload modal state
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const loadTracks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/radio/tracks?artistId=${artistId}`);
      if (res.ok) {
        const json = await res.json();
        setTracks(json.tracks || []);
      }
    } catch (err) {
      console.error('Error loading tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [artistId]);

  const handleDelete = async (trackId: string) => {
    if (!confirm(isIt ? 'Eliminare definitivamente questo brano?' : 'Delete this track permanently?')) return;
    try {
      const res = await fetch('/api/radio/tracks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, artistId }),
      });
      if (res.ok) {
        setTracks((prev) => prev.filter((t) => t.id !== trackId));
      }
    } catch (err) {
      console.error('Error deleting track:', err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError(isIt ? 'Seleziona un file MP3' : 'Please select an MP3 file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(isIt ? 'Il file supera la dimensione massima di 10 MB' : 'File exceeds 10 MB limit');
      return;
    }

    if (!rightsConfirmed) {
      setUploadError(isIt ? 'Devi dichiarare la titolarità dei diritti di pubblicazione' : 'You must declare rights ownership');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      // 1. Get Presigned Upload URL for Cloudflare R2
      const presignRes = await fetch('/api/radio/presign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: artistId,
          fileName: file.name,
          contentType: file.type || 'audio/mpeg',
        }),
      });

      if (!presignRes.ok) {
        const errJson = await presignRes.json();
        throw new Error(errJson.error || 'Errore generazione presigned upload');
      }

      const { uploadUrl, publicUrl } = await presignRes.json();

      // 2. Upload MP3 directly to Cloudflare R2
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'audio/mpeg' },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error('Errore durante l\'invio del file audio su storage');
      }

      // 3. Register track record in database
      const saveRes = await fetch('/api/radio/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          title,
          audioUrl: publicUrl,
          fileSizeBytes: file.size,
          durationSeconds: 180, // Default estimated or extracted
          rightsConfirmed: true,
        }),
      });

      if (!saveRes.ok) {
        const errJson = await saveRes.json();
        throw new Error(errJson.error || 'Errore registrazione traccia');
      }

      setUploadSuccess(t.radio.uploadSuccess);
      setTitle('');
      setFile(null);
      setRightsConfirmed(false);
      loadTracks();

      setTimeout(() => {
        setUploadSuccess(null);
        setUploadModalOpen(false);
      }, 2500);
    } catch (err: any) {
      setUploadError(err.message || 'Errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-400" />
            <span>Rotazione OpenStage Radio 24/7</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fai ascoltare la tua musica a tutti i visitatori del sito in rotazione live sincronizzata.
          </p>
        </div>

        {isPro ? (
          <button
            onClick={() => setUploadModalOpen(true)}
            disabled={tracks.filter((t) => t.status !== 'rejected').length >= 3}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.radio.uploadButton}</span>
          </button>
        ) : (
          <Link
            href="/go-pro"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sblocca Radio con Pro</span>
          </Link>
        )}
      </div>

      {/* Free user locked banner */}
      {!isPro && (
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t.radio.proOnlyNotice}</h3>
              <p className="text-xs text-slate-300">
                Con Artist Pro (€3 una tantum) puoi caricare fino a 3 brani MP3 (max 10 MB) in rotazione continua con link diretto al tuo profilo e ai tuoi concerti.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/go-pro"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0070BA] text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all"
            >
              <span>Attiva Artist Pro con PayPal</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{t.radio.myTracksTitle}</span>
            <span className="text-xs text-slate-400 font-mono">
              ({tracks.filter((t) => t.status !== 'rejected').length}/3)
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            Storage Cloudflare R2 • Presigned Uploads
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
            <span className="text-xs">{t.common.loading}</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 space-y-4">
            <Music className="w-12 h-12 text-slate-500 mx-auto" />
            <h4 className="text-base font-bold text-white">Nessun brano caricato</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Carica le tue canzoni originali in formato MP3. Dopo una rapida revisione da parte del team, saranno trasmesse su OpenStage Radio.
            </p>
            {isPro && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Carica il tuo primo brano</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tracks.map((track) => {
              const isPending = track.status === 'pending';
              const isApproved = track.status === 'approved';
              const isRejected = track.status === 'rejected';

              return (
                <div
                  key={track.id}
                  className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <Music className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{track.title}</h4>
                        {isPending && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>In Revisione</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>In Rotazione</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Rifiutata</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        {track.plays_count || 0} ascolti radio • {track.likes_count || 0} mi piace
                      </p>

                      {isRejected && track.rejection_reason && (
                        <p className="text-xs text-rose-400 font-medium">
                          Motivo rifiuto: {track.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <audio controls src={track.audio_url} className="h-8 max-w-[200px]" />
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title={t.radio.deleteTrack}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Track Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 bg-[#0A0A14] text-white shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Radio className="w-4 h-4" />
                <span>{t.radio.uploadModalTitle}</span>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {uploadSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="text-sm font-bold">{uploadSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {uploadError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.radio.trackTitleLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Es. Notte di Luglio"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.radio.trackFileLabel} *
                  </label>
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500">
                    Solo file .mp3 fino a 10 MB. Caricato in Cloudflare R2 con upload diretto presigned.
                  </p>
                </div>

                {/* Required Rights Checkbox */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      required
                      checked={rightsConfirmed}
                      onChange={(e) => setRightsConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 text-cyan-400 focus:ring-cyan-400"
                    />
                    <span className="text-xs text-slate-300 leading-snug">
                      {t.radio.rightsDeclaration}
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{uploading ? t.radio.uploading : t.radio.uploadButton}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
