# Ninja Math

Use `README.md` for architecture, scheduling rules, and recovery. The dashboard is for a child known publicly only as Ninja. Preserve its warm pastel design and avoid guilt, punitive streaks, or fabricated achievements. The one exception, Mom's choice: the weekly league can move Ninja down one league after a light week (never below Bronze, kind words only), and Mom can mark a week off. Ninja also asked for tough love: when Math or English slips, the speech bubble teases her about the work (never about her), unless Tweaks is set to Gentle Ninja.

- Viewing stays public. Saves, edits, removals, and catch-up confirmations require the one shared login. Do not add account signup, or treat rate limiting as authentication.
- Never mark lessons 69–74 finished without a logged confirmation. Baseline complete lessons are 1–68.
- Finished and checked are separate. Ninja finishing a lesson drives the forecast, the league, and stickers; Mom's check (a logged `checked` entry, or the `checkedThrough` baseline: Math 5 1–76, English 5 1–29) adds the green ✓ and is required for belts. A "Fixed mistakes" check-in is work on a finished lesson: it never changes progress, the forecast, or the league, and never quiets Sassy Ninja.
- Progress is per-lesson cumulative completion, not an additive ledger of fractions.
- Keep projections and validation in `src/domain/`, shared by the page, Worker, and tests. Math 6 depends on Math 5's completion.
- Keep D1 events append-only and R2 backups private. Never expose recovery endpoints publicly.
- Run `npm run check` (unit + browser tests) before pushing. For manual checks, use `npm run pull:live` to mirror real data locally instead of inventing data. Never put test progress into the production database.
- Do not commit `.dev.vars`, credentials, `.wrangler/`, backup exports, or private notes.
- Future OpenAI calls must be server-side with authorization and usage controls.
