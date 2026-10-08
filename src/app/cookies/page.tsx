import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | OpenStage',
  description: 'Details on cookies and local storage used on OpenStage.',
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-6">Cookie Policy</h1>
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            OpenStage uses essential cookies and local storage tokens strictly necessary to maintain authentication sessions and verify security tokens (e.g. Cloudflare Turnstile).
          </p>
          <p>
            We do not use invasive tracking or third-party advertising cookies.
          </p>
        </div>
      </div>
    </div>
  );
}
