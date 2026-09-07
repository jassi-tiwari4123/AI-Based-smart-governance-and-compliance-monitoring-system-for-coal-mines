"""
Seeds 1 contractor + 5 workers per mine (5 mines).
Run once: python seed_contractors.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_PASSWORD = "Contractor@1234"

CONTRACTORS = [
    {
        "mineId": "MINE-001",
        "name":   "Vikram Heavy Infra",
        "email":  "contractor.mine001@mineguard.gov.in",
        "workers": [
            {"name": "Raju Prasad",    "role": "Driller",          "shift": "DAY"},
            {"name": "Mukesh Yadav",   "role": "Blaster",          "shift": "DAY"},
            {"name": "Santosh Kumar",  "role": "Loader Operator",  "shift": "DAY"},
            {"name": "Ramji Lal",      "role": "Haulage Driver",   "shift": "NIGHT"},
            {"name": "Dinesh Mahato",  "role": "General Labour",   "shift": "NIGHT"},
        ]
    },
    {
        "mineId": "MINE-002",
        "name":   "Chhattisgarh Mining Corp",
        "email":  "contractor.mine002@mineguard.gov.in",
        "workers": [
            {"name": "Arun Sahu",      "role": "Driller",          "shift": "DAY"},
            {"name": "Bhola Nath",     "role": "Blaster",          "shift": "DAY"},
            {"name": "Ramesh Dewangan","role": "Loader Operator",  "shift": "DAY"},
            {"name": "Sukhram Patel",  "role": "Haulage Driver",   "shift": "NIGHT"},
            {"name": "Kamlesh Verma",  "role": "General Labour",   "shift": "NIGHT"},
        ]
    },
    {
        "mineId": "MINE-003",
        "name":   "Bengal Coal Services Ltd",
        "email":  "contractor.mine003@mineguard.gov.in",
        "workers": [
            {"name": "Tapan Das",      "role": "Driller",          "shift": "DAY"},
            {"name": "Prodip Ghosh",   "role": "Blaster",          "shift": "DAY"},
            {"name": "Sourav Mandal",  "role": "Loader Operator",  "shift": "DAY"},
            {"name": "Biswanath Roy",  "role": "Haulage Driver",   "shift": "NIGHT"},
            {"name": "Nirmal Bose",    "role": "General Labour",   "shift": "NIGHT"},
        ]
    },
    {
        "mineId": "MINE-004",
        "name":   "Odisha Infra Works",
        "email":  "contractor.mine004@mineguard.gov.in",
        "workers": [
            {"name": "Bijaya Patra",   "role": "Driller",          "shift": "DAY"},
            {"name": "Hrushikesh Das", "role": "Blaster",          "shift": "DAY"},
            {"name": "Sridhar Nayak",  "role": "Loader Operator",  "shift": "DAY"},
            {"name": "Gobinda Sahoo",  "role": "Haulage Driver",   "shift": "NIGHT"},
            {"name": "Pradip Behera",  "role": "General Labour",   "shift": "NIGHT"},
        ]
    },
    {
        "mineId": "MINE-005",
        "name":   "Jharkhand Mining Solutions",
        "email":  "contractor.mine005@mineguard.gov.in",
        "workers": [
            {"name": "Sunil Mahto",    "role": "Driller",          "shift": "DAY"},
            {"name": "Deepak Oraon",   "role": "Blaster",          "shift": "DAY"},
            {"name": "Birsa Munda",    "role": "Loader Operator",  "shift": "DAY"},
            {"name": "Ganesh Turi",    "role": "Haulage Driver",   "shift": "NIGHT"},
            {"name": "Ratan Hansda",   "role": "General Labour",   "shift": "NIGHT"},
        ]
    },
]


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db     = client[DATABASE_NAME]

    user_count   = await db.users.count_documents({})
    worker_count = await db.workers.count_documents({})
    c_created = 0
    w_created = 0

    for c in CONTRACTORS:
        # ── Contractor user account ──────────────────────────────────────
        existing = await db.users.find_one({"email": c["email"]})
        if existing:
            contractor_id = existing["userId"]
            print(f"  SKIP contractor {c['email']} — already exists")
        else:
            user_count += 1
            contractor_id = f"USR-{user_count:04d}"
            await db.users.insert_one({
                "userId":     contractor_id,
                "email":      c["email"],
                "password":   pwd_context.hash(DEFAULT_PASSWORD),
                "name":       c["name"],
                "role":       "CONTRACTOR",
                "mineId":     c["mineId"],
                "department": "Contract Labour",
                "addedBy":    "seed_script",
                "createdAt":  datetime.utcnow().isoformat(),
            })
            print(f"  CREATE {contractor_id}  {c['name']:30s}  {c['email']}  →  {c['mineId']}")
            c_created += 1

        # ── 5 workers for this contractor ────────────────────────────────
        for w in c["workers"]:
            worker_count += 1
            worker_id = f"WRK-{worker_count:04d}"
            # avoid duplicates by name+mine
            ex_w = await db.workers.find_one({"name": w["name"], "mineId": c["mineId"]})
            if ex_w:
                continue
            await db.workers.insert_one({
                "workerId":     worker_id,
                "name":         w["name"],
                "role":         w["role"],
                "shift":        w["shift"],
                "mineId":       c["mineId"],
                "contractorId": contractor_id,
                "contractorName": c["name"],
                "active":       True,
                "createdAt":    datetime.utcnow().isoformat(),
            })
            print(f"    + worker {worker_id}  {w['name']:20s}  {w['role']:18s}  {w['shift']}")
            w_created += 1

    client.close()
    print(f"\nDone. Contractors created: {c_created}  Workers created: {w_created}")
    print(f"Contractor password: {DEFAULT_PASSWORD}")

if __name__ == "__main__":
    asyncio.run(seed())
