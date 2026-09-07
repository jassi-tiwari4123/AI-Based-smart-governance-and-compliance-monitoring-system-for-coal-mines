from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import IncidentCreate
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/incidents", tags=["Incident Management"])


class IncidentStatusUpdate(BaseModel):
    status: str  # REPORTED, UNDER_REVIEW, RESOLVED


class IncidentQuery(BaseModel):
    message: str
    queryType: Optional[str] = "QUERY"  # QUERY, ESCALATION, NOTE

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


@router.put("/{id}")
async def update_incident_status(
    id: str,
    payload: IncidentStatusUpdate,
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "CORPORATE_ADMIN", "SUPER_ADMIN"]))
):
    """Mine Manager can update incident status (e.g. mark as RESOLVED)."""
    db = get_database()
    inc = await db.incidents.find_one({"$or": [{"incidentId": id}, {"_id": id}]})
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    await db.incidents.update_one(
        {"_id": inc["_id"]},
        {"$set": {
            "status": payload.status,
            "updatedAt": datetime.utcnow().isoformat(),
            "resolvedBy": current_user.get("name") if payload.status == "RESOLVED" else None,
            "resolvedAt": datetime.utcnow().isoformat() if payload.status == "RESOLVED" else None,
        }}
    )

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action=f"Incident Status Updated to {payload.status}",
        module="INCIDENT",
        record_id=inc.get("incidentId", id),
        metadata={"newStatus": payload.status}
    )

    return {"message": f"Incident status updated to {payload.status}"}


@router.post("/{id}/query")
async def raise_incident_query(
    id: str,
    payload: IncidentQuery,
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "CORPORATE_ADMIN", "SUPER_ADMIN"]))
):
    """Raise a query or note on an incident. Stored as a thread on the incident."""
    db = get_database()
    inc = await db.incidents.find_one({"$or": [{"incidentId": id}, {"_id": id}]})
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    query_entry = {
        "queryId": f"QRY-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "message": payload.message,
        "queryType": payload.queryType,
        "raisedBy": current_user.get("name"),
        "raisedByRole": current_user.get("role"),
        "raisedAt": datetime.utcnow().isoformat(),
    }

    await db.incidents.update_one(
        {"_id": inc["_id"]},
        {
            "$push": {"queries": query_entry},
            "$set": {
                "status": "UNDER_REVIEW",
                "updatedAt": datetime.utcnow().isoformat()
            }
        }
    )

    # Notify the original reporter
    await db.notifications.insert_one({
        "role": "INSPECTOR",
        "userId": inc.get("reporterId"),
        "title": f"Query on Incident {inc.get('incidentId', id)}",
        "message": f"{current_user.get('name')} raised a query: {payload.message[:80]}",
        "type": "INCIDENT_QUERY",
        "isRead": False,
        "link": f"/incidents/{inc.get('incidentId', id)}",
        "createdAt": datetime.utcnow().isoformat()
    })

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Incident Query Raised",
        module="INCIDENT",
        record_id=inc.get("incidentId", id),
        metadata={"queryType": payload.queryType, "message": payload.message[:100]}
    )

    return {"message": "Query raised successfully", "query": query_entry}


@router.post("/{id}/reply")
async def reply_to_incident_query(
    id: str,
    payload: IncidentQuery,
    current_user: dict = Depends(get_current_user)
):
    """Inspector (or anyone) can reply to a query on an incident."""
    db = get_database()
    inc = await db.incidents.find_one({"$or": [{"incidentId": id}, {"_id": id}]})
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    reply_entry = {
        "queryId":     f"RPL-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "message":     payload.message,
        "queryType":   "REPLY",
        "raisedBy":    current_user.get("name"),
        "raisedByRole": current_user.get("role"),
        "raisedAt":    datetime.utcnow().isoformat(),
    }

    await db.incidents.update_one(
        {"_id": inc["_id"]},
        {"$push": {"queries": reply_entry},
         "$set":  {"updatedAt": datetime.utcnow().isoformat()}}
    )

    # Notify the Mine Manager
    await db.notifications.insert_one({
        "role":      "MINE_MANAGER",
        "title":     f"Reply on Incident {inc.get('incidentId', id)}",
        "message":   f"{current_user.get('name')} replied: {payload.message[:80]}",
        "type":      "INCIDENT_REPLY",
        "isRead":    False,
        "link":      f"/incidents/{inc.get('incidentId', id)}",
        "createdAt": datetime.utcnow().isoformat()
    })

    return {"message": "Reply posted successfully", "reply": reply_entry}
