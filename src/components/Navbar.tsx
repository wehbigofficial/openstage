import Link from 'next/link';
import { dict } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/server';
import { UserNav } from '@/components/UserNav';
import { RadioBarPlaceholder } from '@/components/RadioBarPlaceholder';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#07070D]/80 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-pink-500 to-cyan-400 p-[2px]">
              <div className="w-full h-full bg-[#07070D] rounded-[6px] flex items-center justify-center">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-lg">
                  O
                </span>
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              {dict.common.brandName}
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/explore"
              className="text-slate-300 hover:text-cyan-400 transition-colors"
            >
              {dict.nav.explore}
            </Link>
            <Link
              href="/for-artists"
              className="text-slate-300 hover:text-pink-400 transition-colors"
            >
              {dict.nav.forArtists}
            </Link>
            <Link
              href="/for-venues"
              className="text-slate-300 hover:text-violet-400 transition-colors"
            >
              {dict.nav.forVenues}
            </Link>
          </nav>
        </div>

        {/* Right side Auth / User action */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
