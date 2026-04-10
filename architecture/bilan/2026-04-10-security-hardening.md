# 2026-04-10 Security Hardening

## Scope

- Production web container headers
- Public APK delivery safety
- Release/deployment guidance alignment

## Changes

- Hardened `nginx.conf` with:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `X-Frame-Options: DENY`
  - `server_tokens off`
- Kept explicit APK attachment headers for `/downloads/*.apk`
- Updated the README security notes to reflect the production container posture

## Why

The public landing and dashboard app are moving toward an external pilot release. The container now ships safer default browser protections without replacing the existing 3D landing direction or changing the release-manifest download flow.

## Operational note

The current pilot still serves the Android APK from the public web app. If artifact size becomes a problem later, `mobile-release.json` can point at external object storage without redesigning the landing page.
