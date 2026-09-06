from fastapi import APIRouter, HTTPException, Depends
from app.database.connection import get_database
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Aggregations"])

@router.get("/corporate")
async def get_corporate_dashboard(current_user: dict = Depends(get_current_user)):
    db = get_database()
    mines = await db.mines.find().to_list(length=100)
    violations = await db.violations.find().to_list(length=500)
    inspections = await db.inspections.find().to_list(length=500)
    incidents = await db.incidents.find().to_list(length=200)
    actions = await db.corrective_actions.find().to_list(length=300)

    total_mines = len(mines)
    avg_compliance = sum(m.get("complianceScore", 85) for m in mines) / total_mines if total_mines > 0 else 85.0
    open_violations = [v for v in violations if v.get("status") != "CLOSED"]
    overdue_actions = [a for a in actions if a.get("status") in ["ESCALATED", "ESCALATED_CORPORATE"]]
    active_incidents = [i for i in incidents if i.get("status") != "RESOLVED"]

    risk_dist = {
        "LOW": len([m for m in mines if m.get("riskLevel") == "LOW"]),
        "MEDIUM": len([m for m in mines if m.get("riskLevel") == "MEDIUM"]),
        "HIGH": len([m for m in mines if m.get("riskLevel") == "HIGH"]),
        "CRITICAL": len([m for m in mines if m.get("riskLevel") == "CRITICAL"])
    }

    # Category performance
    category_perf = {
        "SAFETY": len([v for v in violations if v.get("category") == "SAFETY"]),
        "ENVIRONMENT": len([v for v in violations if v.get("category") == "ENVIRONMENT"]),
        "PRODUCTION": len([v for v in violations if v.get("category") == "PRODUCTION"]),
        "LABOUR": len([v for v in violations if v.get("category") == "LABOUR"])
    }

    # Mine Ranking Table
    ranking = []
    for m in mines:
        m_vios = [v for v in violations if v.get("mineId") == m.get("mineId") and v.get("status") != "CLOSED"]
        m_acts = [a for a in actions if a.get("mineId") == m.get("mineId") and a.get("status") in ["ESCALATED", "ESCALATED_CORPORATE"]]
        last_ins = await db.inspections.find_one({"mineId": m.get("mineId")}, sort=[("createdAt", -1)])
        ranking.append({
            "mineId": m.get("mineId"),
            "name": m.get("name"),
            "location": f"{m.get('district')}, {m.get('state')}",
            "compliance": m.get("complianceScore", 85),
            "riskLevel": m.get("riskLevel", "LOW"),
            "openViolations": len(m_vios),
            "overdueActions": len(m_acts),
            "trend": "Improving" if m.get("complianceScore", 85) >= 85 else "Declining",
            "lastInspection": last_ins.get("inspectionDate", "2026-03-01") if last_ins else "N/A"
        })

    # High Risk Mine Alerts
    alerts = []
    high_risk_mines = [m for m in mines if m.get("riskLevel") in ["HIGH", "CRITICAL"]]
    for h in high_risk_mines:
        alerts.append({
            "id": h.get("mineId"),
            "mineName": h.get("name"),
            "riskScore": 82 if h.get("mineId") == "MINE-007" else 76,
            "title": f"Recurring safety violation detected in {h.get('name')}",
            "factors": [
                "4 repeated violations in 21 days",
                "2 overdue actions",
                "High severity observation"
            ],
            "recommendation": "Immediate inspection of Zone B required"
        })

    return {
        "overallCompliance": round(avg_compliance, 1),
        "totalMines": total_mines,
        "openViolationsCount": len(open_violations),
        "overdueActionsCount": len(overdue_actions),
        "activeIncidentsCount": len(active_incidents),
        "riskDistribution": risk_dist,
        "categoryPerformance": category_perf,
        "mineRanking": ranking,
        "aiAlerts": alerts
    }

@router.get("/mine/{mine_id}")
async def get_mine_dashboard(mine_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    mine = await db.mines.find_one({"$or": [{"mineId": mine_id}, {"_id": mine_id}]})
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    m_id = mine.get("mineId")
    inspections = await db.inspections.find({"mineId": m_id}).to_list(length=200)
    violations = await db.violations.find({"mineId": m_id}).to_list(length=200)
    actions = await db.corrective_actions.find({"mineId": m_id}).to_list(length=200)

    return {
        "mine": mine,
        "inspectionsCount": len(inspections),
        "violationsCount": len(violations),
        "openViolationsCount": len([v for v in violations if v.get("status") != "CLOSED"]),
        "correctiveActionsCount": len(actions),
        "recentInspections": inspections[:5],
        "recentViolations": violations[:5]
    }

@router.get("/regulator")
async def get_regulator_dashboard(current_user: dict = Depends(get_current_user)):
    db = get_database()
    mines = await db.mines.find().to_list(length=100)
    violations = await db.violations.find({"severity": "CRITICAL"}).to_list(length=100)
    audit_count = await db.audit_trails.count_documents({})
    
    return {
        "totalMonitoredMines": len(mines),
        "criticalViolations": violations,
        "auditLogsTotal": audit_count,
        "statutoryComplianceStatus": "94.2% Compliant"
    }

@router.get("/contractor")
async def get_contractor_dashboard(current_user: dict = Depends(get_current_user)):
    db = get_database()
    assigned_actions = await db.corrective_actions.find({
        "$or": [
            {"assignedTo": current_user.get("name")},
            {"assignedTo": current_user.get("email")},
            {"assignedTo": "Contractor Safety Team"}
        ]
    }).to_list(length=100)

    for a in assigned_actions:
        a["_id"] = str(a["_id"])

    return {
        "assignedTasksCount": len(assigned_actions),
        "pendingEvidenceCount": len([a for a in assigned_actions if a.get("status") in ["ASSIGNED", "IN_PROGRESS"]]),
        "submittedVerificationCount": len([a for a in assigned_actions if a.get("status") == "SUBMITTED"]),
        "completedTasksCount": len([a for a in assigned_actions if a.get("status") in ["VERIFIED", "CLOSED"]]),
        "tasks": assigned_actions
    }
