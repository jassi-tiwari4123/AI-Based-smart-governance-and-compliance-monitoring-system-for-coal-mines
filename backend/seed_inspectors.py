"""
Seeds one inspector per mine (10 inspectors total).
Run once: python seed_inspectors.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

INSPECTORS = [
    { "mineId": "MINE-007", "name": "Ananya Sharma",      "email": "inspector.mine007@mineguard.gov.in" },
    { "mineId": "MINE-001", "name": "Rakesh Tiwari",       "email": "inspector.mine001@mineguard.gov.in" },
    { "mineId": "MINE-002", "name": "Meena Gupta",         "email": "inspector.mine002@mineguard.gov.in" },
    { "mineId": "MINE-003", "name": "Sanjay Mondal",       "email": "inspector.mine003@mineguard.gov.in" },
    { "mineId": "MINE-004", "name": "Priya Nayak",         "email": "inspector.mine004@mineguard.gov.in" },
    { "mineId": "MINE-005", "name": "Amit Kumar Singh",    "email": "inspector.mine005@mineguard.gov.in" },
    { "mineId": "MINE-006", "name": "Deepa Sharma",        "email": "inspector.mine006@mineguard.gov.in" },
    { "mineId": "MINE-008", "name": "Vijay Shukla",        "email": "inspector.mine008@mineguard.gov.in" },
    { "mineId": "MINE-009", "name": "Sunita Das",          "email": "inspector.mine009@mineguard.gov.in" },
    { "mineId": "MINE-010", "name": "Ramesh Pillai",       "email": "inspector.mine010@mineguard.gov.in" },
]

DEFAULT_PASSWORD = "Inspector@1234"

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    count   = await db.users.count_documents({})
    created = 0
    skipped = 0

    for ins in INSPECTORS:
        existing = await db.users.find_one({"email": ins["email"]})
        if existing:
            print(f"  SKIP  {ins['email']} — already exists")
            skipped += 1
            continue

        count += 1
        user_id = f"USR-{count:04d}"

        doc = {
            "userId":     user_id,
            "email":      ins["email"],
            "password":   pwd_context.hash(DEFAULT_PASSWORD),
            "name":       ins["name"],
            "role":       "INSPECTOR",
            "mineId":     ins["mineId"],
            "department": "DGMS Safety Inspection",
            "addedBy":    "seed_script",
            "createdAt":  datetime.utcnow().isoformat(),
        }
        await db.users.insert_one(doc)
        print(f"  CREATE {user_id}  {ins['name']:25s}  {ins['email']}  →  {ins['mineId']}")
        created += 1

    client.close()
    print(f"\nDone. Created: {created}  Skipped: {skipped}")
    print(f"Default password for all inspectors: {DEFAULT_PASSWORD}")

if __name__ == "__main__":
    asyncio.run(seed())
