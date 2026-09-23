#!/usr/bin/env python3
import hmac
import json
import os
import re
import threading
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from flask import Flask, jsonify, request

app = Flask(__name__)

STATE_DIR = Path(os.environ.get("NEXVARY_STATE_DIR", "./state"))
STATE_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_FILE = STATE_DIR / "audit.jsonl"
AUTH_FILE = STATE_DIR / "authorizations.json"

HACKGPT_BASE_URL = os.environ.get("HACKGPT_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
GATEWAY_TOKEN = os.environ.get("NEXVARY_GATEWAY_TOKEN", "")
AUTH_RE = re.compile(r"^[A-Za-z0-9._:/-]{6,120}$")
ASSET_RE = re.compile(r"^[A-Za-z0-9._:-]{2,100}$")
_lock = threading.Lock()

def audit(event, payload):
    entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event,
        "payload": payload,
    }
    with _lock:
        with AUDIT_FILE.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")

def _load_auth():
    if not AUTH_FILE.exists():
        return {}
    try:
        value = json.loads(AUTH_FILE.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except Exception:
        return {}

def _save_auth(value):
    tmp = AUTH_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(AUTH_FILE)

def token_required():
    if not GATEWAY_TOKEN:
        return None
    supplied = request.headers.get("X-Nexvary-Token", "")
    if not hmac.compare_digest(supplied, GATEWAY_TOKEN):
        return jsonify({"ok": False, "error": "unauthorized_client"}), 401
    return None

def upstream_get(path, timeout=10):
    req = Request(
        HACKGPT_BASE_URL + path,
        headers={"Accept": "application/json"},
        method="GET",
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                body = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                body = {"raw": raw}
            return resp.status, body
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            body = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            body = {"raw": raw}
        return exc.code, body
    except URLError as exc:
        return 503, {"error": "hackgpt_unreachable", "detail": str(exc)}

@app.before_request
def auth_gate():
    if request.path == "/api/v1/health":
        return None
    return token_required()

@app.get("/api/v1/health")
def health():
    status, body = upstream_get("/api/health", timeout=5)
    return jsonify({
        "ok": True,
        "connector": "nexvary-hackgpt-readonly",
        "hackgpt_reachable": 200 <= status < 300,
        "hackgpt_status": status,
        "upstream": body if status < 500 else None,
    })

@app.post("/api/v1/authorizations")
def register_authorization():
    data = request.get_json(silent=True) or {}
    auth_id = str(data.get("authorization_id") or "").strip()
    asset_id = str(data.get("asset_id") or "").strip()
    owner = str(data.get("owner") or "").strip()
    scope = str(data.get("scope") or "").strip()
    window = str(data.get("maintenance_window") or "").strip()

    if not AUTH_RE.match(auth_id):
        return jsonify({"ok": False, "error": "invalid_authorization_id"}), 400
    if not ASSET_RE.match(asset_id):
        return jsonify({"ok": False, "error": "invalid_asset_id"}), 400
    if not owner or not scope or not window:
        return jsonify({"ok": False, "error": "owner_scope_window_required"}), 400

    record = {
        "authorization_id": auth_id,
        "asset_id": asset_id,
        "owner": owner,
        "scope": scope,
        "maintenance_window": window,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "status": "approved-for-operator-review",
    }

    with _lock:
        db = _load_auth()
        db[auth_id] = record
        _save_auth(db)

    audit("authorization_registered", {
        "authorization_id": auth_id,
        "asset_id": asset_id,
        "owner": owner,
    })
    return jsonify({"ok": True, "authorization": record}), 201

@app.get("/api/v1/authorizations/<authorization_id>")
def get_authorization(authorization_id):
    with _lock:
        db = _load_auth()
    record = db.get(authorization_id)
    if not record:
        return jsonify({"ok": False, "error": "authorization_not_found"}), 404
    return jsonify({"ok": True, "authorization": record})

@app.get("/api/v1/hackgpt/sessions")
def sessions():
    status, body = upstream_get("/api/sessions", timeout=15)
    audit("sessions_viewed", {"hackgpt_status": status})
    return jsonify({
        "ok": 200 <= status < 300,
        "hackgpt_status": status,
        "sessions": body,
    }), (200 if 200 <= status < 300 else 502)

@app.get("/api/v1/hackgpt/reports/<report_id>")
def report(report_id):
    safe_id = re.sub(r"[^A-Za-z0-9._:-]", "", report_id)
    if not safe_id or safe_id != report_id:
        return jsonify({"ok": False, "error": "invalid_report_id"}), 400
    status, body = upstream_get("/api/reports/" + safe_id, timeout=20)
    audit("report_viewed", {"report_id": safe_id, "hackgpt_status": status})
    return jsonify({
        "ok": 200 <= status < 300,
        "hackgpt_status": status,
        "report": body,
    }), (200 if 200 <= status < 300 else 502)

if __name__ == "__main__":
    host = os.environ.get("NEXVARY_CONNECTOR_BIND", "127.0.0.1")
    port = int(os.environ.get("NEXVARY_CONNECTOR_PORT", "8787"))
    app.run(host=host, port=port, debug=False)
