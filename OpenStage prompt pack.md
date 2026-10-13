# OpenStage - bolt.new prompt pack

Prepared for Fra, October 2026. Eight prompts to paste into bolt.new one at a time, in order.

## Come usarli

- Incolla la Fase 1, aspetta che bolt finisca, prova il sito, correggi gli errori, poi passa alla fase successiva. Non saltare fasi e non incollarne due insieme.
- Se bolt costruisce un sito solo lato browser (Vite/React semplice), digli: Rebuild using Next.js with server-side rendering. Serve per SEO e anteprime di condivisione.
- Mai incollare chiavi segrete nei prompt: vanno nelle variabili d'ambiente (Supabase, Netlify o Bolt).
- Applicate tutte le correzioni del beta test. Unica scelta cambiata: la prova gratuita dei locali parte da 14 giorni invece di 7. Si modifica dal pannello admin (Settings), quindi puoi rimetterla a 7.
- Prima di iniziare prepara: dominio, progetto Supabase, dominio verificato su Resend, chiave MapTiler, chiavi Cloudflare Turnstile, bucket Cloudflare R2, app PayPal in modalita sandbox, chiave API Anthropic. I testi legali vanno fatti rivedere da un professionista prima del lancio, e per l'IVA su abbonamenti e Pro parla con un commercialista.

## Fase 1 - Fondamenta, stile, account

```text
Build OpenStage, a worldwide web platform to discover live music events, focused on independent artists. Free for artists and fans. All UI text in English (keep strings in a dictionary file so more languages can be added later).

STACK
- Next.js (App Router) with server-side rendering for every public page (SEO and social link previews must work). If Next.js cannot run here, use Astro SSR, but never a client-only SPA.
- Supabase: Auth, Postgres with Row Level Security on every table, Storage for images.
- Tailwind CSS and Framer Motion. Secrets only in environment variables, never in code.
- Mobile first, fast, accessible. Respect prefers-reduced-motion. Lighter animations on mobile.

DESIGN
Dark cyber-neon with glassmorphism. Background #07070D, glass panels (backdrop-blur, 1px translucent border), accents electric violet #8B5CF6, cyan #22D3EE, hot pink #F472B6. Fonts: Space Grotesk for headings, Inter for body. Bento-grid layouts, parallax hero, scroll-reveal for sections and text, hover cards with 3D tilt and neon glow, animated counters. Use glass only for navbar, cards and popups, never behind long text. High text contrast everywhere.
Reusable Pagination component used on every long list: numbered pages at the bottom (prev 1 2 3 ... 8 next), 12 items per page, page stored in the URL.

AUTH AND ROLES
- Three roles chosen at sign-up with three large cards: Artist, Venue/Organizer, Fan. One account has one role.
- Login with email+password and Google. Password reset. Terms and Privacy checkbox at sign-up. Delete my account in settings.
- Artist onboarding after sign-up asks only name, city, main genre, then goes straight to Create your first event.
- Email confirmation is required before an event can be published; until then events stay as drafts and publish automatically after confirmation.
- Cloudflare Turnstile on sign-up and contact forms.
- Admin role: only the email set in the ADMIN_EMAIL env var.
- Guests can browse everything. Save and Remind buttons open a quick sign-up modal (Google one tap) for guests.

DATABASE (create now, with RLS)
profiles (id, role, display_name, avatar_url, city, country, lat, lng, created_at), artists (profile_id, genre, bio, is_pro default false), venues (profile_id, name, address, lat, lng, is_verified default false), events (id, owner_id, title, artist_name, venue_name, address, lat, lng, approximate_location bool, starts_at timestamptz, timezone, genre, event_type, image_url, description, ticket_url, price_text, is_free, lineup, links jsonb, status draft|published|hidden|cancelled, is_featured, is_unclaimed, is_demo, series_id, created_at), settings (key, value jsonb). Later phases add more tables.

LAYOUT
Glass navbar (logo OpenStage, Explore, For artists, For venues, Log in / Sign up). Footer: About, Contact, Privacy, Terms, Cookies, social placeholders. Placeholder pages for Privacy, Terms, Cookies. Reserve space for a fixed radio bar at the bottom of every page (added later); on mobile it must sit above any bottom navigation and never overlap it.

Build only the structure, auth, roles, database and design system now. Show an empty-state home page for the moment.
```

## Fase 2 - Homepage: globo, mappa, ricerca

