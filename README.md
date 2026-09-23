# NEXVARY Meta Security — HackGPT Integration

Android cybersecurity training and enterprise-assessment companion for NEXVARY.

## Build flavors

### Training APK
- package: `com.nexvary.metasecuritylab`
- version: **2.61.0**
- 100 simulated labs across 10 tracks
- expanded HackGPT cybersecurity lectures
- Arabic + English, RTL/LTR
- **no INTERNET permission**
- fully offline

### Enterprise APK
- package: `com.nexvary.metasecuritylab.enterprise`
- version: **2.61.0-enterprise**
- includes everything in Training
- connects through a native bridge to the **NEXVARY HackGPT Read-Only Connector**
- can register authorization/governance records
- can view HackGPT health, session status, and reports
- does **not** expose direct exploit execution from Android

## HackGPT architecture

HackGPT Enterprise runs separately on NEXVARY-controlled infrastructure. The Android Enterprise build talks only to the NEXVARY connector, while live assessment execution remains in the operator-controlled HackGPT console after scope and written authorization are reviewed.

See:

- `HACKGPT_INTEGRATION.md`
- `THIRD_PARTY_NOTICES.md`
- `enterprise-connector/README.md`

## Governance

Real company testing should record:

- NEXVARY asset ID;
- written authorization reference;
- owner/team;
- approved scope;
- maintenance window;
- assessment operator;
- remediation owner and retest record.

## Android security boundary

- Target SDK: Android 15 / API 35
- Minimum SDK: API 24
- WebView external requests are blocked
- Enterprise network requests use the native connector only
- connector requires HTTPS in normal builds
- Training flavor has no Internet permission
- Backup disabled
- Cleartext traffic disabled

## Upstream HackGPT

This repository integrates with HackGPT Enterprise by API/read-only connector rather than copying its core into the APK. Review the upstream HackGPT license before deployment and preserve required attribution.
