main character — product spec & build guide

main character — product spec & build guide

 Nov 24, 2026 · @​ Rini

Overview

main character (working name, short form mc.) is a desktop-first web app for planning
the day, tracking every hour, running focus sessions, managing projects in sprints and
logging daily spending. It is built for one student juggling college, placement prep, self-
learning and startup work, but any Google user can sign in and get their own private copy.

The design mockups live on the design canvas (page "desktop v2"). This doc is the source
of truth for behaviour; the canvas is the source of truth for look.

Product principles

  1. Opinionated, not a blank canvas. Every module is pre-built. The user fills in data and
     never designs layouts (the anti-Notion rule).

  2. Two clicks or fewer to log anything. If logging is slow, tracking dies by week two.
  3. Plan vs reality is the core insight. Every screen that shows a plan also shows what

     actually happened.
  4. No guilt. Nothing turns angry red. Missed items are rescheduled, not "failed". Time

     leaks use neutral stripes.
  5. Every insight ends in one action. A pattern card always offers a single next step.
  6. Boring, sturdy code. Minimal backend, no clever abstractions, nothing that crashes

     on a refresh.

v1 scope

Area       In v1

Auth       Google sign-in, one private workspace per user

Dashboard  24h plan vs actual strip, RIGHT NOW card, big 3, up
           next, rituals, sprint and week snapshots, load
           check, spend today

Pomodoro Separate focus room: 25/5/15 timer, task +
                   category, daily goal, session log, parking lot

                                                                   Page 1 of 19
main character — product spec & build guide

Area       In v1
Board
Track      Sprints, tickets with story points, WIP limit,
Money      burndown, epics, backlog, Eisenhower view
Review
Settings   Day and week view of 24 hourly slots, time budget
Modes      per category, one pattern card

           Quick add, today/week/month totals, monthly
           budget, category split, recent entries

           Daily 3-line journal and a weekly review form

           Day start hour, pomodoro lengths, habits, budgets,
           MVD defaults, reality factor

           Minimum viable day (MVD) toggle, quick capture
           (Ctrl+K)

Out of scope for v1

     The AI layer (auto-planning, natural-language logging, coaching). Leave clean seams
     for it, build nothing.
     Calendar sync, notifications, mobile app, team or shared boards, bank or UPI import.
     Custom categories (v1 has a fixed set of five work categories plus sleep and leak).

Navigation and screens

The app is one page shell: a left sidebar (232 px) and a main content area (max width 1240
px, 32 px side padding). Below 900 px wide the sidebar stacks on top, so the app never
breaks on a phone, but layouts are designed for laptops first.

Sidebar item Route                           What it's for

dashboard  /                                 The front page: today at a glance and links into
                                             every other section
pomodoro   /focus
                                             The focus room: timer, current task, session log,
board      /board                            parking lot

                                             Sprint board, backlog, Eisenhower view, epics

                                                                                                Page 2 of 19
main character — product spec & build guide

Sidebar item Route                           What it's for

track     /track                             Hour-by-hour plan vs actual, day and week, time
                                             budget

money     /money                             Spending log and budget

review    /review                            Daily journal and weekly review

settings  /settings Day start, pomodoro lengths, habits, budgets,
                             MVD defaults

(signed out) /login                          Google sign-in screen

Sidebar footer: a "your day" box ("00:00 → 24:00 · 24h clock", link to settings) and the
user's initials avatar plus first name.

Cross-page flows

     Dashboard RIGHT NOW → "lock in with a pomodoro" → /focus with that task
     preselected.
     Dashboard sprint snapshot → /board . Week snapshot → /track . Spent today →
      /money .
     A finished pomodoro writes a session and fills that hour's actual slot on /track and
     the dashboard strip.
     Quick capture (Ctrl+K or the capture button) opens from any page and can add a
     ticket, a big-3 task, an expense or a parked thought.
     Any big-3 task can link to a board ticket; ticking either one ticks both.

Feature specs

Every feature below uses the same five work categories: college, placement, exploration,
startup, other. Tracking adds two non-work states: sleep and leak (time that slipped away,
such as scrolling). All times use a 24h clock. A "day" runs from the day-start hour in
settings (default 00:00) for 24 hours.

                                                                                              Page 3 of 19
