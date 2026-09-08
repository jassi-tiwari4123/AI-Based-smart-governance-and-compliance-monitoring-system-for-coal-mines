from fastapi import APIRouter, HTTPException, Depends
from app.schemas.all_schemas import RiskAnalysisRequest, AIInvestigationRequest, InspectionSuggestionRequest
from app.services.risk.risk_engine import RiskEngineService
from app.services.ai.ai_agent import AIAgentService
from app.database.connection import get_database
from app.middleware.auth import get_current_user
from app.services.audit.audit_service import log_audit_event
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/ai", tags=["AI Engine & Risk Investigation"])

class IncidentSuggestionRequest(BaseModel):
    description: str

@router.post("/suggest-inspection")
async def suggest_inspection(
    body: InspectionSuggestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    NLP-powered pre-fill endpoint.
    Accepts a free-text field observation and returns AI-suggested
    severity, inspection category, and compliance checklist statuses
    for the inspector to review before submitting the form.
    """
    if not body.observation or len(body.observation.strip()) < 10:
        raise HTTPException(
            status_code=422,
            detail="Observation text must be at least 10 characters for AI analysis."
        )

    suggestion = await AIAgentService.suggest_inspection_fields(body.observation.strip())

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="AI Inspection Suggestion Requested",
        module="AI_SUGGEST",
        record_id=None,
        metadata={"observationLength": len(body.observation), "suggestedSeverity": suggestion.get("severity")}
    )

    return suggestion


@router.post("/suggest-incident")
async def suggest_incident(
    body: IncidentSuggestionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    NLP-powered pre-fill for incident reports.
    Accepts a free-text incident description and returns AI-suggested
    severity and incident category for the inspector to review.
    """
    if not body.description or len(body.description.strip()) < 10:
        raise HTTPException(
            status_code=422,
            detail="Incident description must be at least 10 characters for AI analysis."
        )

    suggestion = await AIAgentService.suggest_incident_fields(body.description.strip())

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="AI Incident Suggestion Requested",
        module="AI_SUGGEST",
        record_id=None,
        metadata={"descriptionLength": len(body.description), "suggestedSeverity": suggestion.get("severity")}
    )

    return suggestion


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