```text
Continue OpenStage. Build the homepage discovery experience.

HERO GLOBE
- Interactive 3D rotating globe (MapLibre GL JS with globe projection, or Globe.gl) with zoom, worldwide. Map tiles from MapTiler through the MAPTILER_KEY env var. Never use the public OpenStreetMap tile servers.
- One pin per published future event, pulsing animation, clustering when zoomed out.
- Initial center: the visitor's approximate location from server geo headers or IP; if unknown, Italy. Ask for precise browser geolocation only after the user taps Near me.
- Mobile scroll rule: one-finger swipe must scroll the page. The globe moves only after tapping an Explore button (full-screen mode with a close button) or with two fingers.
- Clicking a pin opens a popup (a bottom sheet on mobile): poster, title, artist, date and time in the event's own timezone, venue, genre, and buttons: Event page, Tickets (ticket_url), Open in Google Maps (link), Save, Share. Events with approximate_location show an area circle instead of an exact pin.

SEARCH (directly under the globe)
- Big search bar with live suggestions grouped by category with icons (cities, artists, venues, events, genres) plus recent searches. Use MapTiler geocoding for places and Supabase for the rest. Near me is the first suggestion and also a button.
- Quick buttons: Tonight, This weekend, This week, Next 30 days (computed in the event's timezone).
- Filters: city + radius in km, date range, genre, event type (concert, club night, festival, party, open mic, other), free or paid, emerging artists. Sort: soonest, nearest, popular, newest.

SHOWCASE
- Results below with a switch: Cards or Table (the table becomes cards on mobile). Numbered Pagination, 12 per page. Only future events. Default order: soonest, then nearest when location is known. Up to 3 Featured slots on top, labeled Featured (for now: events with is_featured).
- A View map button toggles a navigable 2D map under the showcase with the same pins, popups and current filters.

EMPTY STATES
When nothing is near the user, show the closest upcoming events worldwide and a call to action: Know an artist or venue near you? Invite them, it is free.

BELOW THE SHOWCASE (scroll-reveal bento grid)
How it works (3 steps); For artists block (List your gig free in 60 seconds, button); For venues and organizers block (Free to list, Venue Pro free trial, plans in your dashboard); teaser of the free radio and of Artist Pro; animated counters (artists, events, cities from the database); footer.

Seed 30 realistic demo events around the world with is_demo = true so the globe can be tested and later deleted.
```

## Fase 3 - Eventi, pagina evento, condivisione

```text
Continue OpenStage. Build event creation, the event page and sharing.

DASHBOARD SHELL
Left sidebar on desktop, bottom tab bar on mobile. Items: My events, Create event, Profile, Notifications, Settings. Pro items will appear later as locked cards.

CREATE EVENT (/dashboard/events/new)
Single-page form with a live preview of the event card beside it. Required: title, artist or organizer name, date and time (timezone taken from the venue location), venue name and address, genre, event type, image. Optional: description, ticket link, price text or Free entry toggle, line-up, links (Instagram, Spotify, YouTube).
- Image: upload, or Generate poster in one click (client-side brand template using title, artist, date, venue, with html-to-image). Resize and compress uploads.
- Address: autocomplete with MapTiler geocoding, then a mini map with a draggable pin to correct the position (small bars and private venues are often missing from geocoders). Option: Show approximate location only (for house parties or secret gigs): public pages show only the city or area.
- If the venue has a registered account, let the user pick it from a list; the event then also appears on the venue page.
- Publish immediately, no pre-approval. Anti-abuse: max 10 new events per day per account, block spam links and banned words (configurable list), events from unverified emails stay draft until confirmation.
- My events list: status, views, saves, edit, duplicate (copy to a new date), cancel, delete. Edits to date, time or venue, and cancellations, must flag the event so the notification system (built later) emails everyone who set a reminder.

EVENT PAGE (/events/[city]/[slug], server-rendered)
Hero with poster and parallax, title, artist, date and time with timezone, venue, city, countdown. Sticky action bar: Remind me, Save, Share, Tickets, Directions (Google Maps link). Then details, genre and type tags, line-up, price or Free entry, mini map, artist card and venue card linking to profiles, More events by this artist, at this venue, nearby, and a discreet Report event with reason. Add to calendar (.ics and Google Calendar link).
- Public interested counter only appears at 10 or more saves.
- After the event ends the page stays and shows Event ended with a link to the profile. Past events disappear from search and the map.
- Count views once per visitor session; also track saves, shares and ticket clicks (table event_stats).
- Simple public artist and venue pages: name, photo, city, upcoming events. On non-Pro artists show a discreet Unlock your full bio page note.

SEO AND LINK PREVIEWS
Readable URLs, JSON-LD schema.org Event, Open Graph and Twitter tags with a dynamically generated preview image per event, sitemap.xml, robots.txt.

SHARE POPUP right after publishing
Big success popup with: WhatsApp (prefilled message and link); Instagram (use the Web Share API with the image file on mobile so it can go straight to Instagram; on desktop a Download button); Copy link; a downloadable share card in three formats (square 1080x1080, portrait 1080x1350, story 1080x1920) generated in the browser from a brand template with poster, title, date, venue, QR code and the OpenStage mark. Below it: Know someone who plays somewhere? Invite them, it is free, with a share link. Reuse the same share component on the event page and in My events.
```

## Fase 4 - Sistema email e area fan

