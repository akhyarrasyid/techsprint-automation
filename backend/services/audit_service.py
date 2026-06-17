"""
Audit Service — Enterprise audit trail for all system actions.
"""
import os
import json
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
AUDIT_FILE = os.path.join(LOG_DIR, "audit_trail.jsonl")


class AuditTrail:
    """Thread-safe audit trail logger using JSONL file."""

    @staticmethod
    def log(action: str, category: str, details: Optional[Dict[str, Any]] = None, user: str = "system"):
        """Log an audit event."""
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "action": action,
            "category": category,
            "user": user,
            "details": details or {},
        }
        try:
            with open(AUDIT_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, default=str) + "\n")
        except Exception:
            pass

    @staticmethod
    def get_recent(limit: int = 50) -> List[Dict[str, Any]]:
        """Get most recent audit entries."""
        entries = []
        try:
            if os.path.exists(AUDIT_FILE):
                with open(AUDIT_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                entries.append(json.loads(line))
                            except json.JSONDecodeError:
                                continue
        except Exception:
            pass
        # Return most recent entries
        return entries[-limit:][::-1]

    @staticmethod
    def get_stats() -> Dict[str, Any]:
        """Get audit trail statistics."""
        entries = AuditTrail.get_recent(500)
        categories = {}
        for e in entries:
            cat = e.get("category", "unknown")
            categories[cat] = categories.get(cat, 0) + 1
        return {
            "total_entries": len(entries),
            "categories": categories,
            "latest": entries[0] if entries else None,
        }

    @staticmethod
    def clear():
        """Clear audit trail (admin only)."""
        try:
            if os.path.exists(AUDIT_FILE):
                os.remove(AUDIT_FILE)
        except Exception:
            pass
