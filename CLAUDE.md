# main character (mc.)

Desktop-first personal planner: dashboard, pomodoro focus room, sprint board, hour tracker, money, review, settings. Anyone signs in with Google and gets private data.

Source of truth: `docs/SPEC.md` (behaviour) and `design-reference/*.dc.html` (look; rebuild as React + Tailwind, never copy or run the templating format). Spec ambiguities: pick the simplest option matching the mockups and log it in `docs/DECISIONS.md`.

## Stack (add nothing else without asking)
Vite, React 18, TypeScript strict (no `any`), Tailwind CSS 3, React Router, Firebase Auth (Google) + Firestore with offline persistence, date-fns, @dnd-kit/core, Vitest. No custom backend, no server functions, no Redux, no React Query, no UI kit, no chart library. Deploy: Vercel. No AI layer in v1 (only `src/ai/README.md`).

## Working rules
- Work phase by phase from the spec's Build plan. Start of phase: list files to create/change. End: `npm run build`, `npm run lint`, `npm test` all pass, commit, explain how to check "Done when", then stop and wait for the go-ahead.
- Simple, boring code. Small components; hooks: useAuth, useUserDoc, useDay, useCollection, useTimer, useNow. Every metric is a pure function in `src/lib/metrics.ts` with unit tests (include divide-by-zero). No premature abstraction.
- Never crash: loading + empty state everywhere, a missing Firestore doc means empty data, every write goes through `safeWrite` (`src/lib/write.ts`, toasts on failure), one `ErrorBoundary` per page.
- Pomodoro timer is timestamp-based (`endsAt` / `remainingMs`), saved to Firestore + localStorage, restored on load. Never decrement a counter.
- Exact tokens from the spec (see `tailwind.config.ts`), fonts Bricolage Grotesque / Inter / JetBrains Mono, lowercase warm voice, dark only, 24h clock, INR with Indian grouping (7,450). No red, no "overdue".
- Firestore: everything under `users/{uid}`; rules in `firestore.rules`.
- Never commit `.env.local`.
