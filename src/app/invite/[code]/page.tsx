import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Sparkles, Mic2, ArrowRight, ShieldCheck, Radio } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const uppercaseCode = decodeURIComponent(code).trim().toUpperCase();

  // Store referral in cookies
  const cookieStore = await cookies();
  cookieStore.set('openstage_invite_code', uppercaseCode, {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  });

  // Lookup inviting artist
  let inviterName = 'Un collega musicista';
  let inviterGenre = '';
  try {
    const supabase = createAdminClient();
    const { data: artist } = await supabase
      .from('artists')
      .select(`
        genre,
        profiles:profile_id (
          display_name
        )
      `)
      .eq('invite_code', uppercaseCode)
      .maybeSingle();

    if (artist?.profiles && (artist.profiles as any).display_name) {
      inviterName = (artist.profiles as any).display_name;
    }
    if (artist?.genre) {
      inviterGenre = artist.genre;
    }
  } catch {}

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full p-8 sm:p-10 rounded-3xl glass-panel border border-white/10 space-y-8 text-center relative overflow-hidden shadow-2xl">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Invito Esclusivo per Musicisti</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {inviterName} ti ha invitato su OpenStage
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            La piattaforma libera e aperta per la musica dal vivo in Italia.
            Pubblica tutti i tuoi concerti gratis, raggiungi il pubblico locale e trasmetti i tuoi brani su OpenStage Radio.
          </p>
        </div>

        {/* Benefits cards */}
        <div className="grid grid-cols-1 gap-3 text-left relative z-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Eventi dal vivo illimitati e gratuiti</p>
              <p className="text-[11px] text-slate-400">Zero commissioni, nessun intermediario</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Rotazione su OpenStage Radio 24/7</p>
              <p className="text-[11px] text-slate-400">Fai scoprire la tua musica agli ascoltatori di tutta Italia</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-2 relative z-10">
          <Link
            href={`/auth/signup?ref=${uppercaseCode}&role=artist`}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-pink-600/20 transition-all active:scale-[0.98]"
          >
            <span>Registrati Gratis come Artista</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-[11px] text-slate-500">
            Codice di invito applicato: <span className="font-mono text-cyan-400 font-bold">{uppercaseCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
