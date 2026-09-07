from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import ViolationCreate, ViolationUpdate
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from app.services.risk.risk_engine import RiskEngineService
from app.services.ai.ai_agent import AIAgentService
from datetime import datetime

router = APIRouter(prefix="/api/violations", tags=["Violation Management"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_violation(
    violation_data: ViolationCreate,
    current_user: dict = Depends(require_roles(["INSPECTOR", "MINE_MANAGER", "SUPER_ADMIN", "CORPORATE_ADMIN"]))
):
    db = get_database()
    count = await db.violations.count_documents({})
    violation_id = f"VIO-{datetime.utcnow().year}-{count+1:04d}"
    
    doc = violation_data.dict()
    doc["violationId"] = violation_id
    doc["detectedDate"] = datetime.utcnow().isoformat()
    doc["riskScore"] = 0
    doc["riskLevel"] = "CALCULATING"
    doc["createdAt"] = datetime.utcnow().isoformat()
    doc["updatedAt"] = datetime.utcnow().isoformat()
    
    res = await db.violations.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    # Compute risk score & AI investigation
    risk = await RiskEngineService.calculate_risk_score(doc)
    doc["riskScore"] = risk["riskScore"]
    doc["riskLevel"] = risk["riskLevel"]

    await AIAgentService.investigate_violation(doc)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Violation Detected & Logged",
        module="VIOLATION",
        record_id=violation_id,
        metadata={"mineId": doc["mineId"], "category": doc["category"], "severity": doc["severity"]}
    )

    return doc

@router.get("")
async def list_violations(
    mineId: str = None,
    category: str = None,
    status: str = None,
    riskLevel: str = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    if mineId:
        query["mineId"] = mineId
    elif current_user.get("role") in ["MINE_MANAGER", "INSPECTOR"] and current_user.get("mineId"):
        query["mineId"] = current_user.get("mineId")
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if riskLevel:
        query["riskLevel"] = riskLevel

    violations = await db.violations.find(query).sort("createdAt", -1).to_list(length=500)
    for v in violations:
        v["_id"] = str(v["_id"])
    return violations

@router.get("/{id}")
async def get_violation(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    v = await db.violations.find_one({"$or": [{"violationId": id}, {"_id": id}]})
    if not v:
        raise HTTPException(status_code=404, detail="Violation record not found")
    v["_id"] = str(v["_id"])
    return v

@router.put("/{id}")
async def update_violation(
    id: str,
    update_data: ViolationUpdate,
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "SUPER_ADMIN", "CORPORATE_ADMIN"]))
):
    db = get_database()
    fields = {k: v for k, v in update_data.dict().items() if v is not None}
    fields["updatedAt"] = datetime.utcnow().isoformat()
    
    res = await db.violations.update_one(
        {"$or": [{"violationId": id}, {"_id": id}]},
        {"$set": fields}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Violation not found")

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action=f"Violation Status Updated to {fields.get('status', 'MODIFIED')}",
        module="VIOLATION",
        record_id=id
    )

    return {"message": "Violation updated successfully"}

@router.delete("/{id}")
async def delete_violation(id: str, current_user: dict = Depends(require_roles(["SUPER_ADMIN"]))):
    db = get_database()
    res = await db.violations.delete_one({"$or": [{"violationId": id}, {"_id": id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Violation not found")
    return {"message": "Violation deleted successfully"}
