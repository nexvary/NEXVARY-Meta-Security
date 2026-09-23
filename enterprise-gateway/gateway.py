#!/usr/bin/env python3
import hmac
import ipaddress
import json
import os
import re
import socket
import threading
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from flask import Flask, jsonify, request

app = Flask(__name__)

STATE_DIR = Path(os.environ.get("NEXVARY_STATE_DIR", "./state"))
STATE_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_FILE = STATE_DIR / "audit.jsonl"
ASSESSMENTS_FILE = STATE_DIR / "assessments.json"

HACKGPT_BASE_URL = os.environ.get("HACKGPT_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
HACKGPT_AUTH_KEY = os.environ.get("HACKGPT_AUTH_KEY", "")
GATEWAY_TOKEN = os.environ.get("NEXVARY_GATEWAY_TOKEN", "")
ALLOWED_HOSTS = [x.strip().lower() for x in os.environ.get("NEXVARY_ALLOWED_HOSTS", "").split(",") if x.strip()]
ALLOWED_CIDRS = [
    ipaddress.ip_network(x.strip(), strict=False)
    for x in os.environ.get(
        "NEXVARY_ALLOWED_CIDRS",
        "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.0/8"
    ).split(",")
    if x.strip()
]
ALLOWED_PROFILES = {
    "discovery": "Authorized asset discovery and service inventory only",
    "web-safe": "Authorized web application assessment; avoid destructive actions",
    "api-safe": "Authorized API assessment; avoid destructive actions",
    "configuration": "Authorized configuration and exposure validation",
    "compliance": "Authorized compliance validation against approved frameworks",
}
ALLOWED_COMPLIANCE = {"OWASP", "NIST", "ISO27001", "SOC2", "PCI-DSS"}
AUTH_ID_RE = re.compile(r"^[A-Za-z0-9._:/-]{6,120}$")
ASSET_ID_RE = re.compile(r"^[A-Za-z0-9._:-]{2,100}$")
_lock = threading.Lock()

def _load_assessments():
    if not ASSESSMENTS_FILE.exists():
        return {}
    try:
        data = json.loads(ASSESSMENTS_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}

def _save_assessments(data):
    tmp = ASSESSMENTS_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(ASSESSMENTS_FILE)

def audit(event, payload):
    entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event,
        "payload": payload,
    }
    with _lock:
        with AUDIT_FILE.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")

def require_gateway_token():
    if not GATEWAY_TOKEN:
        return None
    supplied = request.headers.get("X-Nexvary-Token", "")
    if not hmac.compare_digest(supplied, GATEWAY_TOKEN):
        return jsonify({"ok": False, "error": "unauthorized_gateway_client"}), 401
    return None

def normalize_target(raw):
    raw = (raw or "").strip()
    if not raw:
        raise ValueError("target_required")
    if "://" not in raw:
        parsed = urlparse("https://" + raw)
    else:
        parsed = urlparse(raw)
    if parsed.username or parsed.password:
        raise ValueError("credentials_in_target_not_allowed")
    if parsed.scheme not in ("http", "https"):
        raise ValueError("unsupported_scheme")
    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise ValueError("invalid_target")
    port = parsed.port
    return host, port, parsed.geturl()

def host_matches_allowlist(host):
    for allowed in ALLOWED_HOSTS:
        if allowed.startswith("*."):
            suffix = allowed[1:]
            if host.endswith(suffix):
                return True
        elif host == allowed:
            return True
    try:
        ip = ipaddress.ip_address(host)
        return any(ip in net for net in ALLOWED_CIDRS)
    except ValueError:
        return False

def validate_request(data):
    target = data.get("target")
    asset_id = (data.get("asset_id") or "").strip()
    authorization_id = (data.get("authorization_id") or "").strip()
    profile = (data.get("profile") or "").strip()
    compliance = (data.get("compliance") or "OWASP").strip().upper()
    approved = bool(data.get("approved"))

    if not approved:
        return False, "explicit_approval_required", None
    if not ASSET_ID_RE.match(asset_id):
        return False, "invalid_asset_id", None
    if not AUTH_ID_RE.match(authorization_id):
        return False, "invalid_authorization_id", None
    if profile not in ALLOWED_PROFILES:
        return False, "profile_not_allowed", None
    if compliance not in ALLOWED_COMPLIANCE:
        return False, "compliance_not_allowed", None

    try:
        host, port, normalized = normalize_target(target)
    except ValueError as exc:
        return False, str(exc), None

    if not host_matches_allowlist(host):
        return False, "target_outside_company_allowlist", {
            "host": host,
            "hint": "Configure NEXVARY_ALLOWED_HOSTS or NEXVARY_ALLOWED_CIDRS on the gateway."
        }

    return True, "ok", {
        "target": normalized,
        "host": host,
        "port": port,
        "asset_id": asset_id,
        "authorization_id": authorization_id,
        "profile": profile,
        "compliance": compliance,
    }