```text
Continue OpenStage. Build the email system and the fan area.

EMAIL SYSTEM (Resend)
- All sending goes through a queue table email_queue and a log table email_log: id, user_id, to_email, template, category (transactional | reminder | digest | marketing | admin), status (queued | sending | sent | delivered | failed | bounced), error_reason, attempts, resend_id, idempotency_key (unique), batch_id, created_at, sent_at.
- A worker (Supabase scheduled Edge Function or Next.js cron route) sends the queue at a controlled rate (configurable, default 2 requests per second, using the Resend batch send, up to 100 per request). On failure: automatic retry up to 3 times with exponential backoff, saving the exact error reason (rate limit, invalid address, bounce, domain not verified, other). Never send everything in one burst.
- Resend webhooks update delivered, bounced and complained. After a hard bounce or complaint, stop emailing that address.
- Retrying a failed mail must never create duplicates (use idempotency_key). Expose a server function retryFailedEmails() for the admin panel built in the next phase.
- Frequency cap: max 1 marketing or digest email per user per week. Every non-essential email has an Unsubscribe link and a preference page.
- Sender from a verified custom domain (RESEND_FROM env var). Emails are do-not-reply; they say: You cannot reply to this email. To contact us, open a new ticket on the Contact page.
- Supabase Auth emails (confirmation, password reset) also go through Resend SMTP.
- Templates (React Email, dark brand style, one main button each): welcome, confirm email, event received, event hidden or rejected (with reason), reminder to publish a first event (3 days after sign-up if none), event changed or cancelled (to reminder holders), event reminders, weekly digest, contact ticket confirmation, contact reply.
- Mass sends share a batch_id.

FAN AREA
Dashboard: For you, Saved events, Reminders, Following, Settings.
- Save and Remind for logged-in fans; guests get the sign-up modal.
- Follow artists and venues.
- For you: events near the fan's city that match chosen genres.
- City: optional at sign-up, or detected after consent; used for Near me and the digest.
- Email reminders: one the day before and one the morning of the event, each switchable.
- Weekly digest of new events from followed artists and venues and in the fan's city, only for users who ticked an unchecked-by-default consent box at sign-up or in settings.
- Settings: toggle each email type, delete account. Fans have no paid features.
```

## Fase 5 - Pannello admin (base)

```text
Continue OpenStage. Build the admin panel at /admin, only for the account with ADMIN_EMAIL. Require two-factor authentication (Supabase TOTP) and give recovery codes at setup. Same dark style, sidebar layout, numbered pagination on every table.

SECTIONS
1. Overview: numbers: users by role, active and total events, new sign-ups per day (chart), events per city, most clicked events, Pro conversions and revenue (placeholders until payments exist), radio plays and applications sent/accepted/rejected (placeholders for now).
2. Events: table with filters. Approve, hide, edit, delete, mark Featured. Reports queue with reason; an event with 3 or more open reports is hidden automatically and goes to review.
3. Users: artists, venues, fans. Search, view, suspend, delete.
4. Contact inbox: public Contact us form (name, email, type: artist / venue / fan / other, message, Turnstile) creating tickets with status new / answered / closed. Admin replies inside the panel and the reply is sent with Resend; the sender gets an automatic confirmation. Replies by email are not supported: the user must open a new ticket.
5. Mail log: table of email_log with status (sent / failed ...), failure reason, recipient, template, date and filters (default view: failed). Reminder and digest emails appear grouped by batch_id (one row with counts) with drill-down. Button Try resend failed mails (confirm dialog, progress, summary) and a retry button per row, both using retryFailedEmails(). Counter of failures in the last 24 hours.
6. Notifications: a bell in the panel for everything. Email to admin only for: radio tracks to review, venue verification requests, event reports, failed payments or failed mails. New sign-ups, events and Pro purchases appear only in the panel.
7. Settings (editable, stored in the settings table): artist Pro price (default 3 EUR), venue Pro monthly and annual price (defaults 4.90 and 39 EUR), trial days (default 14), number of Featured slots (default 3), minimum approved tracks for the radio (default 5), anti-spam limits. Always read these from settings, never hardcode.
8. Create on behalf: admin can create artist profiles, venue profiles and events without an owner (is_unclaimed) and send a Claim your profile invitation email; claim requests are approved manually by admin.
9. Export: buttons to download CSV or JSON backups of the main tables.
```

## Fase 6 - Artist Pro, PayPal, bio page, radio, inviti

```text
Continue OpenStage. Build Artist Pro, payments, bio page, stats, radio and invites.

PAYMENTS (PayPal Business)
- One-time purchase, price from settings (default 3 EUR). Use the PayPal Orders API: create and capture the order on the server with PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env vars (the secret never reaches the browser). Start in sandbox (PAYPAL_ENV).
- Activate Pro only after the server verifies the captured payment and the PayPal webhook (verify the signature), idempotently. Store payments (id, user, amount, status, paypal_id, created_at). Send a confirmation and receipt email. Refunds are handled manually.

GO PRO PAGE (detailed)
Clear sections with visual previews of the bio page, the radio and the statistics, a simple Free vs Pro comparison and the PayPal button. Soft upgrade moments, never blocking: a card in the share popup after publishing, a Go Pro item in the dashboard, locked cards (preview + lock icon) on Pro features.

PRO FEATURES
- Bio page: cover and photo, bio, social and streaming links, track player, upcoming events, archive of past events, photo gallery, embedded YouTube and Spotify videos.
- Detailed stats: views over time, profile visits, radio plays, likes, saves, reminders, ticket clicks, top cities. Free users see only total views per event, with the rest blurred and an upgrade button. Also show free users their saves and shares counts, which grow first.
- Share cards without the OpenStage mark. Featured eligibility. Applying to venue calls (built in the venue phase).

RADIO
- Pro artists upload up to 3 mp3 tracks (max 10 MB each) with a required checkbox: I own all rights to this music and have the right to publish it. Store audio in Cloudflare R2 (S3-compatible, env vars) with presigned uploads, never in Supabase storage.
- Tracks start as pending. The admin gets a notification and an email and reviews them in a new Tracks to review queue in the admin panel (play, approve, reject with reason); the artist gets an email with the outcome. Add a Report track button for listeners and a takedown flow handled by admin.
- Player: fixed bar at the bottom of every page, collapsible to a small pill, never overlapping mobile navigation. It behaves like a live 24/7 radio: all listeners hear the same track at the same moment (compute the current track and offset from server time and the approved playlist), with no skip or previous buttons. Controls: play/pause (playback starts only after the user presses play), volume, like, View artist, Next event link, animated equalizer. Fair rotation across artists. A play counts after 30 seconds. The bar stays hidden until the minimum number of approved tracks from settings is reached.

INVITES
Every artist gets a personal invite code and link (/invite/CODE) shown in the dashboard with share buttons. When 3 invited artists have signed up with a verified email and published at least one event that is not flagged, the inviting artist gets Pro for free (automatic and logged). Admin gets a Referrals table with invited, verified and rewarded counts and can revoke abuse.
```

