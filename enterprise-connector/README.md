# NEXVARY HackGPT Read-Only Connector

This connector integrates NEXVARY Meta Security with HackGPT Enterprise without exposing live pentest execution through the Android application.

It provides:

- HackGPT health status;
- read-only session listing;
- read-only report retrieval;
- NEXVARY authorization-record storage;
- append-only audit logging.

Starting or changing real assessments remains in the operator-controlled HackGPT console after scope and written authorization have been reviewed.

## Run

```bash
cd enterprise-connector
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export NEXVARY_GATEWAY_TOKEN='replace-me'
export HACKGPT_BASE_URL='http://127.0.0.1:8000'
python connector.py
```

For production, place this service behind an internal TLS reverse proxy and keep it reachable only from the NEXVARY management network.
