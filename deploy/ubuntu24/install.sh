#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo -E bash $0"
  exit 1
fi

NEXVARY_ROOT="${NEXVARY_ROOT:-/opt/nexvary-security}"
FQDN="${NEXVARY_FQDN:-security-gateway.nexvary.com}"
TLS_CERT="${NEXVARY_TLS_CERT:-/etc/letsencrypt/live/$FQDN/fullchain.pem}"
TLS_KEY="${NEXVARY_TLS_KEY:-/etc/letsencrypt/live/$FQDN/privkey.pem}"
SOURCE_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "[1/8] Installing Ubuntu packages"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y   ca-certificates curl git nginx openssl python3 python3-venv docker.io docker-compose-v2

systemctl enable --now docker nginx

echo "[2/8] Preparing NEXVARY directories"
install -d -m 0750 "$NEXVARY_ROOT" "$NEXVARY_ROOT/deploy"
rsync -a --delete "$SOURCE_DIR/deploy/ubuntu24/" "$NEXVARY_ROOT/deploy/"
rsync -a --delete "$SOURCE_DIR/enterprise-connector/" "$NEXVARY_ROOT/enterprise-connector/"

if [[ ! -d "$NEXVARY_ROOT/HackGpt/.git" ]]; then
  echo "[3/8] Cloning HackGPT Enterprise"
  git clone --depth 1 https://github.com/yashab-cyber/HackGpt.git "$NEXVARY_ROOT/HackGpt"
else
  echo "[3/8] Updating HackGPT Enterprise"
  git -C "$NEXVARY_ROOT/HackGpt" fetch --depth 1 origin
  git -C "$NEXVARY_ROOT/HackGpt" reset --hard origin/main
fi

echo "[4/8] Creating secrets"
ENV_FILE="$NEXVARY_ROOT/deploy/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  umask 077
  cat > "$ENV_FILE" <<EOF
HACKGPT_DIR=$NEXVARY_ROOT/HackGpt
POSTGRES_PASSWORD=$(openssl rand -hex 24)
REDIS_PASSWORD=$(openssl rand -hex 24)
HACKGPT_SECRET_KEY=$(openssl rand -hex 32)
HACKGPT_JWT_SECRET=$(openssl rand -hex 32)
NEXVARY_GATEWAY_TOKEN=$(openssl rand -hex 32)
OPENAI_API_KEY=
HACKGPT_MODEL=
HACKGPT_PROVIDER=
LOCAL_LLM_ENDPOINT=
EOF
fi
chmod 600 "$ENV_FILE"

echo "[5/8] Building and starting isolated services"
cd "$NEXVARY_ROOT/deploy"
docker compose --env-file .env -f compose.yaml up -d --build

echo "[6/8] Installing Nginx gateway configuration"
if [[ -f "$TLS_CERT" && -f "$TLS_KEY" ]]; then
  sed     -e "s|__NEXVARY_FQDN__|$FQDN|g"     -e "s|__TLS_CERT__|$TLS_CERT|g"     -e "s|__TLS_KEY__|$TLS_KEY|g"     nginx.conf.template > /etc/nginx/sites-available/nexvary-security

  ln -sf /etc/nginx/sites-available/nexvary-security /etc/nginx/sites-enabled/nexvary-security
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
else
  echo "TLS certificate not found yet."
  echo "Expected: $TLS_CERT"
  echo "Expected: $TLS_KEY"
  echo "The connector remains bound only to 127.0.0.1:8787 until TLS is configured."
fi

echo "[7/8] Installing health check and backup timer"
install -m 0750 health-check.sh /usr/local/sbin/nexvary-security-health
install -m 0750 backup.sh /usr/local/sbin/nexvary-security-backup

cat > /etc/systemd/system/nexvary-security-backup.service <<EOF
[Unit]
Description=NEXVARY Security daily backup
After=docker.service

[Service]
Type=oneshot
Environment=NEXVARY_ROOT=$NEXVARY_ROOT
ExecStart=/usr/local/sbin/nexvary-security-backup
EOF

cat > /etc/systemd/system/nexvary-security-backup.timer <<EOF
[Unit]
Description=Run NEXVARY Security backup daily

[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
RandomizedDelaySec=600

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now nexvary-security-backup.timer

echo "[8/8] Local health checks"
sleep 5
NEXVARY_ROOT="$NEXVARY_ROOT" /usr/local/sbin/nexvary-security-health || true

echo
echo "NEXVARY HackGPT server files installed."
echo "Gateway FQDN: https://$FQDN"
echo "HackGPT API is localhost-only: http://127.0.0.1:8000"
echo "Connector is localhost-only behind Nginx: http://127.0.0.1:8787"
echo
echo "Gateway token:"
grep '^NEXVARY_GATEWAY_TOKEN=' "$ENV_FILE"
echo
echo "If TLS was not present, provision a certificate for $FQDN and rerun this installer."