## Fase 7 - Locali, abbonamento, candidature

```text
Continue OpenStage. Build Venue/Organizer dashboards and Venue Pro.

FREE VENUE
Account, publish events, base profile (name, address, pin on the globe). Events created by artists that point to a registered venue also show on its page.

VENUE PRO (subscription, PayPal Subscriptions)
- One plan, monthly or annual (defaults 4.90 EUR per month, 39 EUR per year), free trial days from settings (default 14). Prices are shown only inside the venue dashboard. The public For venues page says: Free to list. Venue Pro free trial, plans in your dashboard.
- PayPal plans cannot change price: when admin edits a price, create a new plan; current subscribers keep theirs.
- Webhooks (verify the signature): activated, renewed, payment failed, cancelled, expired. Grace period of 3 days after a failed payment. Emails: trial ending (day before), payment failed, renewal receipt, cancellation. The venue can cancel from its dashboard.
- Pro features: full showcase page (photos, hours, links, description), archive of past events, recurring events, Looking for artists board, Verified badge and special pin, Featured eligibility, statistics, QR code and embeddable widget of upcoming events, notification to followers about new events (respect the weekly email cap), share cards without watermark.

RECURRING EVENTS
Rule-based (weekly, every 2 weeks, monthly on the same weekday) with an end date or count; creates linked events with the same series_id. Edit one occurrence or all future ones.

FEATURED SLOTS
The homepage Featured slots (number from settings) rotate fairly among upcoming events of Pro artists and Pro venues near the visitor. Always labeled Featured.

LOOKING FOR ARTISTS
- Venue Pro creates a call: title, genre, date, place, compensation or No fee, description, deadline. Public server-rendered page /calls with filters and pagination. Report call button.
- Only Pro artists can apply (others see an Unlock with Pro prompt). An application is a short message plus the artist profile card; max 5 applications per artist per day.
- Venue inbox: accept or reject, with automatic emails to the artist; statuses pending / accepted / rejected.
- Admin panel gets an Applications section with numbers for sent, accepted, rejected (and a simple chart) and a list.

VERIFIED BADGE
The venue requests verification with a link to its Instagram or Google Maps page; admin approves manually, with notification and email. Verified venues get the special pin.
```

## Fase 8 - Generatore post, SEO, sicurezza, rifinitura

```text
Continue OpenStage. Final features, hardening and polish.

INSTAGRAM POST GENERATOR (admin only, to promote OpenStage itself)
- Admin page with a text box: describe the post you want (for example: free radio for independent artists). A server route calls the Claude API (ANTHROPIC_API_KEY env var, model name in the CLAUDE_MODEL env var) and returns JSON with headline, caption and hashtags.
- The image is rendered in the browser from one fixed OpenStage brand template (same style every time): dark neon background, headline, logo. Formats: square 1080x1080, portrait 1080x1350, story 1080x1920. Buttons: Download image, Copy caption and hashtags, Regenerate. Keep a history list.

SEO
Complete metadata on every page, canonical URLs, sitemap.xml with all events, artists and venues, robots.txt, JSON-LD (WebSite with search action, Event, Organization, MusicGroup), strong Open Graph images. Performance: lazy-load the globe and maps, optimize images, defer heavy animations on mobile.

ANALYTICS AND COOKIES
Own tracking in the database only (views, clicks, plays). No third-party analytics. Cookie banner limited to essential cookies, with a link to the policy.

LEGAL PAGES
Write clear drafts of Privacy Policy, Terms of Use and Cookie Policy for a platform with artists, venues and fans (GDPR, payments, email, geolocation, user-uploaded music). Add a visible TODO in the code and in the admin panel that a professional must review them before launch.

SECURITY AND QUALITY
- Audit Row Level Security on every table, validate and sanitize all inputs, rate limit forms and APIs, Turnstile on sign-up and contact, secure headers (CSP), file type and size checks on uploads.
- 404 and error pages, loading and empty states, accessibility pass (contrast, focus, keyboard, alt text), reduced motion.
- Seed script to add and remove demo events (is_demo flag).
- Write a README checklist with all required env vars (SUPABASE, MAPTILER_KEY, RESEND, RESEND_FROM, ADMIN_EMAIL, TURNSTILE, R2, PAYPAL, ANTHROPIC, CLAUDE_MODEL), the DNS records for Resend and the webhook URLs to configure (Resend, PayPal).
```

# Versione Antigravity

Stesse 8 fasi, adattate a un agente che lavora su un progetto locale. Le regole comuni (stack, stile, convenzioni, risparmio token) stanno una volta sola nel file AGENTS.md, cosi i prompt di fase sono piu corti e consumano meno token. I prompt per bolt.new qui sopra restano com'e.

## Come usarla

