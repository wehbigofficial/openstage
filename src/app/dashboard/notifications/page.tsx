'use client';

import React from 'react';
import { Bell, Info } from 'lucide-react';

export default function DashboardNotificationsPage() {
  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Notifiche & Avvisi
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ricevi aggiornamenti sui tuoi concerti, modifiche di orari e nuovi follower.
        </p>
      </div>

      <div className="p-8 rounded-3xl glass-panel border border-white/10 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
          <Bell className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Nessuna nuova notifica</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Quando qualcuno salverà il tuo evento o se ci saranno cambi di orario, troverai gli avvisi qui.
        </p>
      </div>
    </div>
  );
}
