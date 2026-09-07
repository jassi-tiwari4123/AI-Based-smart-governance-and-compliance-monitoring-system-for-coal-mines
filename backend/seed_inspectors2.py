"""
Seeds a second inspector per mine (10 more inspectors).
Run once: python seed_inspectors2.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

INSPECTORS = [
    { "mineId": "MINE-007", "name": "Karan Mehta",         "email": "inspector2.mine007@mineguard.gov.in" },
    { "mineId": "MINE-001", "name": "Pooja Verma",          "email": "inspector2.mine001@mineguard.gov.in" },
    { "mineId": "MINE-002", "name": "Arjun Sinha",          "email": "inspector2.mine002@mineguard.gov.in" },
    { "mineId": "MINE-003", "name": "Nisha Roy",            "email": "inspector2.mine003@mineguard.gov.in" },
    { "mineId": "MINE-004", "name": "Sunil Patnaik",        "email": "inspector2.mine004@mineguard.gov.in" },
    { "mineId": "MINE-005", "name": "Kavitha Reddy",        "email": "inspector2.mine005@mineguard.gov.in" },
    { "mineId": "MINE-006", "name": "Mohan Lal",            "email": "inspector2.mine006@mineguard.gov.in" },
    { "mineId": "MINE-008", "name": "Rekha Pandey",         "email": "inspector2.mine008@mineguard.gov.in" },
    { "mineId": "MINE-009", "name": "Arun Ghosh",           "email": "inspector2.mine009@mineguard.gov.in" },
    { "mineId": "MINE-010", "name": "Divya Nair",           "email": "inspector2.mine010@mineguard.gov.in" },
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
    print(f"Password for all: {DEFAULT_PASSWORD}")

if __name__ == "__main__":
    asyncio.run(seed())
