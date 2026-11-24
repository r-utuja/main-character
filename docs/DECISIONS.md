# Decisions

Where the spec was ambiguous, the simplest option matching the mockups was chosen.

## Phase 1

- **Spec as markdown:** the spec arrived as a PDF; converted with `pdftotext` to `docs/SPEC.md`. Tables are flattened, so check the PDF if a table reads oddly.
- **Mockup folder:** `design-reference/design-reference/` flattened to `design-reference/` to match the paths in the brief.
- **Tailwind 3, not 4:** the spec says tokens live in `tailwind.config`, which is the v3 model.
- **Sign-in popup:** `signInWithPopup` as the spec says. Auth state is held in an `AuthProvider` context so every page shares one listener.
- **Missing Firebase env:** the app shows an "almost there" setup screen instead of crashing; Firebase is initialised with placeholder values so import never throws.
- **User doc:** the first name is stored lowercase (voice: "main character hours, rutuja."). Defaults for values the spec doesn't give: weekly budget hours 20/10/6/10, monthly budget 10,000, MVD tasks "10 min of piano", "drink water + eat properly", "one tiny task".
- **Starter habits:** tiny versions taken from the Today mockup (10-min walk, 3 breaths, 1 song, 5 words, 1 page); the icon field holds the habit key (move, breathe, piano, language, read).
- **Offline persistence:** `persistentLocalCache` with `persistentMultipleTabManager` so several tabs work.
- **Route protection:** signed-out visitors go to `/login`. After sign-in they land on `/` (deep link return not added yet; refreshing a deep link while signed in works).
- **Pages are lazy-loaded** and each wrapped in its own `ErrorBoundary` + `Suspense`.
- **Placeholder titles:** pages use the 60px display style in lowercase; "pomodoro" nav label routes to `/focus` titled "focus room".
