from datetime import datetime
from app.database.connection import get_database

async def log_audit_event(
    user_id: str,
    user_email: str,
    role: str,
    action: str,
    module: str,
    record_id: str = None,
    metadata: dict = None,
    ip_address: str = "N/A"
):
    db = get_database()
    audit_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "userId": user_id,
        "userEmail": user_email,
        "role": role,
        "action": action,
        "module": module,
        "recordId": record_id or "N/A",
        "metadata": metadata or {},
        "ipAddress": ip_address
    }
    await db.audit_trails.insert_one(audit_entry)
    return audit_entry
