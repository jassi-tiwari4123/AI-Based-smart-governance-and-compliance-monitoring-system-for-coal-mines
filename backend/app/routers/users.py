from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import UserRegister
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.utils.security import hash_password
from app.services.audit.audit_service import log_audit_event
from datetime import datetime

router = APIRouter(prefix="/api/users", tags=["User Management"])


@router.get("/mine")
async def list_mine_users(
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "CORPORATE_ADMIN"]))
):
    """List all Inspectors and Contractors assigned to the current manager's mine."""
    db = get_database()
    mine_id = current_user.get("mineId")
    if not mine_id:
        raise HTTPException(status_code=400, detail="Manager has no mineId assigned")

    users = await db.users.find(
        {"mineId": mine_id, "role": {"$in": ["INSPECTOR", "CONTRACTOR"]}},
        {"password": 0}          # never return hashed password
    ).sort("role", 1).to_list(length=200)

    for u in users:
        u["_id"] = str(u["_id"])
    return users


@router.post("/mine", status_code=status.HTTP_201_CREATED)
async def add_mine_user(
    user_data: UserRegister,
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "CORPORATE_ADMIN"]))
):
    """Create a new Inspector or Contractor and assign them to the manager's mine."""
    if user_data.role not in ("INSPECTOR", "CONTRACTOR"):
        raise HTTPException(status_code=400, detail="Mine Manager can only add INSPECTOR or CONTRACTOR accounts")

    db = get_database()
    mine_id = current_user.get("mineId")
    if not mine_id:
        raise HTTPException(status_code=400, detail="Manager has no mineId assigned")

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    count = await db.users.count_documents({})
    user_id = f"USR-{count + 1:04d}"

    doc = {
        "userId":     user_id,
        "email":      user_data.email,
        "password":   hash_password(user_data.password),
        "name":       user_data.name,
        "role":       user_data.role,
        "mineId":     mine_id,          # always scoped to manager's mine
        "department": user_data.department or "Mining Operations",
        "addedBy":    current_user.get("userId"),
        "createdAt":  datetime.utcnow().isoformat(),
    }

    res = await db.users.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    doc.pop("password", None)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action=f"{user_data.role} Added to Mine",
        module="USER_MANAGEMENT",
        record_id=user_id,
        metadata={"name": user_data.name, "email": user_data.email, "mineId": mine_id}
    )

    return doc


@router.delete("/mine/{user_id}", status_code=status.HTTP_200_OK)
async def remove_mine_user(
    user_id: str,
    current_user: dict = Depends(require_roles(["MINE_MANAGER", "CORPORATE_ADMIN"]))
):
    """Remove an Inspector or Contractor from the manager's mine."""
    db = get_database()
    mine_id = current_user.get("mineId")

    target = await db.users.find_one({"userId": user_id})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("mineId") != mine_id:
        raise HTTPException(status_code=403, detail="Cannot remove a user from a different mine")
    if target.get("role") not in ("INSPECTOR", "CONTRACTOR"):
        raise HTTPException(status_code=403, detail="Can only remove INSPECTOR or CONTRACTOR accounts")

    await db.users.delete_one({"userId": user_id})

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action=f"{target['role']} Removed from Mine",
        module="USER_MANAGEMENT",
        record_id=user_id,
        metadata={"name": target.get("name"), "email": target.get("email"), "mineId": mine_id}
    )

    return {"message": f"User {user_id} removed successfully"}


@router.get("/managers")
async def list_managers(
    current_user: dict = Depends(require_roles(["CORPORATE_ADMIN", "SUPER_ADMIN"]))
):
    """List all MINE_MANAGER users — for Corporate Admin's assign manager dropdown."""
    db = get_database()
    users = await db.users.find(
        {"role": "MINE_MANAGER"},
        {"password": 0}
    ).sort("name", 1).to_list(length=200)
    for u in users:
        u["_id"] = str(u["_id"])
    return users
