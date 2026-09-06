from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import CorrectiveActionCreate, EvidenceSubmission, VerificationAction
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from datetime import datetime

router = APIRouter(prefix="/api/corrective-actions", tags=["Corrective Action Management"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_corrective_action(
    action_data: CorrectiveActionCreate,
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "SUPER_ADMIN", "CORPORATE_ADMIN", "INSPECTOR"]))
):
    db = get_database()
    count = await db.corrective_actions.count_documents({})
    action_id = f"ACT-{datetime.utcnow().year}-{count+1:04d}"
    
    doc = action_data.dict()
    doc["actionId"] = action_id
    doc["status"] = "ASSIGNED"
    doc["submittedEvidence"] = []
    doc["submittedAt"] = None
    doc["verifiedBy"] = None
    doc["verifiedAt"] = None
    doc["verificationResult"] = None
    doc["createdAt"] = datetime.utcnow().isoformat()
    doc["updatedAt"] = datetime.utcnow().isoformat()
    
    res = await db.corrective_actions.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    # Update violation status to ASSIGNED
    await db.violations.update_one(
        {"violationId": doc["violationId"]},
        {"$set": {
            "status": "ASSIGNED",
            "assignedTo": doc["assignedTo"],
            "dueDate": doc["deadline"],
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Corrective Action Assigned",
        module="WORKFLOW",
        record_id=action_id,
        metadata={"assignedTo": doc["assignedTo"], "violationId": doc["violationId"]}
    )

    return doc

@router.get("")
async def list_corrective_actions(
    mineId: str = None,
    assignedTo: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    
    if current_user.get("role") == "CONTRACTOR":
        query["$or"] = [
            {"assignedTo": current_user.get("name")},
            {"assignedTo": current_user.get("email")},
            {"assignedTo": "Contractor Safety Team"}
        ]
    elif mineId:
        query["mineId"] = mineId
    elif current_user.get("role") in ["MINE_MANAGER", "INSPECTOR"] and current_user.get("mineId"):
        query["mineId"] = current_user.get("mineId")
        
    if assignedTo:
        query["assignedTo"] = assignedTo
    if status:
        query["status"] = status
        
    actions = await db.corrective_actions.find(query).sort("createdAt", -1).to_list(length=300)
    for act in actions:
        act["_id"] = str(act["_id"])
    return actions

@router.get("/{id}")
async def get_corrective_action(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    act = await db.corrective_actions.find_one({"$or": [{"actionId": id}, {"_id": id}]})
    if not act:
        raise HTTPException(status_code=404, detail="Corrective action not found")
    act["_id"] = str(act["_id"])
    return act

@router.put("/{id}/submit-evidence")
async def submit_evidence(
    id: str,
    payload: EvidenceSubmission,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    act = await db.corrective_actions.find_one({"$or": [{"actionId": id}, {"_id": id}]})
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")
        
    update_fields = {
        "status": "SUBMITTED",
        "submittedEvidence": payload.submittedEvidence,
        "contractorNotes": payload.notes,
        "submittedAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    await db.corrective_actions.update_one({"_id": act["_id"]}, {"$set": update_fields})

    # Update violation status to VERIFICATION
    await db.violations.update_one(
        {"violationId": act["violationId"]},
        {"$set": {"status": "VERIFICATION", "updatedAt": datetime.utcnow().isoformat()}}
    )

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Evidence Submitted for Action",
        module="WORKFLOW",
        record_id=act["actionId"]
    )

    # Notify Manager
    await db.notifications.insert_one({
        "role": "MINE_MANAGER",
        "title": f"Verification Required: {act['actionId']}",
        "message": f"Evidence submitted by {current_user.get('name')}. Ready for compliance verification.",
        "type": "VERIFICATION_REQUIRED",
        "isRead": False,
        "link": f"/corrective-actions/{act['actionId']}",
        "createdAt": datetime.utcnow().isoformat()
    })

    return {"message": "Evidence submitted successfully. Pending verification by Mine Manager."}

@router.put("/{id}/verify")
async def verify_corrective_action(
    id: str,
    payload: VerificationAction,
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "SUPER_ADMIN", "CORPORATE_ADMIN", "REGULATOR"]))
):
    db = get_database()
    act = await db.corrective_actions.find_one({"$or": [{"actionId": id}, {"_id": id}]})
    if not act:
        raise HTTPException(status_code=404, detail="Action not found")
        
    new_status = "VERIFIED" if payload.approved else "REWORK"
    vio_status = "CLOSED" if payload.approved else "REWORK"
    
    await db.corrective_actions.update_one(
        {"_id": act["_id"]},
        {"$set": {
            "status": new_status,
            "verifiedBy": current_user.get("name"),
            "verifiedAt": datetime.utcnow().isoformat(),
            "verificationResult": payload.verificationNotes,
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )
    
    await db.violations.update_one(
        {"violationId": act["violationId"]},
        {"$set": {
            "status": vio_status,
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )

    action_label = "Action Verified & Violation CLOSED" if payload.approved else "Rework Requested for Action"
    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action=action_label,
        module="WORKFLOW",
        record_id=act["actionId"],
        metadata={"approved": payload.approved, "notes": payload.verificationNotes}
    )

    return {
        "message": f"Verification completed. Action status set to {new_status}, Violation set to {vio_status}.",
        "status": new_status,
        "violationStatus": vio_status
    }
