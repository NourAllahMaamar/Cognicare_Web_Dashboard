# Android Pilot Build Guide

## Build the APK

```bash
cd /Users/mac/pim/cognicare/frontend
flutter pub get
flutter build apk --release --split-per-abi
```

Recommended pilot artifact:

```text
/Users/mac/pim/cognicare/frontend/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
```

## Publish it on the public website

1. Read the current mobile app version from `pubspec.yaml`.
2. Copy the APK into the public website downloads folder with a versioned filename:

```bash
cp /Users/mac/pim/cognicare/frontend/build/app/outputs/flutter-apk/app-arm64-v8a-release.apk \
  /Users/mac/pim/cognicareweb/public/downloads/cognicare-android-v1.0.0-arm64-v8a.apk
```

3. Update `/Users/mac/pim/cognicareweb/public/mobile-release.json`:
   - set `android.available` to `true`
   - set `android.version`
   - set `android.downloadUrl` to `/downloads/cognicare-android-v1.0.0-arm64-v8a.apk`
   - update release notes if needed

4. Rebuild and redeploy `cognicareweb`.

## Important notes

- Do not hardcode APK links in `LandingPage.jsx`; the site reads `mobile-release.json`.
- The universal APK exceeded normal git-friendly size during release prep, so the pilot website uses the `arm64-v8a` build by default.
- Keep old APK files until the new version is verified so rollback is one manifest edit away.
- If the APK becomes too large for your git workflow, move the file to external hosting and keep the same manifest contract.

## Related docs

- `/Users/mac/pim/project-architecture/PUBLIC_PILOT_RELEASE_RUNBOOK.md`
- `/Users/mac/pim/cognicareweb/public/mobile-release.json`
