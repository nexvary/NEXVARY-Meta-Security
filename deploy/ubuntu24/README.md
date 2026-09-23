# NEXVARY Hardened HackGPT Deployment — Ubuntu 24.04

This deployment is designed for a NEXVARY-controlled Ubuntu 24.04 server.

## Network architecture

```text
Enterprise Android APK
        |
        | HTTPS 443
        v
Nginx / security-gateway.nexvary.com
        |
        | localhost:8787
        v
NEXVARY Read-Only Connector
        |
        | Docker private network
        v
HackGPT API :8000
        |
   +----+----+
   |         |
PostgreSQL Redis
```

HackGPT API, PostgreSQL, Redis, and the Connector do not expose their service ports to the LAN. Only Nginx should listen on 443.

## Prerequisites

- Ubuntu 24.04.
- At least 4 GB RAM and 20 GB disk for HackGPT minimum requirements; more RAM/storage is preferable for larger workloads.
- A DNS name. The packaged Android build uses:
  `security-gateway.nexvary.com`
- A valid TLS certificate for that hostname.
- Explicit written authorization for every system tested.

## Install

Clone the NEXVARY repository on the Ubuntu server, then:

```bash
cd NEXVARY-Meta-Security
sudo -E env NEXVARY_FQDN=security-gateway.nexvary.com \
  bash deploy/ubuntu24/install.sh
```

The installer:
- installs Docker, Docker Compose v2, Nginx and utilities;
- clones/updates HackGPT Enterprise;
- generates random database, Redis, JWT, application and gateway secrets;
- starts HackGPT API on localhost only;
- starts the NEXVARY connector on localhost only;
- enables HTTPS reverse proxy when the TLS certificate exists;
- installs daily encrypted-boundary backups of database/connector state;
- installs a health-check command.

## Health check

```bash
sudo NEXVARY_FQDN=security-gateway.nexvary.com nexvary-security-health
```

## Operator access to HackGPT

The mobile application deliberately does not start live assessments.

For operator administration, use SSH and the HackGPT console/API on the server. If a web dashboard is enabled later, expose it only through VPN or an SSH tunnel rather than directly to the LAN/Internet.

## Configure AI

Edit:

```bash
sudo nano /opt/nexvary-security/deploy/.env
```

Set one approved provider or a local model. Then:

```bash
cd /opt/nexvary-security/deploy
sudo docker compose --env-file .env -f compose.yaml up -d --build
```

## Gateway token

The Enterprise APK asks for the gateway token when accessing HackGPT status/reports. Retrieve it on the server:

```bash
sudo grep '^NEXVARY_GATEWAY_TOKEN=' /opt/nexvary-security/deploy/.env
```

Do not send that token through chat or store it in source control.

## TLS

For production, use a certificate trusted by Android for `security-gateway.nexvary.com`. If using an internal CA, provision it through your organization's managed-device trust policy rather than disabling certificate verification.

## Update

```bash
cd /path/to/NEXVARY-Meta-Security
git pull
sudo -E env NEXVARY_FQDN=security-gateway.nexvary.com \
  bash deploy/ubuntu24/install.sh
```
