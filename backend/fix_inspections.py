"""
Fix seeded inspection records to use correct inspector IDs.
Run once: python fix_inspections.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"

# Mine -> primary inspector
INSPECTOR_MAP = {
    "MINE-001": ("USR-0008", "Rakesh Tiwari"),
    "MINE-002": ("USR-0010", "Meena Gupta"),
    "MINE-003": ("USR-0012", "Sanjay Mondal"),
    "MINE-004": ("USR-0014", "Priya Nayak"),
    "MINE-005": ("USR-0016", "Amit Kumar Singh"),
}

async def fix():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    for mine_id, (user_id, name) in INSPECTOR_MAP.items():
        r = await db.inspections.update_many(
            {"mineId": mine_id},
            {"$set": {"inspectorId": user_id, "inspectorName": name}}
        )
        print(f"  {mine_id}: {r.modified_count} inspections → {name} ({user_id})")

    # Fix incidents too
    INCIDENT_MAP = {
        "MINE-001": ("USR-0008", "Rakesh Tiwari"),
        "MINE-002": ("USR-0010", "Meena Gupta"),
        "MINE-003": ("USR-0012", "Sanjay Mondal"),
        "MINE-004": ("USR-0014", "Priya Nayak"),
        "MINE-005": ("USR-0016", "Amit Kumar Singh"),
    }
    for mine_id, (user_id, name) in INCIDENT_MAP.items():
        r = await db.incidents.update_many(
            {"mineId": mine_id},
            {"$set": {"reporterId": user_id, "reportedBy": name}}
        )
        print(f"  {mine_id}: {r.modified_count} incidents  → {name} ({user_id})")

    client.close()
    print("\nDone.")

if __name__ == "__main__":
    asyncio.run(fix())
