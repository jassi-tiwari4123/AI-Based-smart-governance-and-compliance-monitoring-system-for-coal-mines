from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import IncidentCreate
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from datetime import datetime

router = APIRouter(prefix="/api/incidents", tags=["Incident Management"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_incident(
    incident_data: IncidentCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    count = await db.incidents.count_documents({})
    incident_id = f"INC-{datetime.utcnow().year}-{count+1:04d}"
    
    doc = incident_data.dict()
    doc["incidentId"] = incident_id
    doc["reportedBy"] = current_user.get("name")
    doc["reporterId"] = current_user.get("userId")
    doc["reportedAt"] = datetime.utcnow().isoformat()
    doc["createdAt"] = datetime.utcnow().isoformat()
    
    res = await db.incidents.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Incident Reported",
        module="INCIDENT",
        record_id=incident_id,
        metadata={"severity": doc["severity"], "mineId": doc["mineId"]}
    )

    # Trigger AI Notification
    await db.notifications.insert_one({
        "role": "MINE_MANAGER",
        "title": f"Incident Reported: {incident_id}",
        "message": f"{doc['severity']} incident logged in Zone {doc['zone']}: {doc['description'][:60]}...",
        "type": "INCIDENT_ALERT",
        "isRead": False,
        "link": f"/incidents",
        "createdAt": datetime.utcnow().isoformat()
    })

    return doc

@router.get("")
async def list_incidents(
    mineId: str = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    if mineId:
        query["mineId"] = mineId
    elif current_user.get("role") in ["MINE_MANAGER", "INSPECTOR"] and current_user.get("mineId"):
        query["mineId"] = current_user.get("mineId")
        
    incidents = await db.incidents.find(query).sort("createdAt", -1).to_list(length=300)
    for inc in incidents:
        inc["_id"] = str(inc["_id"])
    return incidents

@router.get("/{id}")
async def get_incident(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    inc = await db.incidents.find_one({"$or": [{"incidentId": id}, {"_id": id}]})
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc["_id"] = str(inc["_id"])
    return inc
