'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Mail, MapPin, Music, ShieldCheck } from 'lucide-react';

export default function DashboardProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data || { display_name: user.email?.split('@')[0], city: 'Global', role: 'artist' });
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Caricamento profilo...</div>;
  }

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Il tuo Profilo
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Informazioni visibili agli utenti e organizzatori di eventi.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white text-2xl font-black">
            {profile?.display_name?.charAt(0).toUpperCase() || 'O'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.display_name || 'Artista'}</h2>
            <p className="text-xs text-cyan-400 font-semibold uppercase">{profile?.role || 'Artist'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-pink-400" /> Email
            </span>
            <p className="text-white font-semibold">{user?.email || 'N/A'}</p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Città Principale
            </span>
            <p className="text-white font-semibold">{profile?.city || 'Roma, Italia'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
