# NEXVARY Meta Security Lab — Stage 80

This milestone continues the Android project from the first installable build through Stage 80. Stages are grouped into implementation waves rather than artificial one-commit-per-number churn.

## Stage map

| Stages | Delivered |
|---|---|
| 2–8 | Android navigation reliability, RTL cleanup, mobile spacing, safe offline constraints, back behavior review |
| 9–15 | Dashboard information architecture, progress model, track organization, researcher workflow |
| 16–20 | NEXVARY dark navy / metallic silver / royal gold design system and responsive layout |
| 21–28 | Advanced search, difficulty filtering, historical/synthetic filtering, track filters, status filters |
| 29–35 | Favorites, incomplete/completed views, random lab, continue last lab, local state persistence |
| 36–40 | 100-lab curriculum modularization and track-specific root-cause/remediation content |
| 41–48 | Vulnerable-vs-patched training mode, simulated HTTP request/response comparison, security signals |
| 49–55 | Hints, diagnostic quiz engine, score persistence, completion rules and defensive explanations |
| 56–62 | Researcher notes, per-lab local notebook, previous/next navigation and resume workflow |
| 63–68 | XP, rank, streak, track progress meters and achievement system |
| 69–70 | Offline glossary and learning support |
| 71–75 | Multi-view Android UI: Dashboard / Labs / Glossary / About, social/contact information, reset controls |
| 76 | WebView hardening and Android Back integration |
| 77 | Versioning moved to versionCode 80 / versionName 1.80.0 |
| 78 | Manifest hardening, backup disabled, cleartext disabled, RTL retained |
| 79 | Branded NEXVARY launcher vector icon |
| 80 | CI Release Gate: JavaScript syntax, exact 100-lab count, no INTERNET permission, Android 15 build and APK verification |

## Stage 80 release gate

A Stage 80 build is acceptable only when all of the following pass:

- JavaScript syntax validation for the training engine and curriculum.
- Curriculum evaluates to exactly 100 labs and 10 tracks.
- AndroidManifest contains no INTERNET permission.
- Target SDK remains Android 15 / API 35.
- MainActivity and all offline assets are present.
- Gradle `:app:assembleDebug` succeeds.
- Generated APK exists and is non-empty.
- SHA-256 is printed by CI.
- APK is uploaded as a GitHub Actions artifact.

## Safety architecture

This application is deliberately an offline training environment. It contains simulated users, tokens, requests and responses. It does not scan Meta/Facebook/Instagram/WhatsApp or any external host.
