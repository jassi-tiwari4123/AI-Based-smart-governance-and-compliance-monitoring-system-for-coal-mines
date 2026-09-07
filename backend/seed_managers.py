"""
Run this script once to create MINE_MANAGER user accounts
for all 10 seeded mines and link them.

Usage:
    cd backend
    python seed_managers.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Each manager maps to the mineId already in the database
MANAGERS = [
    { "mineId": "MINE-007", "name": "Subhashish Panda",    "email": "manager.mine007@mineguard.gov.in" },
    { "mineId": "MINE-001", "name": "A. K. Mukhopadhyay",  "email": "manager.mine001@mineguard.gov.in" },
    { "mineId": "MINE-002", "name": "Suresh Chandra",       "email": "manager.mine002@mineguard.gov.in" },
    { "mineId": "MINE-003", "name": "Debasis Banerjee",     "email": "manager.mine003@mineguard.gov.in" },
    { "mineId": "MINE-004", "name": "Pradeep Mohanty",      "email": "manager.mine004@mineguard.gov.in" },
    { "mineId": "MINE-005", "name": "R. N. Prasad",         "email": "manager.mine005@mineguard.gov.in" },
    { "mineId": "MINE-006", "name": "M. K. Verma",          "email": "manager.mine006@mineguard.gov.in" },
    { "mineId": "MINE-008", "name": "S. K. Tripathi",       "email": "manager.mine008@mineguard.gov.in" },
    { "mineId": "MINE-009", "name": "P. C. Mahanta",        "email": "manager.mine009@mineguard.gov.in" },
    { "mineId": "MINE-010", "name": "V. Raghunathan",       "email": "manager.mine010@mineguard.gov.in" },
]

DEFAULT_PASSWORD = "Manager@1234"


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    count = await db.users.count_documents({})
    created = 0
    skipped = 0

    for mgr in MANAGERS:
        existing = await db.users.find_one({"email": mgr["email"]})
        if existing:
            print(f"  SKIP  {mgr['email']} — already exists")
            skipped += 1
            continue

        count += 1
        user_id = f"USR-{count:04d}"

        user_doc = {
            "userId":     user_id,
            "email":      mgr["email"],
            "password":   pwd_context.hash(DEFAULT_PASSWORD),
            "name":       mgr["name"],
            "role":       "MINE_MANAGER",
            "mineId":     mgr["mineId"],
            "department": "Mine Operations & Safety",
            "addedBy":    "seed_script",
            "createdAt":  datetime.utcnow().isoformat(),
        }
        await db.users.insert_one(user_doc)

        # Link the user as managerId on the mine document
        await db.mines.update_one(
            {"mineId": mgr["mineId"]},
            {"$set": {
                "managerId": user_id,
                "updatedAt": datetime.utcnow().isoformat(),
            }}
        )

        print(f"  CREATE {user_id}  {mgr['name']:25s}  {mgr['email']}  →  {mgr['mineId']}")
        created += 1

    client.close()
    print(f"\nDone. Created: {created}  Skipped: {skipped}")
    print(f"Default password for all new managers: {DEFAULT_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
