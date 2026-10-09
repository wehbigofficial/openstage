<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Market and language

Market and language: for now we launch only in Italy. Italian is the primary language, English the secondary. Every new page, form, email, error message and notification built from now on must exist in both languages (it and en), with all strings kept in the dictionary files, never hardcoded. A language switcher (it / en) is in the navbar and footer; default to Italian for visitors from Italy or with an Italian browser language. Each user's preferred language is stored in profiles. Defaults: country Italy, timezone Europe/Rome, Italian date format (for example sabato 12 ottobre, ore 21:00), Italian cities in suggestions. Older pages from phases 1-3 will be translated in a separate pass.
