import { Metadata } from 'next';
import { dict } from '@/lib/dictionary';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About OpenStage | Worldwide Independent Live Music Discovery',
  description: 'Learn about OpenStage mission to empower independent artists and music venues.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white">About OpenStage</h1>
        </div>
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            OpenStage was born to revive the visceral spirit of live music. While big ticketing corporations charge massive fees and algorithms push only mainstream superstars, thousands of exceptional independent artists perform every night in small clubs, basements, and open spaces without visibility.
          </p>
          <p>
            OpenStage gives every indie artist and grassroots venue an open, worldwide stage. Completely free for artists and fans, built on open principles, dark cyber-neon aesthetics, and powered by the global music community.
          </p>
        </div>
      </div>
    </div>
  );
}
