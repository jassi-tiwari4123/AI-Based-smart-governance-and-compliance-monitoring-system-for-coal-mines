from fastapi import APIRouter, Depends
from app.database.connection import get_database
from app.middleware.auth import get_current_user
from app.services.workflow.workflow_engine import WorkflowEngineService

router = APIRouter(prefix="/api/workflows", tags=["Workflows & Escalations"])

@router.get("")
async def get_workflows(current_user: dict = Depends(get_current_user)):
    db = get_database()
    escalations = await db.corrective_actions.find({"status": {"$in": ["ESCALATED", "ESCALATED_CORPORATE"]}}).to_list(length=100)
    for e in escalations:
        e["_id"] = str(e["_id"])
    return {
        "activeEscalations": escalations,
        "totalEscalated": len(escalations)
    }

@router.post("/evaluate")
async def evaluate_workflows(current_user: dict = Depends(get_current_user)):
    res = await WorkflowEngineService.evaluate_workflows()
    return res