main character — product spec & build guide

 Dashboard ( / )

       Top bar: current time (HH:MM, updates every minute), date with ISO week number, a
       full day / minimum viable day segmented switch, and a capture button showing "Ctrl
       K".
       Hero: "main character hours, {first name}." and the time left until the day resets ("13h
       01m left").
       24h strip: two rows of 24 cells, PLAN and ACTUAL, coloured by category, hour labels
       00–23 underneath. The current hour has a lime outline; ACTUAL fills partially for the
       current hour; future actual cells are dashed and empty. Clicking a cell opens the same
       slot editor as /track .
       RIGHT NOW card (lime): the plan block covering the current hour: its time range,
       category, title and the user's if-then line ("if it's 10:30 → notes open, pomodoro on,
       phone away"). Buttons: "lock in with a pomodoro" and "what now?". "what now?" picks
       the first unfinished big-3 task (the frog first) and shows it in the card. With no plan
       block, the card says "nothing planned right now" and offers "plan this hour".
       The big 3: exactly three tasks per day, each with title, category chip, estimate
       (minutes) and done checkbox. The first is tagged THE FROG (hardest first). Progress
       shows "x/3 done". Unfinished tasks get a "move to tomorrow" option at the shutdown
       review; nothing is ever marked overdue.
       Load check: planned minutes of the big 3 × the reality factor (default 1.4, set in
       settings) compared with the free work hours left today. Verdicts: under 80% "you're
       good", 80–100% "tight but doable", over 100% "overbooked: move something".
       Sprint snapshot: sprint number and day ("day 2 of 14"), points done / committed, a
       stacked bar (done, in review, in progress), WIP status, first blocked ticket, next due
       ticket. Links to /board .
       This week: spent / planned hours for the four main categories as small bars. Links to
        /track .
       Up next: the next four plan blocks after now, with time and category dot.
       Rituals: up to 6 habits as round toggle buttons with icon, name and streak ("12d"). A
       habit missed yesterday shows a dashed orange ring and "save it" (never miss twice).
       Tapping toggles today's completion.
       Spent today: today's total and entry count. Links to /money .

 Minimum viable day (MVD) mode

       Switched per day from the dashboard top bar; stored on that day.

                                                                                                                                                                                                                                                    Page 4 of 19
main character — product spec & build guide

       When on: a lilac banner appears ("rough day? 3 tiny wins, then rest. streaks are
       protected and nothing turns red today."), the big 3 is replaced by the 3 MVD tasks
       from settings, each habit shows its tiny version ("10-min walk", "1 page") and counts as
       done if the tiny version is ticked, and the load check reads "light day, no pressure".
       Streaks never break on an MVD day as long as at least one habit or MVD task is done.

 Pomodoro ( /focus )

       Timer: modes focus 25, short break 5, long break 15 (lengths editable in settings). A
       long break follows every 4th focus session. Shows MM:SS, a progress bar, 4 diamond
       session markers and a status line ("ready when you are", "locked in", "paused", break
       messages). A sticker reads READY, LOCKED IN or ON BREAK.
       Controls: start / pause / resume, reset, skip. Space bar toggles start/pause when no
       input is focused.
       Working on: the day's big-3 tasks as selectable cards; picking one sets the category.
       A "logs as" chip row lets the user override the category.
       Accuracy rule: the timer stores startedAt and endsAt timestamps and derives the
       remaining time from the clock, so it survives tab sleep, refresh and closing the laptop.
       It must never count by decrementing a number every second.
       On finishing a focus session: save a session (start, end, task, category), fill the actual
       slot of the hour it mostly covered (if that slot is empty), play a short soft chime, and
       switch to the break. The browser tab title shows the countdown while running.
       Today panel: pomodoros done today and total time, a daily goal bar (default 8), and a
       session log (time range, category dot, task).
       Parking lot: a text input to park a stray thought during a session; parked thoughts
       show as chips and appear in the daily review to be cleared.

 Board ( /board )

       Tabs: board, backlog, eisenhower. (Timeline is v2.)
       Sprint header: sprint number, dates, "day x of 14", sprint goal (editable text), story
       points done / committed, a stacked bar, and a velocity warning when committed
       points exceed the average of the last 3 completed sprints ("35 committed vs 31 avg
       velocity. move 4 pts out?").
       Burndown: remaining points per day, an ideal dashed line from committed to zero, and
       today's dot. Drawn with plain SVG.

                                                                                                                                                                                                                                                    Page 5 of 19
main character — product spec & build guide

       Epics: cards for big projects with progress % (done tickets / all tickets in the epic),
       category colour and due date.
       Columns: TO DO, IN PROGRESS, IN REVIEW, DONE. Tickets drag between columns.
       IN PROGRESS has a WIP limit (default 3): at the limit, the header shows "WIP 3/3 ·
       FULL" and dropping a 4th asks "finish something first?" with an override.
       Ticket card: key (category prefix + number, e.g. COL-19, PLC-07, EXP-04, STR-31, OTH-
       05), title, priority icon (high / medium / low), category chip, due date, story points (1, 2,
       3, 5, 8), optional blocked flag with reason, optional subtask progress. Done tickets
       show struck through.
       Ticket detail: clicking a card opens a side panel to edit every field, add subtasks, set
       epic, mark blocked, or delete.
       Filter: chips for all / each category.
       Backlog tab: a list of tickets not in the current sprint, sorted by priority, with "add to
       sprint". Sprint planning: a "start next sprint" button closes the current sprint, records
       its completed points for velocity, and carries unfinished tickets over.
       Eisenhower tab: a 2×2 grid (urgent × important). Urgent = due within 3 days;
       important = priority high or medium. Drag a ticket to change its priority or due date.

 Track ( /track )

       Range switch: day, week (last 7 days). Month is v2.
       Day view: 24 rows (hour, PLANNED, =/≠, ACTUAL). Plan blocks are dashed outlines in
       the category colour; actual blocks are solid fills; leak uses orange diagonal stripes. A ≠
       mark in orange shows where plan and reality differ.
       Week view: a 7 × 24 heatmap of actual slots, today's row highlighted, current hour
       outlined.
       Slot editor: clicking any slot opens a small popover: category buttons (5 + sleep +
       leak), an optional label, and "apply to next N hours". Planned and actual slots edit the
       same way.
       Stickers: plan = reality %, focused hours, leaked hours, peak hours (the 3-hour
       window with the most focus sessions over the last 14 days).
       Time budget: per category, spent / planned weekly hours as bars (weekly targets set
       in settings), plus one line naming the category most behind.
       Pattern card: v1 runs two simple rules and shows the first that fires: (1) the same hour
       was a leak on 3+ of the last 7 days, (2) a category is more than 40% behind its weekly
       budget with 2 or fewer days left. Buttons: "try it tomorrow" (copies a suggested plan

                                                                                                                                                                                                                                                    Page 6 of 19
main character — product spec & build guide

       change into tomorrow) and "not now".

 Money ( /money )

       Stickers: spent today, this week, and safe to spend per day = (monthly budget −
       spent this month) ÷ days left in the month, including today.
       Monthly budget bar: stacked by category with "x% used · y% of the month gone" and
       an "on track" or "running hot" verdict.
       Quick add: amount (numbers only), category chips, optional note, "add it" (Enter
       submits). Default category = the last one used.
       Categories: food & cafés, transport, subscriptions, shopping, outings, study stuff,
       other.
       By category: this month's total per category as bars, plus one no-shame nudge when
       a category passes 30% of the month ("want to try 2 no-spend days?").
       Recent: today and yesterday's entries (time, note, category, amount). Clicking an
       entry edits or deletes it.
       Currency is INR, formatted with Indian grouping (₹7,450).

 Review ( /review )

       Daily (shutdown): three prompts (a win, a lesson, tomorrow's focus), the unfinished
       big 3 with move-to-tomorrow / drop, and parked thoughts to clear.
       Weekly: shown on the day the week ends: plan = reality %, time budget, habits kept,
       money vs budget, and three prompts (what worked, what didn't, one change for next
       week). Saved per ISO week.

 Settings ( /settings )

       Day start hour (default 00:00) and 24h clock (always on in v1).
       Pomodoro: focus, short break and long break lengths; long break every N; daily goal.
       Habits: add, rename, reorder, pick icon and colour, set the tiny version, archive.
       Weekly time budget per category (hours).
       Monthly money budget.
       MVD defaults: the three MVD tasks.
       Reality factor (default 1.4).
       Sprint length (default 14 days) and WIP limit (default 3).
       Export all data as JSON, and sign out.

                                                                                                                                                                                                                                                    Page 7 of 19
main character — product spec & build guide

Quick capture (Ctrl+K)

A centred modal with one text input and four tabs: ticket, task, expense, thought. Typing
and Enter saves to the chosen type with sensible defaults (ticket → backlog, task →
today's big 3 if a slot is free, expense → parses a leading number as the amount, thought →
parking lot). Esc closes.

Techniques behind the features

Each feature exists because of a named project-management technique or psychology
finding. Keep this list in mind when changing a feature: if the change breaks the principle,
the feature stops working.

Technique                                    Type  Where it lives  Rule it imposes
                                             PM    Board
Sprints + sprint goal                                              Work is committed in 2-week boxes
(Scrum)                                      PM    Board           with one stated goal

Story points + velocity                                            Warn when committed points
                                                                   exceed the 3-sprint average
WIP limit (Kanban)                           PM    Board
                                                                   Max 3 tickets in progress; the 4th
Burndown chart                               PM    Board           needs an override

Epics / work breakdown PM                          Board           Show remaining points vs an ideal
                                                                   line every day
Eisenhower matrix                            PM    Board
Time budgeting                                                     Big projects are split into tickets
                                             PM    Track,          with visible % done
Time-boxing
(Parkinson's law)                                  Dashboard       Urgent × important view for triage
Pomodoro technique
                                             PM    Pomodoro        Weekly hour targets per category,
                                                                   spent vs planned
                                             PM    Pomodoro
                                                                   Work happens in fixed 25-minute
Planning fallacy                             Psych Load check      boxes
correction
                                                                   25/5 with a long break every 4
                                                                   sessions

                                                                   Multiply estimates by the reality
                                                                   factor before comparing to free time

                                                                   Page 8 of 19
main character — product spec & build guide

Technique                                    Type Where it lives  Rule it imposes
Eat the frog                                 Psych Big 3          The hardest task is first and tagged
Implementation                               Psych RIGHT NOW      Each block carries an if-then line
intentions
Self-monitoring effect                       Psych Track          Plan and actual always sit side by
                                                                  side
Zeigarnik effect                             Psych Parking lot,
                                                         review   Open loops are written down, then
Never miss twice                                                  cleared at shutdown
                                             Psych Rituals
Minimum viable day                                                One miss shows "save it"; streaks
                                             Psych MVD mode       break only after two misses in a row
No-guilt UX
                                             Psych Everywhere     Bad days shrink to 3 tiny wins
Fresh-start effect                                                instead of zero
                                             Psych Board, Review
Progress principle                                                No red, no "overdue", leaks are
                                             Psych Pomodoro,      neutral stripes
                                                         Review
                                                                  New sprint and new week are
                                                                  framed as clean slates

                                                                  Small wins are counted and shown
                                                                  (session log, daily win)

Design system: "midnight zine"

Dark-only, low-glare ink background with a faint dot grid; chunky display type; tilted
"sticker" labels; hard offset shadows (no blur) on the one or two hero cards per page. No
gradients as decoration, no emoji, no left-border accent cards.

Colours

Token    Hex                                 Use
         #121016
bg                                           Page background (with dot grid: 1 px dots at 6%
         #100E14                             white, 18 px apart)
bg-deep
                                             Sidebar

                                                                                              Page 9 of 19
main character — product spec & build guide

Token          Hex                           Use

surface        #1D1A23 Cards

surface-2      #2A2631 Tracks, empty bars, inputs on cards

line           #3B3546 Card borders (1.5 px)

line-strong #4A4356 Input and ghost-button borders

text           #F3EFE7 Primary text

text-soft      #D9D3E2 Secondary body text

muted          #ABA3B8 Labels, meta text

lime           #CDF56A Primary action, "now", success, active nav

ink            #121016 Text on any coloured fill

college        #B8A6FF Lilac; also the secondary accent for shadows

placement      #86CBFF Sky blue

exploration #FF8FB8 Pink

startup        #FFA36C Tangerine; also leaks and warnings

other          #8F87A0 Grey-violet

sleep          #2A2631 Same as surface-2

Leak pattern: repeating-linear-gradient(135deg, rgba(255,163,108,0.35) 0 2px,
transparent 2px 7px) over surface , with a 1.5 px tangerine border.

Type

Role                Font                          Size / weight
Display (page                                     60 px / 800, line-height 0.92, letter-spacing
titles)             Bricolage                     −0.04em, lowercase
Card titles         Grotesque                     20–22 px / 800

Big numbers         Bricolage                     30–52 px / 800, tabular numbers on timers
                    Grotesque

                    Bricolage
                    Grotesque

                                                                                                 Page 10 of 19
main character — product spec & build guide

Role  Font                                   Size / weight

Body  Inter                                  13–16 px / 500–600

Labels, times, keys JetBrains Mono           10.5–12 px / 600, uppercase labels with 0.08em
                                             tracking

All three load from Google Fonts.

Shape and spacing

     Radius: cards 20 px, hero cards 24–28 px, buttons 14 px, chips 999 px, small tags 6–8
     px.
     Spacing scale: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 32 px. Page gaps 24 px; grid gaps 22 px.
     Hard shadows: 4–8px 4–8px 0 in lilac (on lime elements) or lime (on outlined hero
     cards). Never more than two per screen.
     Stickers: mono 11 px uppercase on a solid fill, padding 6 px 11 px, radius 8 px, rotated
     −4° to +4°, overlapping the top edge of their card by 13 px.
     Hit targets at least 44 px. Text contrast at least 4.5:1.

Components

     Primary button: lime fill, ink text, 800 weight, hard lilac shadow.
     Ghost button: transparent, 2 px line-strong border.
     Segmented control: surface pill with 4 px padding; the active segment is text fill
     with ink text (lilac for the MVD segment).
     Category chip: category fill, ink text, 11–12.5 px, 700. Unselected filter chips are
     outlined in line-strong .
     Checkbox: 30 px rounded square with a 2 px #7A7188 border; checked = lime fill with
     an ink tick.
     Habit toggle: 54 px circle; done = habit colour fill; missed yesterday = 2.5 px dashed
     tangerine ring.
     Bars: 8–14 px tall, radius 4 px, surface-2 track.
     Nav item: 44 px tall, radius 12 px; active = lime fill with ink text.

                                             Page 11 of 19
main character — product spec & build guide

Voice

Lowercase, short, warm, a little Gen Z, never scolding. Examples: "main character hours,
rutuja.", "lock in", "tight but doable", "rough day? 3 tiny wins, then rest.", "no judgement."

Data model (Firestore)

All data sits under users/{uid} , so one security rule protects everything. One document
per day holds that day's plan, actuals, big 3, habits and journal, which keeps the dashboard
to a handful of reads. Dates are local YYYY-MM-DD strings computed with the user's day-
start hour; weeks are ISO YYYY-Www .

Path                                         Key fields

users/{uid}                                  name , email , createdAt , dayStartHour (0),
                                             pomodoro {focus 25, short 5, long 15, longEvery 4,
users/{uid}/days/{date}                      dailyGoal 8}, weeklyBudgetHours {college,
                                             placement, exploration, startup}, monthlyBudget
users/{uid}/habits/{id}                      (INR), mvdTasks [3 strings], realityFactor (1.4),
users/{uid}/tickets/{id}                     sprintLengthDays (14), wipLimit (3),
                                             ticketCounters {COL, PLC, EXP, STR, OTH},
users/{uid}/sprints/{id}                     activeTimer (see below)
users/{uid}/epics/{id}
                                             plan and actual : maps of hour "0"–"23" → { cat ,
                                             label , ifThen ?}; big3 : array of 3 { id , title ,
                                             cat , estMin , done , ticketId ?}; mvd (bool);
                                             mvdDone [3 bools]; habits : map habitId → "full" or
                                             "tiny"; journal { win , lesson , tomorrow }

                                             name , icon , color , tiny , order , archived

                                             key , title , cat , points , priority
                                             (high/med/low), status
                                             (todo/progress/review/done), sprintId ?,
                                             epicId ?, due ?, blocked , blockedReason ,
                                             subtasks [{text, done}], createdAt , doneAt ?

                                             number , start , end , goal , status
                                             (active/closed), completedPoints (set on close)

                                             name , cat , due

                                                                                                  Page 12 of 19
main character — product spec & build guide

Path                                         Key fields

users/{uid}/sessions/{id}                    date , start , end (timestamps), minutes ,
                                             taskTitle , cat , ticketId ?

users/{uid}/expenses/{id}                    date , ts , amount (whole rupees), cat , note

users/{uid}/parked/{id}                      text , createdAt , cleared

users/{uid}/weeks/{isoWeek} worked , didnt , change

Active timer ( users/{uid}.activeTimer , mirrored to localStorage): mode , endsAt (ms)
while running or remainingMs while paused, session (1–4), taskId , cat . Remaining
time is always endsAt − Date.now() .

Derived metrics (computed in the browser, never stored)

Metric            Formula

Plan = reality %  hours where plan.cat = actual.cat ÷ hours where
                  both are set

Focused hours     sum of session minutes ÷ 60

Leaked hours      count of actual slots with cat = leak

Load check        sum(big3 estMin, not done) × realityFactor vs free
                  hours left today

Velocity          mean completedPoints of the last 3 closed sprints

Burndown          committed points − points of tickets with doneAt
                  on or before each sprint day

Habit streak      consecutive days done, where a single missed day
                  is forgiven and MVD days count if the tiny version
                  was done

Safe to spend / day (monthlyBudget − spent this month) ÷ days left
                               including today

Epic progress     done tickets ÷ all tickets in the epic

                                                                                            Page 13 of 19
main character — product spec & build guide

Tech stack and architecture

A static React single-page app talks straight to Firebase; there is no custom server.
Firebase Auth handles Google sign-in, Firestore stores the data, and Vercel serves the
built files for free. Both Firebase and Vercel free tiers comfortably cover one heavy user.

Layer     Choice                                  Why
Build
Styling   Vite + React 18 + TypeScript            Fast, simple, no server code

Routing   Tailwind CSS with the design tokens in  Tokens in one place, no CSS
Auth                                              sprawl
Data      tailwind.config

Dates     React Router                            Seven routes, nothing fancy
Drag and
drop      Firebase Auth, Google provider (popup) Google login with zero backend
Charts
Hosting   Cloud Firestore with offline persistence Real-time, per-user, works
                                                                       through flaky Wi-Fi

          date-fns                                Small, reliable date maths

          @dnd-kit/core                           Accessible board dragging

          Hand-drawn divs and SVG                 No chart library needed
          Vercel (Netlify works the same)         Free, deploys from GitHub

No Redux, no React Query, no server functions. State = Firestore listeners in a few small
hooks ( useUserDoc , useDay(date) , useCollection(name, query) ) plus React local
state.

                                                                                            Page 14 of 19
main character — product spec & build guide

Folder structure

src/

main.tsx, App.tsx                            routes + auth gate

lib/firebase.ts                              init, auth, db, offline cache

lib/dates.ts                                 dayKey(), isoWeek(), 24h formatting, day-start

offset

lib/metrics.ts                               pure functions for every derived metric (unit

tested)

lib/defaults.ts                              default settings, categories, habits, seed data

hooks/                                       useAuth, useUserDoc, useDay, useCollection,

useTimer, useNow

components/ui/                               Button, Card, Chip, Sticker, Segmented,

Checkbox, Bar, Modal, Popover

components/layout/                           Sidebar, PageShell, QuickCapture

pages/                                       Dashboard, Focus, Board, Track, Money, Review,

Settings, Login

types.ts                                     all Firestore document types

Robustness rules (non-negotiable)

  1. Every Firestore read has a loading state and an empty state; a missing day document
     means "empty day", never a crash.

  2. Every write goes through one small helper with try/catch and a toast on failure;
     optimistic UI is fine because offline persistence queues writes.

  3. One React error boundary per page, showing "something broke on this page" with a
     reload button; the sidebar keeps working.

  4. The timer is timestamp-based ( endsAt ), saved to Firestore and localStorage, and
     restored on load. It must survive refresh, sleep and a closed tab.

  5. useNow() ticks once a minute for clocks and once a second only on /focus while
     running.

  6. All derived metrics are pure functions in lib/metrics.ts with unit tests (Vitest),
     including divide-by-zero cases.

  7. TypeScript strict mode, no any . npm run build and npm run lint must pass before
     every commit.

  8. First sign-in creates the user document with defaults and 5 starter habits; nothing
     assumes data exists.

                                                                                          Page 15 of 19
main character — product spec & build guide

 Firestore security rules

     rules_version = '2';
     service cloud.firestore {

        match /databases/{db}/documents {
            match /users/{uid}/{document=**} {
               allow read, write: if request.auth != null && request.auth.uid == uid;
            }

        }
     }

 Deployment

    1. Create a Firebase project, enable Authentication → Google, and create a Firestore
       database in a region near Pune (asia-south1, Mumbai).

    2. Paste the security rules above into Firestore → Rules and publish.
    3. Put the web config in .env.local as VITE_FIREBASE_API_KEY ,

        VITE_FIREBASE_AUTH_DOMAIN , VITE_FIREBASE_PROJECT_ID , VITE_FIREBASE_APP_ID
       (and the same four in Vercel → Project → Environment Variables).
    4. Push to GitHub, import the repo in Vercel (framework: Vite), deploy.
    5. Add the Vercel domain to Firebase → Authentication → Settings → Authorized
       domains.
    6. Add vercel.json with a rewrite of all paths to /index.html so deep links like
        /board work on refresh.

 Build plan

  Build in 8 phases, each ending with a working app, a passing build and a git commit. Don't
  start a phase until the previous one passes its check.

    1. Foundation. Vite + React + TS + Tailwind with design tokens, fonts, dot-grid
       background, UI components, sidebar shell, all 7 routes as placeholders, Firebase init,
       Google sign-in, login page, user document created with defaults on first sign-in. Done
       when: you can sign in, see the sidebar, move between empty pages, sign out, and
       refresh on /board without a 404.

    2. Days and tracking. useDay , slot editor popover, Track day view (plan vs actual), week
       heatmap, dashboard 24h strip. Done when: you can plan and log hours, and they show
       identically on Track and the dashboard after a refresh.

                                                                                                                                                                                                                                                  Page 16 of 19
main character — product spec & build guide

    3. Dashboard core. RIGHT NOW card with if-then, big 3 with the frog, up next, load
       check, rituals with streaks and "save it", MVD mode switch and banner. Done when:
       the dashboard works with an empty day and with a full day, and MVD swaps tasks and
       habits.

    4. Pomodoro. /focus with the timestamp timer, task picker, category override, session
       log, daily goal, parking lot, auto-fill of the actual slot, tab title countdown, chime. Done
       when: a running timer survives a refresh and a 10-minute laptop sleep, and a finished
       session appears in the log and on Track.

    5. Board. Tickets CRUD with side panel, drag between columns, WIP limit, sprints (start,
       close, carry over), velocity warning, burndown, epics, backlog tab, Eisenhower tab,
       category filter, dashboard sprint snapshot. Done when: you can run a full sprint from
       start to close and the burndown and velocity are correct.

    6. Money. Quick add, totals, safe-to-spend, budget bar, category bars, nudge, recent list
       with edit and delete, dashboard spent-today. Done when: adding, editing and deleting
       expenses updates every number instantly.

    7. Review, settings, capture. Daily and weekly review, every settings field, habit
       management, JSON export, Ctrl+K quick capture, track stickers, time budget and
       pattern card. Done when: every setting changes the behaviour it names.

    8. Polish and ship. Empty states everywhere, error boundaries, toasts, keyboard focus
       styles, unit tests for lib/metrics.ts , Lighthouse check, vercel.json , deploy. Done
       when: the deployed URL works end to end with a fresh Google account.

 Claude Code prompt

  Set up the folder first, then paste the prompt below into Claude Code from inside it.

    1. Create an empty folder (for example main-character ) and run git init .
    2. Export this doc as Markdown and save it as docs/SPEC.md .
    3. Unzip design-reference.zip (sent alongside this doc) into design-reference/ .
    4. Open Claude Code in the folder and paste:

     You are building "main character" (short name: mc.), a desktop-first personal
     planner web app: dashboard, pomodoro focus room, Jira-style sprint board,
     hour-by-hour tracker, money tracker, review and settings. It is my personal
     project, but anyone can sign in with Google and get their own private data.

     Read these first, in this order:
     1. docs/SPEC.md: the full product spec (features, design system, data model,

                                                                                                                                                                                                                                                  Page 17 of 19
main character — product spec & build guide

     stack, build plan). It is the source of truth for behaviour.
     2. design-reference/*.dc.html: the approved mockups (Desk-Today = dashboard,
     Desk-Pomodoro, Desk-Board, Desk-Track, Desk-Money). They use a templating
     format ({{holes}}, <sc-for>, <sc-if>, a Component class) that you must NOT
     copy or run. Use them only to match layout, spacing, colours, type, copy and
     states exactly, and rebuild them as React + Tailwind components.

     Stack (do not add anything else without asking me):
     Vite, React 18, TypeScript (strict), Tailwind CSS, React Router, Firebase
     Auth (Google) + Cloud Firestore with offline persistence, date-fns, @dnd-
     kit/core, Vitest. No custom backend, no server functions, no Redux, no React
     Query, no UI kit, no chart library. Deploy target: Vercel.

     How to work:
     - Follow the 8 phases in the spec's "Build plan", one at a time. At the start
     of each phase, tell me in a few lines which files you'll create or change. At
     the end of each phase, run npm run build, npm run lint and npm test, fix
     every error, commit with a clear message, and tell me how to check that
     phase's "Done when" myself. Then stop and wait for my go-ahead.
     - Keep the code simple and boring: small components, a few small hooks
     (useAuth, useUserDoc, useDay, useCollection, useTimer, useNow), and pure
     functions for every metric in src/lib/metrics.ts with unit tests. Readable
     beats clever. No premature abstraction, no generic "engine" code.
     - The app must never crash: loading and empty states everywhere, a missing
     Firestore document means empty data, every write wrapped in try/catch with a
     toast, and one error boundary per page.
     - The pomodoro timer must be timestamp-based (store endsAt or remainingMs,
     never decrement a counter), saved to Firestore and localStorage, and restored
     on load so it survives refresh and laptop sleep.
     - Use the exact colour tokens, fonts (Bricolage Grotesque, Inter, JetBrains
     Mono), copy and voice from the spec and mockups. Dark theme only. 24h clock
     everywhere. Currency INR with Indian digit grouping.
     - Firestore layout and security rules exactly as in the spec: everything
     under users/{uid}.
     - On first sign-in, create the user document with the default settings and 5
     starter habits (move, breathe, piano, language, read).
     - Skip the AI layer completely. Only create an empty src/ai/README.md that
     says where AI features will plug in later.
     - Create .env.example with the four VITE_FIREBASE_* keys and tell me exactly
     where to find each value in the Firebase console. Never commit .env.local.
     - Create a short CLAUDE.md with these working rules and the stack, so future
     sessions follow them.

                                                                                                                                                                                                                                                  Page 18 of 19
main character — product spec & build guide

     - When the spec is ambiguous, pick the simplest option that matches the
     mockups, log it in docs/DECISIONS.md, and keep going instead of asking.
     Start with phase 1.

  After phase 8, follow the Deployment steps above to put it live on Vercel.

                                                                                                                                                                                                                                                  Page 19 of 19
