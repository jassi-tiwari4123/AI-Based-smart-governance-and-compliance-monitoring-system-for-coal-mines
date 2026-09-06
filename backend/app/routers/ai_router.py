from fastapi import APIRouter, HTTPException, Depends
from app.schemas.all_schemas import RiskAnalysisRequest, AIInvestigationRequest
from app.services.risk.risk_engine import RiskEngineService
from app.services.ai.ai_agent import AIAgentService
from app.database.connection import get_database
from app.middleware.auth import get_current_user
from app.services.audit.audit_service import log_audit_event

router = APIRouter(prefix="/api/ai", tags=["AI Engine & Risk Investigation"])

@router.post("/analyze-risk/{violation_id}")
async def analyze_risk(violation_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    violation = await db.violations.find_one({"$or": [{"violationId": violation_id}, {"_id": violation_id}]})
    if not violation:
        raise HTTPException(status_code=404, detail="Violation record not found")
        
    result = await RiskEngineService.calculate_risk_score(violation)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="AI Risk Score Analyzed",
        module="AI_RISK",
        record_id=violation_id,
        metadata=result
    )

    return result

@router.post("/investigate/{violation_id}")
async def investigate(violation_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    violation = await db.violations.find_one({"$or": [{"violationId": violation_id}, {"_id": violation_id}]})
    if not violation:
        raise HTTPException(status_code=404, detail="Violation record not found")
        
    investigation = await AIAgentService.investigate_violation(violation)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="AI Agent Investigation Generated",
        module="AI_AGENT",
        record_id=violation_id
    )

    return investigation

@router.get("/knowledge-base")
async def get_knowledge_base(category: str = "SAFETY", current_user: dict = Depends(get_current_user)):
    db = get_database()
    regulations = await db.regulations.find().to_list(length=50)
    sops = await db.sops.find().to_list(length=50)
    historical = await db.historical_violations.find().to_list(length=50)
    
    for r in regulations:
        r["_id"] = str(r["_id"])
    for s in sops:
        s["_id"] = str(s["_id"])
    for h in historical:
        h["_id"] = str(h["_id"])

    return {
        "regulationsCount": len(regulations),
        "sopsCount": len(sops),
        "historicalViolationsCount": len(historical),
        "regulations": regulations,
        "sops": sops,
        "historicalViolations": historical
    }
