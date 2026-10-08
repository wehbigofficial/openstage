'use client';

import { useState } from 'react';
import { dict } from '@/lib/dictionary';
import { Mail, CheckCircle2 } from 'lucide-react';
import { TurnstileWidget } from '@/components/TurnstileWidget';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-white">Contact Us</h1>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Have questions or feedback? Drop us a note and we will get back to you.
        </p>

        {submitted ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3 text-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
            <span>Thank you! Your message has been sent.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {dict.common.name}
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {dict.common.email}
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Message
              </label>
              <textarea
                rows={4}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="How can we help?"
              />
            </div>

            <TurnstileWidget onSuccess={(token) => setTurnstileToken(token)} />

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm hover:opacity-95 transition-all shadow-md shadow-violet-600/20"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