- Crea una cartella vuota openstage, aprila in Antigravity e inizializza Git.
- Incolla il blocco AGENTS.md qui sotto in un file AGENTS.md nella cartella principale. Si fa una volta sola.
- Per ogni fase: nuova conversazione e incolli solo il prompt di quella fase. L'agente scrive un piano breve, costruisce, fa la build e il commit.
- Prova il risultato in locale prima di passare alla fase dopo. Se qualcosa non va, descrivi il problema in una frase sola.
- Le chiavi vanno nel file .env.local (mai su Git e mai nei prompt). L'agente crea .env.example con i nomi da compilare.
- Gli script SQL per Supabase li incolli tu nel SQL Editor di Supabase: l'agente ti dice quali e in che ordine.
- Se i token finiscono a meta fase, ripartire e semplice: tutto e salvato nei commit e nel file docs/plan-phase-N.md.

## AGENTS.md (da incollare una volta)

```text
# OpenStage - project rules (read this file at the start of every task)

Product: OpenStage, a worldwide platform to discover live music events, focused on independent artists. Free for artists and fans. All UI text in English, with strings kept in a dictionary file so more languages can be added later.

Stack: Next.js (App Router, TypeScript) with server-side rendering for every public page; Supabase (Auth, Postgres with Row Level Security on every table); Tailwind CSS; Framer Motion; MapLibre GL JS with MapTiler tiles (MAPTILER_KEY, never the public OpenStreetMap tile servers); Resend for email; Cloudflare R2 for audio; Cloudflare Turnstile; PayPal for payments; deploy on Netlify or Vercel. Never a client-only SPA: SEO and social link previews must work.

Design: dark cyber-neon with glassmorphism. Background #07070D, glass panels (backdrop-blur, 1px translucent border), accents violet #8B5CF6, cyan #22D3EE, pink #F472B6. Fonts: Space Grotesk for headings, Inter for body. Bento grids, parallax hero, scroll-reveal for sections and text, hover cards with 3D tilt and neon glow, animated counters. Glass only for navbar, cards and popups, never behind long text. High contrast. Respect prefers-reduced-motion and use lighter animations on mobile. Mobile first.

Conventions: one reusable numbered Pagination component (prev 1 2 3 ... 8 next, 12 items per page, page kept in the URL) on every long list. Secrets only in env vars (.env.local, never committed); keep .env.example updated. Database changes as numbered SQL files in supabase/migrations, always with RLS; tell the user exactly how to apply them (Supabase SQL Editor). Prices and limits are read from the settings table, never hardcoded. The fixed radio bar at the bottom of every page (added later) must sit above any mobile bottom navigation.

Working rules (save tokens): write a short plan in docs/plan-phase-N.md before coding; edit only the files that need changing; do not re-read the whole repo; no extra refactors and no polish pass unless asked; at the end run the build and fix errors, make a Git commit named Phase N, and reply with a 5-line summary: what to test, which env vars to set, which SQL to run.
```

## Fase 1 - Fondamenta, stile, account

```text
Phase 1 - Foundation. Read AGENTS.md and follow its working rules.

Create the Next.js project and build:
- Design system and layout: glass navbar (logo OpenStage, Explore, For artists, For venues, Log in / Sign up), footer (About, Contact, Privacy, Terms, Cookies, social placeholders), placeholder pages for Privacy, Terms and Cookies, the reusable Pagination component. Reserve space for the radio bar at the bottom.
- Auth and roles with Supabase: three roles chosen at sign-up with three large cards (Artist, Venue/Organizer, Fan); one account has one role. Email+password and Google login (if Google credentials are missing, leave Google ready but do not block on it). Password reset. Terms and Privacy checkbox at sign-up. Delete my account in settings.
- Artist onboarding after sign-up asks only name, city, main genre, then goes straight to Create your first event.
- Email confirmation is required before an event can be published; until then events stay as drafts and publish automatically after confirmation.
- Turnstile on sign-up and contact forms. Admin role only for the email in ADMIN_EMAIL.
- Guests can browse everything. Save and Remind buttons open a quick sign-up modal (Google one tap) for guests.
- Migration with RLS: profiles (id, role, display_name, avatar_url, city, country, lat, lng, created_at), artists (profile_id, genre, bio, is_pro default false), venues (profile_id, name, address, lat, lng, is_verified default false), events (id, owner_id, title, artist_name, venue_name, address, lat, lng, approximate_location bool, starts_at timestamptz, timezone, genre, event_type, image_url, description, ticket_url, price_text, is_free, lineup, links jsonb, status draft|published|hidden|cancelled, is_featured, is_unclaimed, is_demo, series_id, created_at), settings (key, value jsonb). Later phases add more tables.

Show an empty-state home page for now. Do not build anything else.
```

## Fase 2 - Homepage: globo, mappa, ricerca

