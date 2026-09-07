from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import MineCreate, MineUpdate
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from datetime import datetime

router = APIRouter(prefix="/api/mines", tags=["Mine Management"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_mine(
    mine_data: MineCreate,
    current_user: dict = Depends(require_roles(["SUPER_ADMIN", "CORPORATE_ADMIN"]))
):
    db = get_database()
    count = await db.mines.count_documents({})
    mine_id = f"MINE-{count+1:03d}"
    
    doc = mine_data.dict()
    doc["mineId"] = mine_id
    doc["createdAt"] = datetime.utcnow().isoformat()
    doc["updatedAt"] = datetime.utcnow().isoformat()
    
    res = await db.mines.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Mine Created",
        module="MINE",
        record_id=mine_id
    )

    return doc

@router.get("")
async def list_mines(current_user: dict = Depends(get_current_user)):
    db = get_database()
    # Filter by user mine if inspector or mine manager
    query = {}
    if current_user.get("role") in ["MINE_MANAGER", "INSPECTOR"] and current_user.get("mineId"):
        query = {"mineId": current_user.get("mineId")}
        
    mines = await db.mines.find(query).to_list(length=200)
    for m in mines:
        m["_id"] = str(m["_id"])
    return mines

@router.get("/{mine_id}")
async def get_mine(mine_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    mine = await db.mines.find_one({"$or": [{"mineId": mine_id}, {"_id": mine_id}]})
    if not mine:
        raise HTTPException(status_code=404, detail="Mine record not found")
    mine["_id"] = str(mine["_id"])
    
    # Enrich with counts
    inspections_count = await db.inspections.count_documents({"mineId": mine["mineId"]})
    violations_count = await db.violations.count_documents({"mineId": mine["mineId"], "status": {"$ne": "CLOSED"}})
    incidents_count = await db.incidents.count_documents({"mineId": mine["mineId"]})
    
    mine["activeInspectionsCount"] = inspections_count
    mine["openViolationsCount"] = violations_count
    mine["incidentsCount"] = incidents_count
    return mine

@router.put("/{mine_id}")
async def update_mine(
    mine_id: str,
    update_data: MineUpdate,
    current_user: dict = Depends(require_roles(["SUPER_ADMIN", "CORPORATE_ADMIN", "MINE_MANAGER"]))
):
    db = get_database()
    fields = {k: v for k, v in update_data.dict().items() if v is not None}
    fields["updatedAt"] = datetime.utcnow().isoformat()
    
    res = await db.mines.update_one(
        {"$or": [{"mineId": mine_id}, {"_id": mine_id}]},
        {"$set": fields}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Mine not found")
        
    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Mine Updated",
        module="MINE",
        record_id=mine_id
    )
    return {"message": "Mine updated successfully"}

@router.delete("/{mine_id}")
async def delete_mine(
    mine_id: str,
    current_user: dict = Depends(require_roles(["SUPER_ADMIN"]))
):
    db = get_database()
    res = await db.mines.delete_one({"$or": [{"mineId": mine_id}, {"_id": mine_id}]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mine not found")
    return {"message": "Mine deleted successfully"}


@router.post("/{mine_id}/assign-manager")
async def assign_manager(
    mine_id: str,
    payload: dict,
    current_user: dict = Depends(require_roles(["SUPER_ADMIN", "CORPORATE_ADMIN"]))
):
    """
    Assign or replace the Mine Manager for a mine.
    payload: { "userId": "USR-0001" }
    - Sets the mine's manager field to the user's name
    - Updates the user's mineId to this mine
    - Removes mineId from any previously assigned manager
    """
    db = get_database()

    mine = await db.mines.find_one({"$or": [{"mineId": mine_id}, {"_id": mine_id}]})
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=400, detail="userId is required")

    new_manager = await db.users.find_one({"userId": user_id})
    if not new_manager:
        raise HTTPException(status_code=404, detail="User not found")
    if new_manager.get("role") != "MINE_MANAGER":
        raise HTTPException(status_code=400, detail="User must have MINE_MANAGER role")

    # Clear mineId from any existing manager of this mine
    await db.users.update_many(
        {"mineId": mine_id, "role": "MINE_MANAGER"},
        {"$set": {"mineId": None, "updatedAt": datetime.utcnow().isoformat()}}
    )

    # Assign new manager
    await db.users.update_one(
        {"userId": user_id},
        {"$set": {"mineId": mine_id, "updatedAt": datetime.utcnow().isoformat()}}
    )

    # Update mine's manager field
    await db.mines.update_one(
        {"mineId": mine_id},
        {"$set": {
            "manager": new_manager.get("name"),
            "managerId": user_id,
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Mine Manager Assigned",
        module="MINE",
        record_id=mine_id,
        metadata={"newManager": new_manager.get("name"), "userId": user_id}
    )

    return {"message": f"{new_manager.get('name')} assigned as manager of {mine_id}"}


@router.delete("/{mine_id}/manager")
async def remove_manager(
    mine_id: str,
    current_user: dict = Depends(require_roles(["SUPER_ADMIN", "CORPORATE_ADMIN"]))
):
    """Remove the current manager from a mine without replacing them."""
    db = get_database()

    mine = await db.mines.find_one({"mineId": mine_id})
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    # Clear mineId from the current manager user
    if mine.get("managerId"):
        await db.users.update_one(
            {"userId": mine["managerId"]},
            {"$set": {"mineId": None, "updatedAt": datetime.utcnow().isoformat()}}
        )

    # Clear manager fields on the mine
    await db.mines.update_one(
        {"mineId": mine_id},
        {"$set": {
            "manager": "",
            "managerId": "",
            "updatedAt": datetime.utcnow().isoformat()
        }}
    )

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Mine Manager Removed",
        module="MINE",
        record_id=mine_id,
        metadata={"removedManager": mine.get("manager")}
    )

    return {"message": f"Manager removed from {mine_id}"}
