import { Metadata } from 'next';
import { dict } from '@/lib/dictionary';
import { Pagination } from '@/components/Pagination';
import { Compass } from 'lucide-react';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Explore Live Music Events | OpenStage',
  description: 'Explore indie live gigs, concerts, and music venues worldwide.',
};

export default function ExplorePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{dict.nav.explore}</h1>
          <p className="text-sm text-slate-400">Discover all upcoming shows and gigs</p>
        </div>
      </div>

      <div className="rounded-2xl glass-panel p-12 text-center border border-white/10 mb-8">
        <p className="text-slate-400 text-sm">
          No published events found yet. Sign up to publish the first gig!
        </p>
      </div>

      {/* Pagination component demo/placeholder wrapped in Suspense */}
      <Suspense fallback={null}>
        <Pagination totalPages={1} currentPage={1} baseUrl="/explore" />
      </Suspense>
    </div>
  );
}
