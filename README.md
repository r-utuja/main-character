# main character (mc.)

A desktop-first personal planner: dashboard, pomodoro focus room, sprint board, hour tracker, money, review and settings. Sign in with Google and get your own private workspace.

Spec: [docs/SPEC.md](docs/SPEC.md). Decisions log: [docs/DECISIONS.md](docs/DECISIONS.md). Working rules for Claude: [CLAUDE.md](CLAUDE.md).

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the four VITE_FIREBASE_* values
npm run dev
```

Scripts: `npm run build`, `npm run lint`, `npm test`.

## Firebase setup

1. [Firebase console](https://console.firebase.google.com) → create a project.
2. Build → Authentication → Sign-in method → enable **Google**.
3. Build → Firestore Database → create a database in `asia-south1` (Mumbai). Then Rules → paste [firestore.rules](firestore.rules) → Publish.
4. Project settings (gear icon) → General → Your apps → add a **Web** app (`</>`). Under "SDK setup and configuration" choose **Config** and copy:

| `.env.local` key | Config field |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

`.env.local` is git-ignored. Never commit it.

## Deploy (Vercel)

1. Push to GitHub, import the repo in Vercel (framework preset: Vite).
2. Add the same four `VITE_FIREBASE_*` variables under Project → Settings → Environment Variables.
3. After the first deploy, add the Vercel domain in Firebase → Authentication → Settings → **Authorized domains**.
4. `vercel.json` already rewrites every path to `/index.html`, so deep links like `/board` survive a refresh.
