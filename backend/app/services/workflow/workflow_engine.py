from datetime import datetime, timedelta
from app.database.connection import get_database

class WorkflowEngineService:
    @staticmethod
    async def evaluate_workflows():
        db = get_database()
        now = datetime.utcnow()
        
        # Check active corrective actions
        actions = await db.corrective_actions.find({"status": {"$in": ["ASSIGNED", "IN_PROGRESS", "OPEN"]}}).to_list(length=200)
        
        updates_count = 0
        for action in actions:
            deadline_str = action.get("deadline")
            if not deadline_str:
                continue
                
            try:
                deadline_dt = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
            except Exception:
                continue
                
            time_diff = (deadline_dt.replace(tzinfo=None) - now).total_seconds()
            
            # Deadline approaching (within 24h)
            if 0 < time_diff <= 86400:
                # Check if reminder sent
                reminder = await db.notifications.find_one({
                    "link": f"/corrective-actions/{action.get('actionId')}",
                    "type": "DEADLINE_REMINDER"
                })
                if not reminder:
                    await db.notifications.insert_one({
                        "userId": action.get("assignedTo"),
                        "role": "ALL",
                        "title": "Deadline Approaching",
                        "message": f"Corrective action {action.get('actionId')} deadline is within 24 hours.",
                        "type": "DEADLINE_REMINDER",
                        "isRead": False,
                        "link": f"/corrective-actions/{action.get('actionId')}",
                        "createdAt": datetime.utcnow().isoformat()
                    })
                    updates_count += 1

            # Deadline passed -> OVERDUE / ESCALATED
            elif time_diff < 0:
                days_overdue = abs(time_diff) / 86400.0
                
                if days_overdue >= 5 and action.get("status") != "ESCALATED_CORPORATE":
                    await db.corrective_actions.update_one(
                        {"_id": action["_id"]},
                        {"$set": {
                            "status": "ESCALATED_CORPORATE",
                            "escalatedLevel": "Corporate Admin",
                            "updatedAt": datetime.utcnow().isoformat()
                        }}
                    )
                    await db.notifications.insert_one({
                        "role": "CORPORATE_ADMIN",
                        "title": "CRITICAL ESCALATION: Unresolved Action",
                        "message": f"Action {action.get('actionId')} is {int(days_overdue)} days overdue! Escalated to Corporate Management.",
                        "type": "ESCALATION",
                        "isRead": False,
                        "link": f"/corrective-actions/{action.get('actionId')}",
                        "createdAt": datetime.utcnow().isoformat()
                    })
                    updates_count += 1
                    
                elif days_overdue >= 2 and action.get("status") not in ["ESCALATED", "ESCALATED_CORPORATE"]:
                    await db.corrective_actions.update_one(
                        {"_id": action["_id"]},
                        {"$set": {
                            "status": "ESCALATED",
                            "escalatedLevel": "Mine Manager",
                            "updatedAt": datetime.utcnow().isoformat()
                        }}
                    )
                    await db.violations.update_one(
                        {"violationId": action.get("violationId")},
                        {"$set": {"status": "ESCALATED"}}
                    )
                    await db.notifications.insert_one({
                        "role": "MINE_MANAGER",
                        "title": "Action Escalated: Overdue",
                        "message": f"Corrective action {action.get('actionId')} is overdue beyond threshold. Escalated to Mine Manager.",
                        "type": "ESCALATION",
                        "isRead": False,
                        "link": f"/corrective-actions/{action.get('actionId')}",
                        "createdAt": datetime.utcnow().isoformat()
                    })
                    updates_count += 1
                    
        return {"evaluatedCount": len(actions), "escalatedOrNotified": updates_count}
