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
