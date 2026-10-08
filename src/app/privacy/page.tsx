import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | OpenStage',
  description: 'OpenStage Privacy Policy and data protection overview.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            Welcome to OpenStage. We value your privacy and are committed to protecting your personal data.
          </p>
          <h2 className="text-lg font-semibold text-cyan-400 mt-6 mb-2">1. Information We Collect</h2>
          <p>
            When you register, we collect your email address, chosen role (Artist, Venue, Fan), and profile information (display name, city, and genre). For artists and venues, we collect information regarding events and performance schedules.
          </p>
          <h2 className="text-lg font-semibold text-cyan-400 mt-6 mb-2">2. How We Use Information</h2>
          <p>
            Your information is used strictly to provide live music discovery services, verify event details, and notify fans of upcoming shows. We do not sell your personal data.
          </p>
          <h2 className="text-lg font-semibold text-cyan-400 mt-6 mb-2">3. Account Deletion</h2>
          <p>
            You may permanently delete your account and all associated events at any time from your Account Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
