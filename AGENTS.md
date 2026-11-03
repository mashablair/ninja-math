# Ninja Math

Use `README.md` for architecture, scheduling rules, and recovery. The dashboard is for a child known publicly only as Ninja. Preserve its warm pastel design and avoid guilt, punitive streaks, or fabricated achievements.

- User requested public access without login for v1. Do not quietly add authentication or claim rate limiting provides authentication.
- Never mark lessons 69–74 finished without a logged confirmation. Baseline complete lessons are 1–68.
- Progress is per-lesson cumulative completion, not an additive ledger of fractions.
- Keep projections in `public/math.js` shared with tests. Math 6 depends on Math 5's completion.
- Keep D1 events append-only and R2 backups private. Never expose recovery endpoints publicly.
- Run `npm test` for scheduling or backend changes; test affected check-in flows locally. Never put test progress into the production database.
- Do not commit `.dev.vars`, credentials, `.wrangler/`, backup exports, or private notes.
- Future OpenAI calls must be server-side with authorization and usage controls.
