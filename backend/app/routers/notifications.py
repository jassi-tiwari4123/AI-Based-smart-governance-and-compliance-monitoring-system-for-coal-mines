from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_database
from app.middleware.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/notifications", tags=["Notification Engine"])

@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_database()
    role = current_user.get("role")
    user_id = current_user.get("userId")

    query = {
        "$or": [
            {"role": role},
            {"role": "ALL"},
            {"userId": user_id}
        ]
    }

    notifications = await db.notifications.find(query).sort("createdAt", -1).to_list(length=100)
    for n in notifications:
        n["_id"] = str(n["_id"])
    return notifications

@router.put("/{id}/read")
async def mark_notification_read(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    res = await db.notifications.update_one(
        {"$or": [{"notificationId": id}, {"_id": id}]},
        {"$set": {"isRead": True, "readAt": datetime.utcnow().isoformat()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}
