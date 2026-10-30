# Betterhood Physio (native app)

An Expo / React Native shell around the physio journey, which is built as a web flow in
`../betterhood-website-revamp` at **`/physio-app/`**. The app is a single full-screen WebView plus the
native pieces a web page can't do on its own.

```
betterhood-website-revamp/src/components/physio-app/   ← all screens and logic (React, in the Astro site)
physio-journey-app/src/app/index.tsx                   ← WebView host
physio-journey-app/src/lib/bridge.ts                   ← native side of the message bridge
```

## Run it

```bash
# 1. the website, reachable from your phone on the same Wi-Fi
cd ../betterhood-website-revamp
npm run dev:app            # astro dev --host → http://<your-LAN-IP>:4321/physio-app/

# 2. the app
cd ../physio-journey-app
npm install
npx expo start             # scan the QR code with Expo Go, or press a / i
```

In development the app loads the Astro dev server on the same machine as Metro (it reads the host from
`expoConfig.hostUri`), so edits to the web flow hot-reload inside the app. To point at a deployed site
instead, set `EXPO_PUBLIC_WEB_URL=https://staging.example.com/physio-app/`. Release builds default to
`https://betterhood.in/physio-app/`.

The page also works in any browser: open `http://localhost:4321/physio-app/?invite=ps-48k2`.

## What the shell does

| | |
| --- | --- |
| Android back button | Walks back through the flow (screens are hash routes, so the WebView history is the back stack) |
| Links outside `/physio-app/` | Open in the system browser (articles, public profiles, terms, WhatsApp) |
| `share` message | Native share sheet (profile link, refer a peer) |
| `haptic` message | Light tap / success / warning feedback |
| `notify` message | Buzz; the page shows the in-app banner. System push comes later via `expo-notifications` |
| `window.BH_NATIVE` | Injected before load with `{ platform, version }` |
| Invite deep link | `betterhoodphysio://join/<token>` → opens the flow with `?invite=<token>` |

Try the deep link: `npx uri-scheme open "betterhoodphysio://join/ps-48k2" --android` (or `--ios`).

## The journey

Four tabs (**Today**, **Studio**, **Network**, **Me**) after a short onboarding:

- **Intro**: three auto-advancing stories built from the physio's own listing (verified card, search result, article byline). Tap to skip, hold to pause.
- **Phone**: number, consent and OTP on one screen. The code auto-submits and accepts paste or SMS autofill.
- **Claim**: invites land on the matching listing; anyone else can search the directory or start fresh.
- **Badge**: one document. Photo quality is checked on the device (size, resolution, blur) before upload. This step can be skipped and finished later.
- **Today**: one "next up" card that always shows the single most useful action, plus Verified → Listed → Published progress.
- **Me**: the profile as patients see it. Gaps are filled inline, each edit autosaves, and "Next: <field>" leads to the next gap. Includes a QR/share kit.
- **Studio**: unlocks once listed. Reviews open in a reader where you tap a paragraph to leave a note; approving needs a press-and-hold, and only after 85% has been read. Ideas go through a composer that blocks patient details (PII) and shows similar existing articles, then a tracker runs from submitted to published.
- **Network**: search peers by city and focus, save them, refer patients.

## Demo mode

There is no backend yet, so state lives in the page's `localStorage` (`bh-physio-app:v2`). The work admins and
editors would do in WordPress (verify, return an edited article, accept an idea…) is in **Backstage**, the small
tab on the right edge. It also jumps to any stage and switches light/dark theme. Any 6-digit OTP works, and invite
`ps-48k2` matches a real directory listing. Set `PUBLIC_PHYSIO_APP_DEMO=false` in the website's `.env` to hide
Backstage. Use **Sign out** on the Me tab to start over.

## Still to do before a store release

- Backend for the calls in `store.ts → api` (OTP, listing match, document upload, assignments, decisions)
- Push notifications (`expo-notifications`) for verification decisions, assignments and reminders (day 1/3/7)
- App links so `https://betterhood.in/join/<token>` opens the app (`assetlinks.json` / `apple-app-site-association`
  on the site, plus `intentFilters` / `associatedDomains` in `app.json`)
- Icons and splash in Betterhood branding (`assets/`)
- `eas build` profiles
