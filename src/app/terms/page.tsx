import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | OpenStage',
  description: 'Terms and conditions for using the OpenStage platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            By accessing or using OpenStage, you agree to comply with and be bound by these Terms of Service.
          </p>
          <h2 className="text-lg font-semibold text-violet-400 mt-6 mb-2">1. Artist & Venue Responsibilities</h2>
          <p>
            You agree to post accurate event data. Misleading listings, spam, or events violating copyright or local regulations will be removed.
          </p>
          <h2 className="text-lg font-semibold text-violet-400 mt-6 mb-2">2. Email Verification</h2>
          <p>
            To prevent spam and maintain high platform quality, artists and organizers must confirm their email address before events are published to the public directory.
          </p>
        </div>
      </div>
    </div>
  );
}
