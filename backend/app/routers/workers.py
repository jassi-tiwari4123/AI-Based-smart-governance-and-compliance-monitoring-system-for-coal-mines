from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.all_schemas import WorkerCreate, WorkerUpdate
from app.database.connection import get_database
from app.middleware.auth import get_current_user, require_roles
from app.services.audit.audit_service import log_audit_event
from datetime import datetime

router = APIRouter(prefix="/api/workers", tags=["Worker Management"])


@router.get("")
async def list_workers(
    current_user: dict = Depends(get_current_user)
):
    """
    Contractors see only their own workers.
    Mine Manager / Corporate Admin see all workers for their mine.
    """
    db = get_database()
    query = {"active": True}

    role = current_user.get("role")
    if role == "CONTRACTOR":
        query["contractorId"] = current_user.get("userId")
    elif role in ("MINE_MANAGER", "CORPORATE_ADMIN", "SUPER_ADMIN"):
        mine_id = current_user.get("mineId")
        if mine_id:
            query["mineId"] = mine_id
    # SUPER_ADMIN with no mineId gets all workers

    workers = await db.workers.find(query).sort("name", 1).to_list(length=500)
    for w in workers:
        w["_id"] = str(w["_id"])
    return workers


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_worker(
    worker_data: WorkerCreate,
    current_user: dict = Depends(require_roles(["CONTRACTOR", "MINE_MANAGER", "SUPER_ADMIN"]))
):
    db = get_database()
    count = await db.workers.count_documents({})
    worker_id = f"WRK-{count + 1:04d}"

    doc = worker_data.dict()
    doc["workerId"]     = worker_id
    doc["mineId"]       = current_user.get("mineId")
    doc["contractorId"] = current_user.get("userId")
    doc["contractorName"] = current_user.get("name")
    doc["active"]       = True
    doc["createdAt"]    = datetime.utcnow().isoformat()

    await db.workers.insert_one(doc)
    doc["_id"] = str(doc.get("_id", ""))

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Worker Added",
        module="ATTENDANCE",
        record_id=worker_id,
        metadata={"name": doc["name"], "mineId": doc["mineId"]}
    )
    return doc


@router.put("/{worker_id}")
async def update_worker(
    worker_id: str,
    payload: WorkerUpdate,
    current_user: dict = Depends(require_roles(["CONTRACTOR", "MINE_MANAGER", "SUPER_ADMIN"]))
):
    db = get_database()
    worker = await db.workers.find_one({"workerId": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Contractors can only update their own workers
    if current_user.get("role") == "CONTRACTOR" and worker.get("contractorId") != current_user.get("userId"):
        raise HTTPException(status_code=403, detail="Cannot update a worker not assigned to you")

    update = {k: v for k, v in payload.dict().items() if v is not None}
    update["updatedAt"] = datetime.utcnow().isoformat()
    await db.workers.update_one({"workerId": worker_id}, {"$set": update})
    return {"message": "Worker updated"}


@router.delete("/{worker_id}")
async def remove_worker(
    worker_id: str,
    current_user: dict = Depends(require_roles(["CONTRACTOR", "MINE_MANAGER", "SUPER_ADMIN"]))
):
    db = get_database()
    worker = await db.workers.find_one({"workerId": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if current_user.get("role") == "CONTRACTOR" and worker.get("contractorId") != current_user.get("userId"):
        raise HTTPException(status_code=403, detail="Cannot remove a worker not assigned to you")

    # Soft delete
    await db.workers.update_one(
        {"workerId": worker_id},
        {"$set": {"active": False, "updatedAt": datetime.utcnow().isoformat()}}
    )

    await log_audit_event(
        user_id=current_user.get("userId"),
        user_email=current_user["email"],
        role=current_user["role"],
        action="Worker Removed",
        module="ATTENDANCE",
        record_id=worker_id,
        metadata={"name": worker.get("name")}
    )
    return {"message": f"Worker {worker_id} removed"}
