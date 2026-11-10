# Ninja’s Math Journey

A pastel, mobile-friendly dashboard for Ninja’s math, English, music, and sports. A React and TypeScript page built with Vite, one Cloudflare Worker (Hono) for the pages and API, D1 for shared progress, and private R2 for recovery snapshots. Anyone can look. One shared login can save. No analytics and no AI dependency.

## Code layout

- `src/domain/` is the rules, with no browser or Cloudflare code, so the page, the Worker, the tests, and the restore script all share it. `student.ts` describes Ninja and her subjects as data: each is a **course** (books of lessons with targets, like Math and English) or a **practice** (minutes per instrument or activity, like Music and Sports). `subjects/course.ts` and `subjects/practice.ts` hold the projections and calendars. `validate.ts` holds the check-in schemas (Zod). `events.ts` replays the append-only events into entries.
- `src/server/` is the Worker: routes in `index.ts`, the login in `auth.ts`, security headers in `security.ts`. A `ValidationError` from the domain becomes a 400; anything else is logged and becomes a 500.
- `src/web/` is the React page. `App.tsx` is the shell (top bar, views, footer). `state/` holds three providers: `auth.tsx` (the login dialog and session), `data.tsx` (loading, saving, and retrying after a login or a newer save), and `ui.tsx` (which dialog is open, toasts, celebrations). `views/` holds Today, Journal, and For Mom; each works for any course or practice subject, so a new subject needs data in `student.ts` and copy in `messages/`, not new screens. `dialogs/` and `components/` are the pieces. `style.css` stays a plain stylesheet linked from `index.html`.
- The CSP allows no inline scripts or `<style>` tags. Vite compiles JSX itself; the React Vite plugin is left out because its fast refresh needs an inline script. Don't import CSS from TypeScript, which would inject `<style>` tags. React's `style` prop is fine.
- `index.html` loads the theme, font, stylesheet, and React. `public/` holds files served as-is: pictures, fonts, `theme.js`, `robots.txt`.
- Saved check-ins carry `v: 1`. Older Math check-ins saved before subjects existed are read as Math.

## Views and Tweaks

- **Today** is Ninja's screen. Subject tabs under the greeting switch Math, English, Music, and Sports. Math and English show today's lesson, the sticker collection, book progress, and the week. Music and Sports show one month at a time: tap an instrument or sport tile on the Today card to log it, and each day shows that item's ninja (♪ marks a Music teacher lesson). Arrows go back a month and chips filter by item. A This week card shows only what she did (no zeros) and her goal if she set one, and a badge card shows what she earned. Both subjects count days, never streaks. No dates or targets appear here.
- **Journal** lists check-ins for the selected subject. **For Mom** holds that subject’s plan. Math keeps the timeline to 7th grade. **Download progress** lives here and exports every subject.
- Finishing a lesson opens a celebration (flying unicorn, confetti, sticker). It turns calm automatically when the device asks for reduced motion.
- Each subject's celebration plays its own short jingle, synthesized in `src/web/sounds.ts` (no audio files): a chime for Math, a harp sweep for English, a little tune for Music, drums and a fanfare for Sports. Finishing a whole book adds a finale. Tweaks › Sounds turns them off. A phone or tablet on silent stays silent.
- **Tweaks** (top right) sets color theme, light/dark/auto, text size, celebration style, and sounds. Saved per device in `localStorage`; `theme.js` applies it before first paint. Log in and Log out live here too. A login lasts 30 days on that device.
- Encouraging copy lives in `src/web/messages/`, one file per subject. Each subject has its own unicorn. Keep the words kind and specific: no streaks, guilt, or invented achievements.

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
- A math check-in asks what the lesson was about (required in the form, except for a break). Check-ins no longer ask for a note; older notes are kept and still show in the journal.
- A partial entry records **total completion of that lesson**, not additional completion. It never double-counts earlier work.
- Forecasts use remaining lesson-equivalents, rounded up. After a check-in today, the next planned work slot is the next weekday. Without a check-in today, today can still be a workday. Dates use America/New_York.
- Math 6 starts on the weekday immediately following the Math 5 finish. Completing catch-up on Nov 3 and lesson 75 on Nov 4 projects Math 5 to Jan 6, 2027 and Math 6 to June 23, 2027.
- Original targets remain fixed as reference points. August 2027 school start is not assigned a fabricated exact date.
- November 4, 2026: English 5 lessons 1–22 are complete. Lesson 23 is next. The level has 120 lessons and no level 6. Its original target, March 19, 2027, is 98 weekdays from that start. The same weekday rules apply, and English progress never changes Math.
- Music is piano, flute, and saxophone. A log is a practice or a teacher lesson, with minutes, what was played, and an optional face for how it felt. Practice minutes are big buttons (5, 10, 15, 20, 30) with Other for any number up to 180. Teacher lessons are always 30 minutes, so the form doesn't ask; the **Lesson with my teacher** button under the tiles opens one. It has no lesson fractions, no finish date, and no something else.
- Sports is gym, running, mountain biking, snorkeling, and water skiing (`SPORTS` in `src/domain/student.ts`; add one there plus a `public/ninja-<id>.webp` picture). A log is one activity with minutes (1–300), an optional face for how it felt (tough, good, amazing), and an optional line about it. Minutes are big buttons (15, 30, 45, 1 hr, 1½ hr) with Other for any number. **Something else** (`activity:'other'`) saves her own `name` for it, like Swimming; its picture is `other.image` in `src/web/messages/sports.ts` (a placeholder until its own ninja arrives). There are no teacher lessons.
- **Goals** (Music and Sports, each its own): optional and hers to set, in days per week (1–7). Each is one entry, like `{subject:'goal',of:'sports',days}` with the id `goal-sports`; saving again replaces it and "No goal for now" removes it. Reaching it adds a bigger celebration.
- **Badges** are worked out from the logs every time (`badgesFor` in `src/domain/subjects/practice.ts`), never stored, so each one is something she really did: the first time for each sport or instrument, the first something else, three different ones in one Monday–Sunday week, every listed one, and one for each month with anything logged. Names and wording are in `src/web/messages/sports.ts` and `music.ts`.
- **For Mom › Music and Sports** show the week, her goal, totals by month and item (plus teacher lessons for Music), and an activity log by month whose Print button prints just that table. Music and Sports are both practice subjects and share `src/domain/subjects/practice.ts`.
- What was played is a pick from that instrument's song bank, plus optional free text; a log needs at least one of the two. Songs are append-only `song` entries: adding saves one, archiving saves it again with `archived: true` so old logs keep their song names. Saxophone starts with Ragtime, In the Mood, and Satin Doll (`MUSIC` in `src/domain/student.ts`).
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