```text
Phase 2 - Homepage discovery. Read AGENTS.md and follow its working rules.

HERO GLOBE
- Interactive 3D rotating globe (MapLibre GL JS with globe projection, or Globe.gl) with zoom, worldwide.
- One pin per published future event, pulsing animation, clustering when zoomed out.
- Initial center: the visitor's approximate location from server geo headers or IP; if unknown, Italy. Ask for precise browser geolocation only after the user taps Near me.
- Mobile scroll rule: one-finger swipe must scroll the page. The globe moves only after tapping an Explore button (full-screen mode with a close button) or with two fingers.
- Clicking a pin opens a popup (a bottom sheet on mobile): poster, title, artist, date and time in the event's own timezone, venue, genre, and buttons: Event page, Tickets (ticket_url), Open in Google Maps (link), Save, Share. Events with approximate_location show an area circle instead of an exact pin.

SEARCH (directly under the globe)
- Big search bar with live suggestions grouped by category with icons (cities, artists, venues, events, genres) plus recent searches. Use MapTiler geocoding for places and Supabase for the rest. Near me is the first suggestion and also a button.
- Quick buttons: Tonight, This weekend, This week, Next 30 days (computed in the event's timezone).
- Filters: city + radius in km, date range, genre, event type (concert, club night, festival, party, open mic, other), free or paid, emerging artists. Sort: soonest, nearest, popular, newest.

SHOWCASE
- Results below with a switch: Cards or Table (the table becomes cards on mobile). Numbered Pagination, 12 per page. Only future events. Default order: soonest, then nearest when location is known. Up to 3 Featured slots on top, labeled Featured (for now: events with is_featured).
- A View map button toggles a navigable 2D map under the showcase with the same pins, popups and current filters.

EMPTY STATES
When nothing is near the user, show the closest upcoming events worldwide and a call to action: Know an artist or venue near you? Invite them, it is free.

BELOW THE SHOWCASE (scroll-reveal bento grid)
How it works (3 steps); For artists block (List your gig free in 60 seconds, button); For venues and organizers block (Free to list, Venue Pro free trial, plans in your dashboard); teaser of the free radio and of Artist Pro; animated counters (artists, events, cities from the database); footer.

Seed 30 realistic demo events around the world with is_demo = true so the globe can be tested and later deleted.
```

## Fase 3 - Eventi, pagina evento, condivisione

```text
Phase 3 - Events, event page, sharing. Read AGENTS.md and follow its working rules.

DASHBOARD SHELL
Left sidebar on desktop, bottom tab bar on mobile. Items: My events, Create event, Profile, Notifications, Settings. Pro items will appear later as locked cards.

CREATE EVENT (/dashboard/events/new)
Single-page form with a live preview of the event card beside it. Required: title, artist or organizer name, date and time (timezone taken from the venue location), venue name and address, genre, event type, image. Optional: description, ticket link, price text or Free entry toggle, line-up, links (Instagram, Spotify, YouTube).
- Image: upload, or Generate poster in one click (client-side brand template using title, artist, date, venue, with html-to-image). Resize and compress uploads.
- Address: autocomplete with MapTiler geocoding, then a mini map with a draggable pin to correct the position (small bars and private venues are often missing from geocoders). Option: Show approximate location only (for house parties or secret gigs): public pages show only the city or area.
- If the venue has a registered account, let the user pick it from a list; the event then also appears on the venue page.
- Publish immediately, no pre-approval. Anti-abuse: max 10 new events per day per account, block spam links and banned words (configurable list), events from unverified emails stay draft until confirmation.
- My events list: status, views, saves, edit, duplicate (copy to a new date), cancel, delete. Edits to date, time or venue, and cancellations, must flag the event so the notification system (built later) emails everyone who set a reminder.

EVENT PAGE (/events/[city]/[slug], server-rendered)
Hero with poster and parallax, title, artist, date and time with timezone, venue, city, countdown. Sticky action bar: Remind me, Save, Share, Tickets, Directions (Google Maps link). Then details, genre and type tags, line-up, price or Free entry, mini map, artist card and venue card linking to profiles, More events by this artist, at this venue, nearby, and a discreet Report event with reason. Add to calendar (.ics and Google Calendar link).
- Public interested counter only appears at 10 or more saves.
- After the event ends the page stays and shows Event ended with a link to the profile. Past events disappear from search and the map.
- Count views once per visitor session; also track saves, shares and ticket clicks (table event_stats).
- Simple public artist and venue pages: name, photo, city, upcoming events. On non-Pro artists show a discreet Unlock your full bio page note.

SEO AND LINK PREVIEWS
Readable URLs, JSON-LD schema.org Event, Open Graph and Twitter tags with a dynamically generated preview image per event, sitemap.xml, robots.txt.

SHARE POPUP right after publishing
Big success popup with: WhatsApp (prefilled message and link); Instagram (use the Web Share API with the image file on mobile so it can go straight to Instagram; on desktop a Download button); Copy link; a downloadable share card in three formats (square 1080x1080, portrait 1080x1350, story 1080x1920) generated in the browser from a brand template with poster, title, date, venue, QR code and the OpenStage mark. Below it: Know someone who plays somewhere? Invite them, it is free, with a share link. Reuse the same share component on the event page and in My events.
```

## Fase 4 - Sistema email e area fan

