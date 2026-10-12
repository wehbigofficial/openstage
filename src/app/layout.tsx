import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RadioBarPlaceholder } from '@/components/RadioBarPlaceholder';
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenStage | Worldwide Independent Live Music Discovery',
  description:
    'Discover underground and independent live music events, secret gigs, and indie talents in your city. Free for artists and fans.',
  openGraph: {
    title: 'OpenStage | Worldwide Independent Live Music Discovery',
    description: 'Find gigs, secret concerts, and independent music events globally.',
    type: 'website',
  },
};

import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="flex flex-col min-h-screen bg-[#07070D] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <LanguageProvider>
          <Suspense fallback={<div className="h-16 w-full border-b border-white/10 bg-[#07070D]/80" />}>
            <Navbar />
          </Suspense>
          {/* Main content with padding at bottom to leave clear space for the fixed radio bar */}
          <main className="flex-1 pb-16">{children}</main>
          <Footer />
          <RadioBarPlaceholder />
        </LanguageProvider>
      </body>
    </html>
  );
}
