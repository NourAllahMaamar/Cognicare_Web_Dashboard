# 2026-04-09 — Public pilot release preparation

## Scope

- Preserved the active 3D landing page as the public CogniCare entrypoint.
- Added a manifest-driven Android download flow on the landing page.
- Added `public/mobile-release.json` as the source of truth for Android/iOS release status.
- Served a versioned Android APK from `public/downloads/`.
- Tightened Docker/nginx/Render config so the public site can serve SPA routes and APK downloads together.
- Updated the dashboard assistant drawer to use explicit refresh mode instead of a synthetic refresh prompt.

## Public release contract

- Landing page source: `src/pages/home/LandingPage.jsx`
- Android release manifest: `public/mobile-release.json`
- Android artifact path pattern: `public/downloads/cognicare-android-v<version>-arm64-v8a.apk`
- Runtime/build env keys:
  - `VITE_BACKEND_ORIGIN`
  - `VITE_PUBLIC_SITE_ORIGIN`

## Notes

- The pilot website currently publishes the `arm64-v8a` Android APK because the universal release build exceeded normal git-hosting size limits.
- iOS remains intentionally unavailable until App Store distribution is set up.
- Detailed operator steps live in `/Users/mac/pim/project-architecture/PUBLIC_PILOT_RELEASE_RUNBOOK.md`.