```text
Phase 4 - Email system and fan area. Read AGENTS.md and follow its working rules.

EMAIL SYSTEM (Resend)
- All sending goes through a queue table email_queue and a log table email_log: id, user_id, to_email, template, category (transactional | reminder | digest | marketing | admin), status (queued | sending | sent | delivered | failed | bounced), error_reason, attempts, resend_id, idempotency_key (unique), batch_id, created_at, sent_at.
- A worker (Supabase scheduled Edge Function or Next.js cron route) sends the queue at a controlled rate (configurable, default 2 requests per second, using the Resend batch send, up to 100 per request). On failure: automatic retry up to 3 times with exponential backoff, saving the exact error reason (rate limit, invalid address, bounce, domain not verified, other). Never send everything in one burst.
- Resend webhooks update delivered, bounced and complained. After a hard bounce or complaint, stop emailing that address.
- Retrying a failed mail must never create duplicates (use idempotency_key). Expose a server function retryFailedEmails() for the admin panel built in the next phase.
- Frequency cap: max 1 marketing or digest email per user per week. Every non-essential email has an Unsubscribe link and a preference page.
- Sender from a verified custom domain (RESEND_FROM env var). Emails are do-not-reply; they say: You cannot reply to this email. To contact us, open a new ticket on the Contact page.
- Supabase Auth emails (confirmation, password reset) also go through Resend SMTP.
- Templates (React Email, dark brand style, one main button each): welcome, confirm email, event received, event hidden or rejected (with reason), reminder to publish a first event (3 days after sign-up if none), event changed or cancelled (to reminder holders), event reminders, weekly digest, contact ticket confirmation, contact reply.
- Mass sends share a batch_id.

FAN AREA
Dashboard: For you, Saved events, Reminders, Following, Settings.
- Save and Remind for logged-in fans; guests get the sign-up modal.
- Follow artists and venues.
- For you: events near the fan's city that match chosen genres.
- City: optional at sign-up, or detected after consent; used for Near me and the digest.
- Email reminders: one the day before and one the morning of the event, each switchable.
- Weekly digest of new events from followed artists and venues and in the fan's city, only for users who ticked an unchecked-by-default consent box at sign-up or in settings.
- Settings: toggle each email type, delete account. Fans have no paid features.
```

## Fase 5 - Pannello admin (base)

```text
Phase 5 - Admin panel. Read AGENTS.md and follow its working rules.

Build the admin panel at /admin, only for the account with ADMIN_EMAIL. Require two-factor authentication (Supabase TOTP) and give recovery codes at setup. Same dark style, sidebar layout, numbered pagination on every table.

SECTIONS
1. Overview: numbers: users by role, active and total events, new sign-ups per day (chart), events per city, most clicked events, Pro conversions and revenue (placeholders until payments exist), radio plays and applications sent/accepted/rejected (placeholders for now).
2. Events: table with filters. Approve, hide, edit, delete, mark Featured. Reports queue with reason; an event with 3 or more open reports is hidden automatically and goes to review.
3. Users: artists, venues, fans. Search, view, suspend, delete.
4. Contact inbox: public Contact us form (name, email, type: artist / venue / fan / other, message, Turnstile) creating tickets with status new / answered / closed. Admin replies inside the panel and the reply is sent with Resend; the sender gets an automatic confirmation. Replies by email are not supported: the user must open a new ticket.
5. Mail log: table of email_log with status (sent / failed ...), failure reason, recipient, template, date and filters (default view: failed). Reminder and digest emails appear grouped by batch_id (one row with counts) with drill-down. Button Try resend failed mails (confirm dialog, progress, summary) and a retry button per row, both using retryFailedEmails(). Counter of failures in the last 24 hours.
6. Notifications: a bell in the panel for everything. Email to admin only for: radio tracks to review, venue verification requests, event reports, failed payments or failed mails. New sign-ups, events and Pro purchases appear only in the panel.
7. Settings (editable, stored in the settings table): artist Pro price (default 3 EUR), venue Pro monthly and annual price (defaults 4.90 and 39 EUR), trial days (default 14), number of Featured slots (default 3), minimum approved tracks for the radio (default 5), anti-spam limits.
8. Create on behalf: admin can create artist profiles, venue profiles and events without an owner (is_unclaimed) and send a Claim your profile invitation email; claim requests are approved manually by admin.
9. Export: buttons to download CSV or JSON backups of the main tables.
```

## Fase 6 - Artist Pro, PayPal, bio page, radio, inviti

```text
Phase 6 - Artist Pro, payments, bio page, stats, radio, invites. Read AGENTS.md and follow its working rules.

PAYMENTS (PayPal Business)
- One-time purchase, price from settings (default 3 EUR). Use the PayPal Orders API: create and capture the order on the server with PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env vars (the secret never reaches the browser). Start in sandbox (PAYPAL_ENV).
- Activate Pro only after the server verifies the captured payment and the PayPal webhook (verify the signature), idempotently. Store payments (id, user, amount, status, paypal_id, created_at). Send a confirmation and receipt email. Refunds are handled manually.

GO PRO PAGE (detailed)
Clear sections with visual previews of the bio page, the radio and the statistics, a simple Free vs Pro comparison and the PayPal button. Soft upgrade moments, never blocking: a card in the share popup after publishing, a Go Pro item in the dashboard, locked cards (preview + lock icon) on Pro features.

PRO FEATURES
- Bio page: cover and photo, bio, social and streaming links, track player, upcoming events, archive of past events, photo gallery, embedded YouTube and Spotify videos.
- Detailed stats: views over time, profile visits, radio plays, likes, saves, reminders, ticket clicks, top cities. Free users see only total views per event, with the rest blurred and an upgrade button. Also show free users their saves and shares counts, which grow first.
- Share cards without the OpenStage mark. Featured eligibility. Applying to venue calls (built in the venue phase).

RADIO
- Pro artists upload up to 3 mp3 tracks (max 10 MB each) with a required checkbox: I own all rights to this music and have the right to publish it. Store audio in Cloudflare R2 (S3-compatible, env vars) with presigned uploads, never in Supabase storage.
- Tracks start as pending. The admin gets a notification and an email and reviews them in a new Tracks to review queue in the admin panel (play, approve, reject with reason); the artist gets an email with the outcome. Add a Report track button for listeners and a takedown flow handled by admin.
- Player: fixed bar at the bottom of every page, collapsible to a small pill, never overlapping mobile navigation. It behaves like a live 24/7 radio: all listeners hear the same track at the same moment (compute the current track and offset from server time and the approved playlist), with no skip or previous buttons. Controls: play/pause (playback starts only after the user presses play), volume, like, View artist, Next event link, animated equalizer. Fair rotation across artists. A play counts after 30 seconds. The bar stays hidden until the minimum number of approved tracks from settings is reached.

INVITES
Every artist gets a personal invite code and link (/invite/CODE) shown in the dashboard with share buttons. When 3 invited artists have signed up with a verified email and published at least one event that is not flagged, the inviting artist gets Pro for free (automatic and logged). Admin gets a Referrals table with invited, verified and rewarded counts and can revoke abuse.
```

