import Link from 'next/link';
import { dict } from '@/lib/dictionary';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#07070D]/90 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            {dict.common.brandName}
          </span>
          <p className="text-xs text-slate-400">{dict.common.tagline}</p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
          <Link href="/about" className="hover:text-cyan-400 transition-colors">
            {dict.footer.about}
          </Link>
          <Link href="/contact" className="hover:text-cyan-400 transition-colors">
            {dict.footer.contact}
          </Link>
          <Link href="/privacy" className="hover:text-violet-400 transition-colors">
            {dict.footer.privacy}
          </Link>
          <Link href="/terms" className="hover:text-violet-400 transition-colors">
            {dict.footer.terms}
          </Link>
          <Link href="/cookies" className="hover:text-violet-400 transition-colors">
            {dict.footer.cookies}
          </Link>
        </div>

        {/* Social placeholders & Copyright & Language */}
        <div className="flex flex-col items-center md:items-end gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-cyan-400 cursor-pointer transition-colors">Instagram</span>
            <span className="hover:text-violet-400 cursor-pointer transition-colors">X</span>
            <span className="hover:text-pink-400 cursor-pointer transition-colors">YouTube</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span>{dict.footer.copyright}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
