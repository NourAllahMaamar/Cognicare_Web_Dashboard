# Mobile App APK Build Guide

## Build Flutter APK for Web Download

### Step 1: Navigate to Flutter Project

```bash
cd ../cognicare/frontend
```

### Step 2: Install Dependencies

```bash
flutter pub get
```

### Step 3: Build Release APK

```bash
flutter build apk --release
```

The APK will be created at:
```
build/app/outputs/flutter-apk/app-release.apk
```

### Step 4: Copy to Webapp Downloads

```bash
# From cognicare/frontend directory
cp build/app/outputs/flutter-apk/app-release.apk \
   ../../cognicareweb/public/downloads/cognicare-app.apk
```

### Step 5: Commit and Push

```bash
cd ../../cognicareweb
git add public/downloads/cognicare-app.apk
git commit -m "Add mobile app APK for download"
git push origin main
```

## Alternative: Upload to Cloud Storage

If APK is too large for GitHub (>100MB), upload to:
- Google Drive (with public link)
- AWS S3
- Firebase Storage

Then update the download link in `src/pages/home/LandingPage.jsx`.

## Troubleshooting

### Build fails
```bash
flutter clean
flutter pub get
flutter build apk --release
```

### APK too large
- Enable code shrinking in `android/app/build.gradle`
- Use app bundles instead: `flutter build appbundle`
- Upload to external storage

### Signature issues
Ensure `android/app/build.gradle` has signing config for release.
