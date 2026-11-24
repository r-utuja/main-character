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

## Phases 2-8

- **Slot keys are clock hours** ("0" to "23"). A day with a non-zero day-start hour shows the hours rotated, so "apply to next N hours" follows the displayed order and stops at the end of the day.
- **Slot editor is a centred modal**, not an anchored popover (works the same from the dashboard strip, Track day view and week heatmap).
- **Track week view** lets you click any cell to edit that day's actual slot (the spec only calls it a heatmap).
- **Time budget** counts the current ISO week (Mon to today). "Days left" for the pattern card rule = days after today until Sunday. Rule 2 fires with 2 or fewer days left.
- **Pattern "try it tomorrow"**: slump rule plans a "walk + easiest task" slot at that hour tomorrow. Behind rule plans a "<cat> catch-up" slot in the first empty evening hour tomorrow. "not now" hides the card for the rest of the day (localStorage).
- **Free hours for the load check** = hours left today (including the rest of this one) that are not planned as sleep.
- **RIGHT NOW block** = consecutive plan hours with the same category and label. The if-then text is whatever you typed on the plan slot. "lock in" preselects the frog if it matches the block's category.
- **Streaks**: a single missed day is forgiven, two in a row end it. An MVD day with any habit or tiny win done never counts as a miss. Today not being done yet never breaks a streak.
- **Timer**: stores `endsAt` or `remainingMs` (no `startedAt`; a finished session's start is `endsAt - focus length`). `useTimer` is a provider at the app shell so a finishing timer saves its session, plays the chime and moves on from any page. Local copy in localStorage wins on load; the Firestore copy is used if there is none. A timer that finished while the tab was closed still saves its session on next load (chime only if under a minute late).
- **Sessions fill the actual slot** of the hour holding the session midpoint, only if that slot is empty.
- **Tickets**: key counters are bumped inside a transaction. "new ticket" on the board goes into the active sprint; quick capture tickets go to the backlog. Backlog = tickets with no sprint that are not done. Closing a sprint moves unfinished tickets into the new one; done tickets stay with the old sprint.
- **Burndown "ahead of ideal"**: remaining at today's end <= ideal. Otherwise "a bit behind ideal. still fine." (no red).
- **Velocity warning** appears only once at least one sprint has been closed.
- **Eisenhower drag**: moving to an important quadrant raises low priority to high; moving to not-important sets low. Moving to urgent sets due to today+2 if it was not already urgent; moving to not-urgent sets due to today+7 if it was urgent. Quadrants are named "do now", "plan it", "squeeze in", "maybe later".
- **Big 3 / ticket link**: a task can link to an open ticket when added. Ticking either side ticks the other (ticket done <-> task done; un-ticking a task puts the ticket back to in progress).
- **Money**: the nudge uses a category's share of this month's spending (over 30%). Default category = last one used. Weekly share of budget in the weekly review = monthly budget x 7 / 30.
- **Weekly review** opens on Sundays; other days show an "open early" button.
- **Habit icons** are the five starter icons plus a plain dot for new habits.
- **Capture expense** parses a leading number ("120 chai"); category defaults to "other".
- **Not done in this pass**: the Lighthouse check and the live deploy need your Firebase project and Vercel account. The Timeline tab and month view are v2 per the spec.
