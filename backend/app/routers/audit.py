from fastapi import APIRouter, Depends, Query
from app.database.connection import get_database
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("")
async def get_audit_trail(
    module: str = None,
    role: str = None,
    action: str = None,
    limit: int = Query(100, le=500),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    if module:
        query["module"] = module
    if role:
        query["role"] = role
    if action:
        query["action"] = {"$regex": action, "$options": "i"}

    logs = await db.audit_trails.find(query).sort("timestamp", -1).to_list(length=limit)
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs
