# AI layer (not built in v1)

Nothing lives here yet. Later AI features plug in at these seams:

- **Auto-planning:** read `users/{uid}/days/{date}` plan and `big3`, write a suggested `plan` back (via the same `safeWrite` helper in `src/lib/write.ts`).
- **Natural-language logging:** parse text into an expense or a day `actual` slot. Quick capture (`src/components/layout/QuickCapture.tsx`, phase 7) is the entry point.
- **Coaching:** read the pure metric functions in `src/lib/metrics.ts` and the pattern card on `/track`.

Rules for when this gets built: no custom backend is assumed, so decide where model calls run before writing code, and keep every AI write behind a user confirmation.