Always build before deploying. `vite build` writes the page to `dist/client` and the Worker to `dist/ninja_math_journey`, plus a generated config that `wrangler deploy` picks up automatically. Deploying without a build would publish the Worker without its pages.

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

Anyone who knows the URL can view the dashboard, including math topics, songs, and older notes. `noindex` discourages search indexing but is not access control. Keep them non-personal. Saving, editing, removing, and confirming catch-up lessons require the one shared login. There is no signup. The username, password, and session signing key are Worker secrets named `AUTH_USERNAME`, `AUTH_PASSWORD`, and `SESSION_SECRET`. Local development reads them from `.dev.vars`, which stays out of git. Set the same three secrets on the Worker before deploying this version. A session cookie lasts 30 days. Changing the password or the signing key signs that device out.

Server-side validation, same-origin browser requests, per-IP write throttling, login throttling, optimistic concurrency checks, escaped UI output, and private backups remain in place. Rate limiting is not the login.

## Validation

```sh
npm run typecheck   # TypeScript, for the app and the tests
npm test            # unit tests: scheduling, progress, validation, login
npm run test:e2e    # builds, then browser-tests every check-in flow (first time: npx playwright install chromium)
npm run check       # all three
npm run pull:live   # replace the LOCAL database with a copy of the live check-ins
```

Unit tests cover inclusive weekday math, linked dates, unknown catch-up work, skipped and unlogged days, cumulative partial lessons, weekend work, persistent completion dates, event corrections, invalid input, and the login that guards writes. Browser tests (`tests/e2e/`, an iPad-sized Chromium) cover the login gate and the Math, English, Music, and Sports check-ins, including edit and remove, goals, badges, and For Mom logs. The Music tests share one logged-in page, and so do the Sports tests, because the login allows only 8 tries a minute. They run against the production build, on their own server on port 8790 with a fresh database in `.wrangler/e2e` and test-only credentials, so they never touch your local copy of real data or production.

`pull:live` only reads the public `/api/state` and only writes with `--local`. Use it instead of inventing test data when checking something by hand.

GitHub Actions runs all three on every push and pull request. The Cloudflare build for `main` runs `npm test && npm run build` before `wrangler deploy`, so a failing unit test stops the deploy.

## Future AI

Add server-side `/api/ai/*` routes in `src/server/index.ts` with the OpenAI key stored as a Cloudflare secret. Those routes must require the shared login, plus usage limits and a suitable child-facing design. Keep progress and date arithmetic deterministic and independent of model responses. No API key is needed for this release.