## Fase 7 - Locali, abbonamento, candidature

```text
Phase 7 - Venue/Organizer dashboards and Venue Pro. Read AGENTS.md and follow its working rules.

FREE VENUE
Account, publish events, base profile (name, address, pin on the globe). Events created by artists that point to a registered venue also show on its page.

VENUE PRO (subscription, PayPal Subscriptions)
- One plan, monthly or annual (defaults 4.90 EUR per month, 39 EUR per year), free trial days from settings (default 14). Prices are shown only inside the venue dashboard. The public For venues page says: Free to list. Venue Pro free trial, plans in your dashboard.
- PayPal plans cannot change price: when admin edits a price, create a new plan; current subscribers keep theirs.
- Webhooks (verify the signature): activated, renewed, payment failed, cancelled, expired. Grace period of 3 days after a failed payment. Emails: trial ending (day before), payment failed, renewal receipt, cancellation. The venue can cancel from its dashboard.
- Pro features: full showcase page (photos, hours, links, description), archive of past events, recurring events, Looking for artists board, Verified badge and special pin, Featured eligibility, statistics, QR code and embeddable widget of upcoming events, notification to followers about new events (respect the weekly email cap), share cards without watermark.

RECURRING EVENTS
Rule-based (weekly, every 2 weeks, monthly on the same weekday) with an end date or count; creates linked events with the same series_id. Edit one occurrence or all future ones.

FEATURED SLOTS
The homepage Featured slots (number from settings) rotate fairly among upcoming events of Pro artists and Pro venues near the visitor. Always labeled Featured.

LOOKING FOR ARTISTS
- Venue Pro creates a call: title, genre, date, place, compensation or No fee, description, deadline. Public server-rendered page /calls with filters and pagination. Report call button.
- Only Pro artists can apply (others see an Unlock with Pro prompt). An application is a short message plus the artist profile card; max 5 applications per artist per day.
- Venue inbox: accept or reject, with automatic emails to the artist; statuses pending / accepted / rejected.
- Admin panel gets an Applications section with numbers for sent, accepted, rejected (and a simple chart) and a list.

VERIFIED BADGE
The venue requests verification with a link to its Instagram or Google Maps page; admin approves manually, with notification and email. Verified venues get the special pin.
```

## Fase 8 - Generatore post, SEO, sicurezza, rifinitura

```text
Phase 8 - Final features, hardening, polish. Read AGENTS.md and follow its working rules.

INSTAGRAM POST GENERATOR (admin only, to promote OpenStage itself)
- Admin page with a text box: describe the post you want (for example: free radio for independent artists). A server route calls the Claude API (ANTHROPIC_API_KEY env var, model name in the CLAUDE_MODEL env var) and returns JSON with headline, caption and hashtags.
- The image is rendered in the browser from one fixed OpenStage brand template (same style every time): dark neon background, headline, logo. Formats: square 1080x1080, portrait 1080x1350, story 1080x1920. Buttons: Download image, Copy caption and hashtags, Regenerate. Keep a history list.

SEO
Complete metadata on every page, canonical URLs, sitemap.xml with all events, artists and venues, robots.txt, JSON-LD (WebSite with search action, Event, Organization, MusicGroup), strong Open Graph images. Performance: lazy-load the globe and maps, optimize images, defer heavy animations on mobile.

ANALYTICS AND COOKIES
Own tracking in the database only (views, clicks, plays). No third-party analytics. Cookie banner limited to essential cookies, with a link to the policy.

LEGAL PAGES
Write clear drafts of Privacy Policy, Terms of Use and Cookie Policy for a platform with artists, venues and fans (GDPR, payments, email, geolocation, user-uploaded music). Add a visible TODO in the code and in the admin panel that a professional must review them before launch.

SECURITY AND QUALITY
- Audit Row Level Security on every table, validate and sanitize all inputs, rate limit forms and APIs, Turnstile on sign-up and contact, secure headers (CSP), file type and size checks on uploads.
- 404 and error pages, loading and empty states, accessibility pass (contrast, focus, keyboard, alt text), reduced motion.
- Seed script to add and remove demo events (is_demo flag).
- Write a README checklist with all required env vars (SUPABASE, MAPTILER_KEY, RESEND, RESEND_FROM, ADMIN_EMAIL, TURNSTILE, R2, PAYPAL, ANTHROPIC, CLAUDE_MODEL), the DNS records for Resend and the webhook URLs to configure (Resend, PayPal), and the deploy steps for Netlify or Vercel.
```
