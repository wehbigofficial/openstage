[# OpenStage - project rules (read this file at the start of every task)

Product: OpenStage, a worldwide platform to discover live music events, focused on independent artists. Free for artists and fans. All UI text in English, with strings kept in a dictionary file so more languages can be added later.

Stack: Next.js (App Router, TypeScript) with server-side rendering for every public page; Supabase (Auth, Postgres with Row Level Security on every table); Tailwind CSS; Framer Motion; MapLibre GL JS with MapTiler tiles (MAPTILER_KEY, never the public OpenStreetMap tile servers); Resend for email; Cloudflare R2 for audio; Cloudflare Turnstile; PayPal for payments; deploy on Netlify or Vercel. Never a client-only SPA: SEO and social link previews must work.

Design: dark cyber-neon with glassmorphism. Background #07070D, glass panels (backdrop-blur, 1px translucent border), accents violet #8B5CF6, cyan #22D3EE, pink #F472B6. Fonts: Space Grotesk for headings, Inter for body. Bento grids, parallax hero, scroll-reveal for sections and text, hover cards with 3D tilt and neon glow, animated counters. Glass only for navbar, cards and popups, never behind long text. High contrast. Respect prefers-reduced-motion and use lighter animations on mobile. Mobile first.

Conventions: one reusable numbered Pagination component (prev 1 2 3 ... 8 next, 12 items per page, page kept in the URL) on every long list. Secrets only in env vars (.env.local, never committed); keep .env.example updated. Database changes as numbered SQL files in supabase/migrations, always with RQL; tell the user exactly how to apply them (Supabase SQL Editor). Prices and limits are read from the settings table, never hardcoded. The fixed radio bar at the bottom of every page (added later) must sit above any mobile bottom navigation.

Working rules (save tokens): write a short plan in docs/plan-phase-N.md before coding; edit only the files that need changing; do not re-read the whole repo; no extra refactors and no polish pass unless asked; at the end run the build and fix errors, make a Git commit named Phase N, and reply with a 5-line summary: what to test, which env vars to set, which SQL to run.]
