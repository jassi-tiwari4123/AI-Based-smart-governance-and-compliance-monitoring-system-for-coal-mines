"""
Removes the old duplicate demo manager account and updates MINE-007 link.
Run once: python fix_managers.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"

MANAGERS = [
    { "mineId": "MINE-007", "userId": "USR-0007" },
    { "mineId": "MINE-001", "userId": "USR-0008" },
    { "mineId": "MINE-002", "userId": "USR-0009" },
    { "mineId": "MINE-003", "userId": "USR-0010" },
    { "mineId": "MINE-004", "userId": "USR-0011" },
    { "mineId": "MINE-005", "userId": "USR-0012" },
    { "mineId": "MINE-006", "userId": "USR-0013" },
    { "mineId": "MINE-008", "userId": "USR-0014" },
    { "mineId": "MINE-009", "userId": "USR-0015" },
    { "mineId": "MINE-010", "userId": "USR-0016" },
]

async def fix():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    # Remove old demo manager@mineguard.gov.in (USR-0002) - duplicate of USR-0007
    res = await db.users.delete_one({"userId": "USR-0002"})
    print(f"Deleted old demo manager account (USR-0002): {res.deleted_count}")

    # Make sure every mine's managerId points to the correct user
    for m in MANAGERS:
        await db.mines.update_one(
            {"mineId": m["mineId"]},
            {"$set": {"managerId": m["userId"], "updatedAt": datetime.utcnow().isoformat()}}
        )
        print(f"  {m['mineId']} -> {m['userId']}")

    print("\nAll done. Each mine now has one proper manager account.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix())
