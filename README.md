# Ninja’s Math Journey

A pastel, mobile-friendly dashboard for Ninja’s math, English, and music. Vanilla HTML/CSS/JavaScript, Cloudflare Worker static assets, D1 for shared progress, and private R2 for recovery snapshots. No login, no analytics, no AI dependency.

## Views and Tweaks

- **Today** is Ninja's screen. Subject tabs under the greeting switch Math, English, and Music. Math and English show today's lesson, the sticker collection, book progress, and the week. Music logs practice and teacher lessons. No dates or targets appear here.
- **Journal** lists check-ins for the selected subject. **For Mom** holds that subject’s plan. Math keeps the timeline to 7th grade. **Download progress** lives here and exports every subject.
- Finishing a lesson opens a celebration (flying unicorn, confetti, sticker). It turns calm automatically when the device asks for reduced motion.
- **Tweaks** (top right) sets color theme, light/dark/auto, text size, and celebration style. Saved per device in `localStorage`; `theme.js` applies it before first paint.
- Encouraging copy lives in `public/messages/`, one file per subject. Each subject has its own unicorn. Keep the words kind and specific: no streaks, guilt, or invented achievements.

## Start locally

```sh
npm ci
npm run db:local
npm run dev
```

The local dashboard uses an isolated local database and R2 store. Local test data is never uploaded by deployment. If your agent cannot write Wrangler's global configuration, set `XDG_CONFIG_HOME` to a writable private directory and `WRANGLER_LOG_PATH` to a writable log file. Do not commit authentication files.

## Starting point and scheduling

- November 3, 2026: Math 5 lessons 1–68 are complete. Lessons 69–74 need confirmation; their unfinished fractions are unknown, so they count as remaining until logged.
- Lesson 75 is the next new lesson. Catch-up work has its own quick completion panel.
- Both books contain 120 lessons. Plan one lesson each Monday–Friday with no holiday breaks. Extra and weekend work count.
- A partial entry records **total completion of that lesson**, not additional completion. It never double-counts earlier work.
- Forecasts use remaining lesson-equivalents, rounded up. After a check-in today, the next planned work slot is the next weekday. Without a check-in today, today can still be a workday. Dates use America/New_York.
- Math 6 starts on the weekday immediately following the Math 5 finish. Completing catch-up on Nov 3 and lesson 75 on Nov 4 projects Math 5 to Jan 6, 2027 and Math 6 to June 23, 2027.
- Original targets remain fixed as reference points. August 2027 school start is not assigned a fabricated exact date.
- November 4, 2026: English 5 lessons 1–22 are complete. Lesson 23 is next. The level has 120 lessons and no level 6. Its original target, March 19, 2027, is 98 weekdays from that start. The same weekday rules apply, and English progress never changes Math.
- Music is piano, flute, and saxophone. A log is a practice or a teacher lesson, with minutes and what was played. It has no lesson fractions and no finish date.
- Unlogged days stay unlogged; they are not automatically recorded as skips.
- Corrections and removals recompute the derived state. Actual completion dates stay fixed after finishing a book.

## Deploy to Cloudflare

```sh
npx wrangler login
npx wrangler d1 create ninja-math
npx wrangler r2 bucket create ninja-math-backups
# Put the returned D1 database_id into wrangler.jsonc.
npm run db:remote
npm run deploy
```

Use the account and resource identifiers already recorded in `wrangler.jsonc`; do not recreate resources on subsequent deploys. Cloudflare Workers serves both the pages and API under one public URL. Pushes to `main` on GitHub deploy this Worker. `npm run deploy` remains available for a manual deploy from this checkout.

## Backups and recovery

- Every accepted write first saves a complete, append-only event snapshot in private R2, under `before-change/YYYY-MM-DD/<uuid>.json`. Writes fail closed if that snapshot cannot be saved.
- A scheduled Worker saves a complete snapshot daily at 07:00 UTC under `daily/YYYY-MM-DD.json`. Snapshots are retained; no automated deletion is configured.
- Edits/removals append events in D1; old events are not erased. Public API endpoints cannot access or delete R2 backups and cannot restore data.
- The journal's **Download progress** exports a portable JSON copy. It is optional; automatic backups do not depend on a visitor opening the site.
- Monitor scheduled execution failures in Cloudflare Workers observability. Backups have been exercised locally; deployment enables the real daily schedule.

Owner recovery (Cloudflare login required):

```sh
mkdir -p backups
npx wrangler r2 object get ninja-math-backups/daily/YYYY-MM-DD.json --remote --file backups/snapshot.json
node scripts/restore.mjs backups/snapshot.json
node scripts/restore.mjs backups/snapshot.json --apply --remote
```

The first command previews the snapshot. `--apply` exports a full pre-restore SQL backup locally, then appends recovery events. The original event history remains. The script also accepts a JSON file downloaded from the journal. For a heavily vandalized dashboard, temporarily disable public writes in the Worker before restoring to avoid concurrent changes.

## Public access limits

This version deliberately has no authentication: anyone who knows the URL can view notes or change progress. `noindex` discourages search indexing but is not access control. Keep notes non-personal. Server-side validation, same-origin browser requests, per-IP write throttling, optimistic concurrency checks, escaped UI output, and private backups limit mistakes and support recovery; they do not make anonymous edits trusted. Add authentication before storing sensitive content or adding paid AI endpoints.

## Validation

```sh
npm test
node --check public/app.js
```

Tests cover inclusive weekday math, linked dates, unknown catch-up work, skipped and unlogged days, cumulative partial lessons, weekend work, persistent completion dates, event corrections, and invalid input. Local browser QA covers saving partial work, editing to complete, skipped days, removal, journal persistence, and responsive layout.

## Future AI

Add server-side `/api/ai/*` routes in `src/worker.js` with the OpenAI key stored as a Cloudflare secret. Add login, usage limits, and a suitable child-facing design first. Keep progress and date arithmetic deterministic and independent of model responses. No API key is needed for this release.