def hackgpt_request(path, method="GET", body=None, timeout=25):
    url = HACKGPT_BASE_URL + path
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {"raw": raw}
            return resp.status, parsed
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw}
        return exc.code, parsed
    except (URLError, socket.timeout) as exc:
        return 503, {"error": "hackgpt_unreachable", "detail": str(exc)}

@app.before_request
def _auth_gate():
    if request.path == "/api/v1/health":
        return None
    return require_gateway_token()

@app.get("/api/v1/health")
def health():
    status, upstream = hackgpt_request("/api/health", timeout=5)
    return jsonify({
        "ok": True,
        "gateway": "nexvary-security-gateway",
        "hackgpt_reachable": 200 <= status < 300,
        "hackgpt_status": status,
        "upstream": upstream if status < 500 else None,
    })

@app.post("/api/v1/validate-scope")
def validate_scope():
    data = request.get_json(silent=True) or {}
    ok, reason, normalized = validate_request(data)
    audit("scope_validation", {
        "ok": ok,
        "reason": reason,
        "asset_id": data.get("asset_id"),
        "authorization_id": data.get("authorization_id"),
        "target": data.get("target"),
        "profile": data.get("profile"),
    })
    code = 200 if ok else 400
    return jsonify({"ok": ok, "reason": reason, "normalized": normalized}), code

@app.post("/api/v1/assessments")
def start_assessment():
    data = request.get_json(silent=True) or {}
    ok, reason, normalized = validate_request(data)
    if not ok:
        audit("assessment_rejected", {
            "reason": reason,
            "asset_id": data.get("asset_id"),
            "authorization_id": data.get("authorization_id"),
            "target": data.get("target"),
            "profile": data.get("profile"),
        })
        return jsonify({"ok": False, "error": reason, "normalized": normalized}), 400

    gateway_id = str(uuid.uuid4())
    upstream_payload = {
        "target": normalized["target"],
        "scope": ALLOWED_PROFILES[normalized["profile"]],
        "auth_key": HACKGPT_AUTH_KEY,
        "assessment_type": "white-box",
        "compliance": normalized["compliance"],
        "ai_enhanced": bool(data.get("ai_enhanced", True)),
    }

    status, upstream = hackgpt_request(
        "/api/pentest/start",
        method="POST",
        body=upstream_payload,
        timeout=60
    )

    record = {
        "id": gateway_id,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "asset_id": normalized["asset_id"],
        "authorization_id": normalized["authorization_id"],
        "target": normalized["target"],
        "profile": normalized["profile"],
        "compliance": normalized["compliance"],
        "hackgpt_status": status,
        "upstream": upstream,
    }
    with _lock:
        assessments = _load_assessments()
        assessments[gateway_id] = record
        _save_assessments(assessments)

    audit("assessment_started", {
        "gateway_id": gateway_id,
        "asset_id": normalized["asset_id"],
        "authorization_id": normalized["authorization_id"],
        "target": normalized["target"],
        "profile": normalized["profile"],
        "hackgpt_status": status,
    })

    response_code = 202 if 200 <= status < 300 else 502
    return jsonify({"ok": 200 <= status < 300, "assessment": record}), response_code

@app.get("/api/v1/assessments/<assessment_id>")
def get_assessment(assessment_id):
    with _lock:
        assessments = _load_assessments()
    record = assessments.get(assessment_id)
    if not record:
        return jsonify({"ok": False, "error": "assessment_not_found"}), 404
    return jsonify({"ok": True, "assessment": record})

@app.get("/api/v1/reports/<assessment_id>")
def get_report(assessment_id):
    with _lock:
        assessments = _load_assessments()
    record = assessments.get(assessment_id)
    if not record:
        return jsonify({"ok": False, "error": "assessment_not_found"}), 404

    upstream = record.get("upstream") or {}
    session_id = (
        upstream.get("session_id")
        or upstream.get("id")
        or upstream.get("session")
        or upstream.get("assessment_id")
    )
    if not session_id:
        return jsonify({
            "ok": False,
            "error": "upstream_session_id_unavailable",
            "assessment": record
        }), 409

    status, report = hackgpt_request(f"/api/reports/{session_id}", timeout=30)
    audit("report_requested", {
        "gateway_id": assessment_id,
        "upstream_session_id": session_id,
        "hackgpt_status": status,
    })
    return jsonify({
        "ok": 200 <= status < 300,
        "hackgpt_status": status,
        "report": report
    }), (200 if 200 <= status < 300 else 502)

if __name__ == "__main__":
    host = os.environ.get("NEXVARY_GATEWAY_BIND", "127.0.0.1")
    port = int(os.environ.get("NEXVARY_GATEWAY_PORT", "8787"))
    app.run(host=host, port=port, debug=False)
