#!/usr/bin/env bash
set -euo pipefail

ROOT="${NEXVARY_ROOT:-/opt/nexvary-security}"
BACKUP_DIR="${NEXVARY_BACKUP_DIR:-/var/backups/nexvary-security}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

cd "$ROOT/deploy"
source .env

docker compose --env-file .env -f compose.yaml exec -T postgres   pg_dump -U hackgpt -d hackgpt | gzip -9 > "$BACKUP_DIR/hackgpt-db-$STAMP.sql.gz"

docker run --rm   -v nexvary-security_connector_state:/source:ro   -v "$BACKUP_DIR:/backup"   alpine sh -c "cd /source && tar -czf /backup/connector-state-$STAMP.tar.gz ."

find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup complete: $BACKUP_DIR"
