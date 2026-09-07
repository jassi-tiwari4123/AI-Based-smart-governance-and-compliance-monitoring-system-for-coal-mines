from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import InspectionCreate, InspectionUpdate
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from app.services.risk.risk_engine import RiskEngineService
from app.services.ai.ai_agent import AIAgentService
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/inspections", tags=["Inspection Management"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_inspection(
    inspection_data: InspectionCreate,
    current_user: dict = Depends(require_roles(["INSPECTOR", "MINE_MANAGER", "SUPER_ADMIN", "CORPORATE_ADMIN"]))
):
    db = get_database()
    count = await db.inspections.count_documents({})
    inspection_id = f"INS-{datetime.utcnow().year}-{count+1:04d}"
    
    doc = inspection_data.dict()
    doc["inspectionId"] = inspection_id
    doc["inspectorId"] = current_user.get("userId")
    doc["inspectorName"] = current_user.get("name")
    doc["inspectionDate"] = doc["inspectionDate"] or datetime.utcnow().isoformat()
    doc["createdAt"] = datetime.utcnow().isoformat()
    doc["updatedAt"] = datetime.utcnow().isoformat()
    
    res = await db.inspections.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Inspection Created",
        module="INSPECTION",
        record_id=inspection_id,
        metadata={"mineId": doc["mineId"], "category": doc["category"], "severity": doc["severity"]}
    )

    # AUTO-TRIGGER VIOLATION & AI RISK ANALYSIS IF MAJOR / CRITICAL or COMPLIANCE ISSUE
    violation_id = None
    created_violation = None
    obs = doc.get("observations", "")
    if doc.get("severity") in ["MAJOR", "CRITICAL"] or "compliance" in obs.lower() or "issue" in obs.lower() or "violation" in obs.lower():
        vio_count = await db.violations.count_documents({})
        violation_id = f"VIO-{datetime.utcnow().year}-{vio_count+1:04d}"
        
        violation_doc = {
            "violationId": violation_id,
            "mineId": doc["mineId"],
            "inspectionId": inspection_id,
            "category": doc["category"],
            "title": obs[:80] if obs else f"{doc['category']} Non-Conformity ({doc['zone']})",
            "description": obs,
            "severity": doc["severity"],
            "regulation": "Coal Mines Regulations 2017 CMR 104",
            "detectedDate": datetime.utcnow().isoformat(),
            "assignedTo": "Mine Safety Officer",
            "dueDate": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "status": "OPEN",
            "riskScore": 0,
            "riskLevel": "CALCULATING",
            "evidence": doc.get("photos", []),
            "gpsLocation": doc.get("gpsLocation"),
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        v_res = await db.violations.insert_one(violation_doc)
        violation_doc["_id"] = str(v_res.inserted_id)

        # Run Risk Engine (updates DB and returns scores)
        risk_result = await RiskEngineService.calculate_risk_score(violation_doc)
        violation_doc["riskScore"] = risk_result["riskScore"]
        violation_doc["riskLevel"] = risk_result["riskLevel"]

        # set created_violation AFTER risk scores are populated
        created_violation = violation_doc

        # Run AI Agent Investigation
        inv_result = await AIAgentService.investigate_violation(violation_doc)

        await log_audit_event(
            user_id=current_user.get("userId"),
            user_email=current_user["email"],
            role=current_user["role"],
            action="AI Analysis & Risk Score Generated",
            module="AI_ENGINE",
            record_id=violation_id,
            metadata={"riskScore": risk_result["riskScore"], "riskLevel": risk_result["riskLevel"]}
        )

        # Notify Mine Manager
        await db.notifications.insert_one({
            "role": "MINE_MANAGER",
            "title": f"High Risk Violation Created: {violation_id}",
            "message": f"AI Risk Score: {risk_result['riskScore']}/100 ({risk_result['riskLevel']}) in Zone {doc['zone']}",
            "type": "HIGH_RISK_ALERT",
            "isRead": False,
            "link": f"/violations/{violation_id}",
            "createdAt": datetime.utcnow().isoformat()
        })

    return {
        "inspection": doc,
        "violationCreated": created_violation
    }

@router.get("")
async def list_inspections(
    mineId: str = None,
    category: str = None,
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
        
    inspections = await db.inspections.find(query).sort("createdAt", -1).to_list(length=300)
    for i in inspections:
        i["_id"] = str(i["_id"])
    return inspections

@router.get("/{id}")
async def get_inspection(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    inspection = await db.inspections.find_one({"$or": [{"inspectionId": id}, {"_id": id}]})
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    inspection["_id"] = str(inspection["_id"])
    return inspection

@router.put("/{id}")
async def update_inspection(
    id: str,
    update_data: InspectionUpdate,
    current_user: dict = Depends(require_roles(["INSPECTOR", "MINE_MANAGER", "SUPER_ADMIN"]))
):
    db = get_database()
    fields = {k: v for k, v in update_data.dict().items() if v is not None}
    fields["updatedAt"] = datetime.utcnow().isoformat()
    
    res = await db.inspections.update_one(
        {"$or": [{"inspectionId": id}, {"_id": id}]},
        {"$set": fields}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return {"message": "Inspection updated successfully"}

@router.delete("/{id}")
async def delete_inspection(id: str, current_user: dict = Depends(require_roles(["SUPER_ADMIN"]))):
    db = get_database()
    res = await db.inspections.delete_one({"$or": [{"inspectionId": id}, {"_id": id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return {"message": "Inspection deleted successfully"}
