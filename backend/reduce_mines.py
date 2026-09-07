"""
Keeps MINE-001 to MINE-005, removes MINE-006 to MINE-010
along with their managers and inspectors.
Run once: python reduce_mines.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"

KEEP    = {"MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"}
REMOVE  = {"MINE-006", "MINE-007", "MINE-008", "MINE-009", "MINE-010"}

async def reduce():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    # 1. Remove mines
    r = await db.mines.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Mines removed: {r.deleted_count}")

    # 2. Remove users (managers + inspectors) assigned to those mines
    r = await db.users.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Users removed: {r.deleted_count}")

    # 3. Clean up any related data
    r = await db.inspections.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Inspections removed: {r.deleted_count}")

    r = await db.violations.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Violations removed: {r.deleted_count}")

    r = await db.incidents.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Incidents removed: {r.deleted_count}")

    r = await db.corrective_actions.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Corrective actions removed: {r.deleted_count}")

    r = await db.attendance.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Attendance records removed: {r.deleted_count}")

    r = await db.workers.delete_many({"mineId": {"$in": list(REMOVE)}})
    print(f"Workers removed: {r.deleted_count}")

    # 4. Verify what's left
    print("\n--- Remaining mines ---")
    mines = await db.mines.find({}, {"mineId":1, "name":1, "manager":1}).to_list(10)
    for m in mines:
        print(f"  {m['mineId']} | {m['name']} | {m.get('manager','—')}")

    print("\n--- Remaining users (non-admin) ---")
    users = await db.users.find(
        {"role": {"$in": ["MINE_MANAGER", "INSPECTOR", "CONTRACTOR"]}},
        {"userId":1, "name":1, "role":1, "mineId":1}
    ).to_list(30)
    for u in users:
        print(f"  {u['userId']} | {u['role']:15s} | {u.get('mineId','—'):10s} | {u['name']}")

    client.close()
    print("\nDone.")

if __name__ == "__main__":
    asyncio.run(reduce())
