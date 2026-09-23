# HackGPT Integration Architecture

NEXVARY integrates HackGPT Enterprise by API, not by copying its core into the Android APK.

## Modes

### Training
- offline;
- no INTERNET permission;
- 100 NEXVARY labs;
- HackGPT lectures, methodology and report-reading exercises are simulated.

### Enterprise
- connects to the NEXVARY Security Gateway only;
- intended for NEXVARY-owned or explicitly authorized company assets;
- requires asset ID, written-authorization ID, approved profile, target allowlist and operator confirmation;
- the gateway maintains audit records and forwards only approved assessment profiles to HackGPT.

## Governance controls

1. Asset inventory ID is mandatory.
2. Written authorization reference is mandatory.
3. Public targets are denied by default.
4. Only pre-approved assessment profiles are accepted.
5. Post-exploitation and arbitrary command execution are not exposed through the Android integration.
6. Every validation, assessment start and report request is written to an append-only JSONL audit stream.
7. Production deployment should place both HackGPT and the gateway on NEXVARY-controlled infrastructure.

## HackGPT attribution and license

The integration targets HackGPT Enterprise by Yashab Alam / HackGPT Enterprise Team. Review the upstream LICENSE before deployment. NEXVARY does not remove upstream copyright or license notices.
