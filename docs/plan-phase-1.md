# Plan Phase 1 - Foundation, Style, and Account

## Scope & Requirements
- **Design System & Layout**:
  - Dark cyber-neon theme (#07070D background, glass panels backdrop-blur, borders, accents violet #8B5CF6, cyan #22D3EE, pink #F472B6).
  - Fonts: Space Grotesk (headings) and Inter (body).
  - Glass Navbar: Logo OpenStage, Explore, For artists, For venues, Log in / Sign up (or user avatar/menu when logged in).
  - Footer: About, Contact, Privacy, Terms, Cookies, social placeholders.
  - Placeholder pages: Privacy, Terms, Cookies, Contact, Explore, For Artists, For Venues.
  - Reusable URL-based Pagination component (12 items/page, prev 1 2 3 ... N next).
  - Reserve space for the radio bar at the bottom (fixed bar space, above mobile nav).
  - Empty-state home page.
- **Auth & Roles with Supabase SSR**:
  - Roles: `artist`, `venue`, `fan`. Chosen at sign-up with 3 large interactive cards.
  - Terms & Privacy required checkbox at sign-up.
  - Email + Password and Google OAuth (ready, graceful fallback if credentials missing).
  - Password Reset flow (forgot password + update password).
  - Delete my account in settings (handled via server route `api/account/delete` with `SUPABASE_SERVICE_ROLE_KEY`).
  - Artist onboarding after sign-up (asks: Name, City, Main Genre -> redirect to "Create your first event").
  - Email confirmation required before an event can be published (drafts remain draft until email confirmed).
  - Cloudflare Turnstile verification support on sign-up and contact forms.
  - Admin role check: only for `ADMIN_EMAIL` configured in `.env.local`.
  - Guest browsing: Save and Remind buttons trigger quick sign-up/login modal (with Google one tap placeholder).
- **Database Migrations with RLS**:
  - File: `supabase/migrations/001_phase1_init.sql`
  - Tables: `profiles`, `artists`, `venues`, `events`, `settings`. Full RLS policies and triggers.
  - UI text dictionary file: `src/lib/dictionary.ts` for English strings.
