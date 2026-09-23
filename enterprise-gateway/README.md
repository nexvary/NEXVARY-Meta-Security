# NEXVARY Security Gateway — HackGPT Integration

This service is the controlled boundary between NEXVARY Meta Security and HackGPT Enterprise.

## Why a gateway

The Android training flavor remains offline. The Enterprise flavor can talk only to this gateway. The gateway enforces:

- explicit written-authorization ID;
- company asset ID;
- target allowlist;
- approved non-destructive profiles only;
- audit logging;
- no arbitrary shell-command endpoint;
- no post-exploitation profile;
- no public target by default.

## Supported profiles

- `discovery`
- `web-safe`
- `api-safe`
- `configuration`
- `compliance`

These are intentionally narrower than HackGPT's full feature set.

## Run

```bash
cd enterprise-gateway
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# export the variables from .env with your preferred secret manager
python gateway.py
```

Run HackGPT Enterprise separately in API mode and point `HACKGPT_BASE_URL` to it.

For production, put the gateway behind an internal TLS reverse proxy and use the Enterprise Android build with the gateway hostname configured at build time.

## API

- `GET /api/v1/health`
- `POST /api/v1/validate-scope`
- `POST /api/v1/assessments`
- `GET /api/v1/assessments/<id>`
- `GET /api/v1/reports/<id>`

All routes except health require `X-Nexvary-Token` when `NEXVARY_GATEWAY_TOKEN` is configured.
