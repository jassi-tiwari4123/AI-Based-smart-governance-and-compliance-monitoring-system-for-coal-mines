from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import AttendanceCreate
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from datetime import datetime

router = APIRouter(prefix="/api/attendance", tags=["Attendance Management"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    payload: AttendanceCreate,
    current_user: dict = Depends(require_roles(["CONTRACTOR", "MINE_MANAGER", "SUPER_ADMIN"]))
):
    """Submit or overwrite attendance for a given date."""
    db = get_database()

    # Resolve mineId — use payload value, fall back to contractor's own mineId from token
    mine_id = payload.mineId or current_user.get("mineId")
    if not mine_id:
        raise HTTPException(status_code=400, detail="mineId is required. Ensure your account has a mine assigned.")

    # Upsert: one attendance document per contractor per date
    existing = await db.attendance.find_one({
        "date": payload.date,
        "contractorId": current_user.get("userId"),
        "mineId": mine_id,
    })

    doc = {
        "date":           payload.date,
        "mineId":         mine_id,
        "contractorId":   current_user.get("userId"),
        "contractorName": current_user.get("name"),
        "records":        [r.dict() for r in payload.records],
        "submittedAt":    datetime.utcnow().isoformat(),
        "updatedAt":      datetime.utcnow().isoformat(),
        # Summary counts
        "presentCount":   sum(1 for r in payload.records if r.status == "PRESENT"),
        "absentCount":    sum(1 for r in payload.records if r.status == "ABSENT"),
        "halfDayCount":   sum(1 for r in payload.records if r.status == "HALF_DAY"),
        "leaveCount":     sum(1 for r in payload.records if r.status == "LEAVE"),
        "totalWorkers":   len(payload.records),
    }

    if existing:
        await db.attendance.update_one({"_id": existing["_id"]}, {"$set": doc})
        action = "Attendance Updated"
    else:
        doc["createdAt"] = datetime.utcnow().isoformat()
        await db.attendance.insert_one(doc)
        action = "Attendance Marked"

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action=action,
        module="ATTENDANCE",
        record_id=f"{payload.mineId}-{payload.date}",
        metadata={
            "date": payload.date,
            "total": len(payload.records),
            "present": doc["presentCount"],
            "mineId": mine_id
        }
    )

    return {"message": f"Attendance {action.lower()} for {payload.date}", **doc}


@router.get("")
async def list_attendance(
    mineId: str = None,
    date: str = None,
    from_date: str = None,
    to_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Contractors see their own attendance submissions.
    Mine Manager sees all attendance for their mine.
    """
    db = get_database()
    query = {}

    role = current_user.get("role")
    if role == "CONTRACTOR":
        query["contractorId"] = current_user.get("userId")
    elif role in ("MINE_MANAGER", "CORPORATE_ADMIN", "SUPER_ADMIN"):
        if mineId:
            query["mineId"] = mineId
        elif current_user.get("mineId"):
            query["mineId"] = current_user.get("mineId")

    if date:
        query["date"] = date
    elif from_date and to_date:
        query["date"] = {"$gte": from_date, "$lte": to_date}

    records = await db.attendance.find(query).sort("date", -1).to_list(length=500)
    for r in records:
        r["_id"] = str(r["_id"])
    return records


@router.get("/today")
async def get_today_attendance(
    current_user: dict = Depends(get_current_user)
):
    """Get today's attendance for the logged-in contractor."""
    db = get_database()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    query = {"date": today}

    if current_user.get("role") == "CONTRACTOR":
        query["contractorId"] = current_user.get("userId")
    elif current_user.get("mineId"):
        query["mineId"] = current_user.get("mineId")

    records = await db.attendance.find(query).to_list(length=100)
    for r in records:
        r["_id"] = str(r["_id"])
    return records


@router.get("/summary")
async def attendance_summary(
    from_date: str = None,
    to_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Aggregate attendance summary grouped by date for the mine."""
    db = get_database()
    query = {}

    if current_user.get("role") == "CONTRACTOR":
        query["contractorId"] = current_user.get("userId")
    elif current_user.get("mineId"):
        query["mineId"] = current_user.get("mineId")

    if from_date and to_date:
        query["date"] = {"$gte": from_date, "$lte": to_date}

    records = await db.attendance.find(query).sort("date", -1).to_list(length=500)
    for r in records:
        r["_id"] = str(r["_id"])
    return records
