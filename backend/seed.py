"""
Master seed script for MineGuard.
Seeds all mines, managers, inspectors, contractors, workers, and demo data.

Auto-runs on backend startup if the database is empty.
Can also be run manually: python seed.py
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(os.path.dirname(__file__))
from app.config import settings
from app.utils.security import hash_password

# ── Credentials ───────────────────────────────────────────────────────────────
ADMIN_PASSWORD      = "password123"
MANAGER_PASSWORD    = "Manager@1234"
INSPECTOR_PASSWORD  = "Inspector@1234"
CONTRACTOR_PASSWORD = "Contractor@1234"
SUPERADMIN_PASSWORD = "password123"

async def seed_database(db):
    print("🌱 Starting MineGuard seed...")

    # ── 1. Users ───────────────────────────────────────────────────────────────
    users = [
        # System accounts
        {
            "userId": "USR-0001",
            "email": "admin@mineguard.gov.in",
            "password": hash_password(ADMIN_PASSWORD),
            "name": "Rajesh Kumar",
            "role": "CORPORATE_ADMIN",
            "department": "Corporate Safety & Compliance",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0002",
            "email": "superadmin@mineguard.gov.in",
            "password": hash_password(SUPERADMIN_PASSWORD),
            "name": "System Administrator",
            "role": "SUPER_ADMIN",
            "department": "IT Governance",
            "createdAt": datetime.utcnow().isoformat(),
        },

        # Mine Managers
        {
            "userId": "USR-0003", "email": "manager.mine001@mineguard.gov.in",
            "password": hash_password(MANAGER_PASSWORD),
            "name": "A. K. Mukhopadhyay", "role": "MINE_MANAGER",
            "mineId": "MINE-001", "department": "Mine Operations & Safety",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0004", "email": "manager.mine002@mineguard.gov.in",
            "password": hash_password(MANAGER_PASSWORD),
            "name": "Suresh Chandra", "role": "MINE_MANAGER",
            "mineId": "MINE-002", "department": "Mine Operations & Safety",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0005", "email": "manager.mine003@mineguard.gov.in",
            "password": hash_password(MANAGER_PASSWORD),
            "name": "Debasis Banerjee", "role": "MINE_MANAGER",
            "mineId": "MINE-003", "department": "Mine Operations & Safety",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0006", "email": "manager.mine004@mineguard.gov.in",
            "password": hash_password(MANAGER_PASSWORD),
            "name": "Pradeep Mohanty", "role": "MINE_MANAGER",
            "mineId": "MINE-004", "department": "Mine Operations & Safety",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0007", "email": "manager.mine005@mineguard.gov.in",
            "password": hash_password(MANAGER_PASSWORD),
            "name": "R. N. Prasad", "role": "MINE_MANAGER",
            "mineId": "MINE-005", "department": "Mine Operations & Safety",
            "createdAt": datetime.utcnow().isoformat(),
        },

        # Inspectors — MINE-001
        {
            "userId": "USR-0008", "email": "inspector.mine001@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Rakesh Tiwari", "role": "INSPECTOR",
            "mineId": "MINE-001", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0009", "email": "inspector2.mine001@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Pooja Verma", "role": "INSPECTOR",
            "mineId": "MINE-001", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        # Inspectors — MINE-002
        {
            "userId": "USR-0010", "email": "inspector.mine002@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Meena Gupta", "role": "INSPECTOR",
            "mineId": "MINE-002", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0011", "email": "inspector2.mine002@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Arjun Sinha", "role": "INSPECTOR",
            "mineId": "MINE-002", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        # Inspectors — MINE-003
        {
            "userId": "USR-0012", "email": "inspector.mine003@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Sanjay Mondal", "role": "INSPECTOR",
            "mineId": "MINE-003", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0013", "email": "inspector2.mine003@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Nisha Roy", "role": "INSPECTOR",
            "mineId": "MINE-003", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        # Inspectors — MINE-004
        {
            "userId": "USR-0014", "email": "inspector.mine004@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Priya Nayak", "role": "INSPECTOR",
            "mineId": "MINE-004", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0015", "email": "inspector2.mine004@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Sunil Patnaik", "role": "INSPECTOR",
            "mineId": "MINE-004", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        # Inspectors — MINE-005
        {
            "userId": "USR-0016", "email": "inspector.mine005@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Amit Kumar Singh", "role": "INSPECTOR",
            "mineId": "MINE-005", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0017", "email": "inspector2.mine005@mineguard.gov.in",
            "password": hash_password(INSPECTOR_PASSWORD),
            "name": "Kavitha Reddy", "role": "INSPECTOR",
            "mineId": "MINE-005", "department": "DGMS Safety Inspection",
            "createdAt": datetime.utcnow().isoformat(),
        },

        # Contractors
        {
            "userId": "USR-0018", "email": "contractor.mine001@mineguard.gov.in",
            "password": hash_password(CONTRACTOR_PASSWORD),
            "name": "Vikram Heavy Infra", "role": "CONTRACTOR",
            "mineId": "MINE-001", "department": "Contract Labour",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0019", "email": "contractor.mine002@mineguard.gov.in",
            "password": hash_password(CONTRACTOR_PASSWORD),
            "name": "Chhattisgarh Mining Corp", "role": "CONTRACTOR",
            "mineId": "MINE-002", "department": "Contract Labour",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0020", "email": "contractor.mine003@mineguard.gov.in",
            "password": hash_password(CONTRACTOR_PASSWORD),
            "name": "Bengal Coal Services Ltd", "role": "CONTRACTOR",
            "mineId": "MINE-003", "department": "Contract Labour",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0021", "email": "contractor.mine004@mineguard.gov.in",
            "password": hash_password(CONTRACTOR_PASSWORD),
            "name": "Odisha Infra Works", "role": "CONTRACTOR",
            "mineId": "MINE-004", "department": "Contract Labour",
            "createdAt": datetime.utcnow().isoformat(),
        },
        {
            "userId": "USR-0022", "email": "contractor.mine005@mineguard.gov.in",
            "password": hash_password(CONTRACTOR_PASSWORD),
            "name": "Jharkhand Mining Solutions", "role": "CONTRACTOR",
            "mineId": "MINE-005", "department": "Contract Labour",
            "createdAt": datetime.utcnow().isoformat(),
        },
    ]
    await db.users.drop()
    await db.users.insert_many(users)
    print(f"  ✓ {len(users)} users seeded")

    # ── 2. Mines ───────────────────────────────────────────────────────────────
    mines = [
        {
            "mineId": "MINE-001", "name": "Dhanbad Opencast Pit #4",
            "location": "Jharia Coalfield", "state": "Jharkhand", "district": "Dhanbad",
            "latitude": 23.7957, "longitude": 86.4304,
            "manager": "A. K. Mukhopadhyay", "managerId": "USR-0003",
            "operationalStatus": "Operational", "complianceScore": 74.2, "riskLevel": "HIGH",
            "createdAt": (datetime.utcnow() - timedelta(days=120)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        },
        {
            "mineId": "MINE-002", "name": "Gevra Mega Open Cast Mine",
            "location": "Korba Coalfield", "state": "Chhattisgarh", "district": "Korba",
            "latitude": 22.3486, "longitude": 82.6841,
            "manager": "Suresh Chandra", "managerId": "USR-0004",
            "operationalStatus": "Operational", "complianceScore": 89.0, "riskLevel": "MEDIUM",
            "createdAt": (datetime.utcnow() - timedelta(days=150)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        },
        {
            "mineId": "MINE-003", "name": "Raniganj Underground Sector B",
            "location": "Asansol Belt", "state": "West Bengal", "district": "Paschim Bardhaman",
            "latitude": 23.6889, "longitude": 86.9661,
            "manager": "Debasis Banerjee", "managerId": "USR-0005",
            "operationalStatus": "Under Maintenance", "complianceScore": 91.5, "riskLevel": "LOW",
            "createdAt": (datetime.utcnow() - timedelta(days=200)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        },
        {
            "mineId": "MINE-004", "name": "Ib Valley Open Cast Pit #2",
            "location": "Jharsuguda", "state": "Odisha", "district": "Jharsuguda",
            "latitude": 21.8557, "longitude": 83.9234,
            "manager": "Pradeep Mohanty", "managerId": "USR-0006",
            "operationalStatus": "Operational", "complianceScore": 82.4, "riskLevel": "MEDIUM",
            "createdAt": (datetime.utcnow() - timedelta(days=100)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        },
        {
            "mineId": "MINE-005", "name": "Rajrappa Open Pit & Washery",
            "location": "Ramgarh", "state": "Jharkhand", "district": "Ramgarh",
            "latitude": 23.6300, "longitude": 85.7100,
            "manager": "R. N. Prasad", "managerId": "USR-0007",
            "operationalStatus": "Operational", "complianceScore": 86.0, "riskLevel": "LOW",
            "createdAt": (datetime.utcnow() - timedelta(days=80)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        },
    ]
    await db.mines.drop()
    await db.mines.insert_many(mines)
    print(f"  ✓ {len(mines)} mines seeded")

    # ── 3. Workers ─────────────────────────────────────────────────────────────
    workers_data = [
        # MINE-001 — Vikram Heavy Infra (USR-0018)
        {"mineId": "MINE-001", "contractorId": "USR-0018", "contractorName": "Vikram Heavy Infra",
         "workers": [
             {"name": "Raju Prasad",   "role": "Driller",         "shift": "DAY"},
             {"name": "Mukesh Yadav",  "role": "Blaster",         "shift": "DAY"},
             {"name": "Santosh Kumar", "role": "Loader Operator", "shift": "DAY"},
             {"name": "Ramji Lal",     "role": "Haulage Driver",  "shift": "NIGHT"},
             {"name": "Dinesh Mahato", "role": "General Labour",  "shift": "NIGHT"},
         ]},
        # MINE-002 — Chhattisgarh Mining Corp (USR-0019)
        {"mineId": "MINE-002", "contractorId": "USR-0019", "contractorName": "Chhattisgarh Mining Corp",
         "workers": [
             {"name": "Arun Sahu",       "role": "Driller",         "shift": "DAY"},
             {"name": "Bhola Nath",      "role": "Blaster",         "shift": "DAY"},
             {"name": "Ramesh Dewangan", "role": "Loader Operator", "shift": "DAY"},
             {"name": "Sukhram Patel",   "role": "Haulage Driver",  "shift": "NIGHT"},
             {"name": "Kamlesh Verma",   "role": "General Labour",  "shift": "NIGHT"},
         ]},
        # MINE-003 — Bengal Coal Services (USR-0020)
        {"mineId": "MINE-003", "contractorId": "USR-0020", "contractorName": "Bengal Coal Services Ltd",
         "workers": [
             {"name": "Tapan Das",     "role": "Driller",         "shift": "DAY"},
             {"name": "Prodip Ghosh",  "role": "Blaster",         "shift": "DAY"},
             {"name": "Sourav Mandal", "role": "Loader Operator", "shift": "DAY"},
             {"name": "Biswanath Roy", "role": "Haulage Driver",  "shift": "NIGHT"},
             {"name": "Nirmal Bose",   "role": "General Labour",  "shift": "NIGHT"},
         ]},
        # MINE-004 — Odisha Infra Works (USR-0021)
        {"mineId": "MINE-004", "contractorId": "USR-0021", "contractorName": "Odisha Infra Works",
         "workers": [
             {"name": "Bijaya Patra",    "role": "Driller",         "shift": "DAY"},
             {"name": "Hrushikesh Das",  "role": "Blaster",         "shift": "DAY"},
             {"name": "Sridhar Nayak",   "role": "Loader Operator", "shift": "DAY"},
             {"name": "Gobinda Sahoo",   "role": "Haulage Driver",  "shift": "NIGHT"},
             {"name": "Pradip Behera",   "role": "General Labour",  "shift": "NIGHT"},
         ]},
        # MINE-005 — Jharkhand Mining Solutions (USR-0022)
        {"mineId": "MINE-005", "contractorId": "USR-0022", "contractorName": "Jharkhand Mining Solutions",
         "workers": [
             {"name": "Sunil Mahto",  "role": "Driller",         "shift": "DAY"},
             {"name": "Deepak Oraon", "role": "Blaster",         "shift": "DAY"},
             {"name": "Birsa Munda",  "role": "Loader Operator", "shift": "DAY"},
             {"name": "Ganesh Turi",  "role": "Haulage Driver",  "shift": "NIGHT"},
             {"name": "Ratan Hansda", "role": "General Labour",  "shift": "NIGHT"},
         ]},
    ]

    all_workers = []
    w_num = 1
    for group in workers_data:
        for w in group["workers"]:
            all_workers.append({
                "workerId":       f"WRK-{w_num:04d}",
                "name":           w["name"],
                "role":           w["role"],
                "shift":          w["shift"],
                "mineId":         group["mineId"],
                "contractorId":   group["contractorId"],
                "contractorName": group["contractorName"],
                "active":         True,
                "createdAt":      datetime.utcnow().isoformat(),
            })
            w_num += 1

    await db.workers.drop()
    await db.workers.insert_many(all_workers)
    print(f"  ✓ {len(all_workers)} workers seeded")

    # ── 4. Sample inspections, violations, incidents ───────────────────────────
    categories = ["SAFETY", "ENVIRONMENT", "PRODUCTION", "LABOUR"]
    zones      = ["Zone A", "Zone B", "Zone C", "Pit #1", "Haulage Corridor"]
    mine_ids   = ["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"]
    inspector_map = {
        "MINE-001": ("USR-0008", "Rakesh Tiwari"),
        "MINE-002": ("USR-0010", "Meena Gupta"),
        "MINE-003": ("USR-0012", "Sanjay Mondal"),
        "MINE-004": ("USR-0014", "Priya Nayak"),
        "MINE-005": ("USR-0016", "Amit Kumar Singh"),
    }
    inspector_name_map = {
        "MINE-001": "Rakesh Tiwari",
        "MINE-002": "Meena Gupta",
        "MINE-003": "Sanjay Mondal",
        "MINE-004": "Priya Nayak",
        "MINE-005": "Amit Kumar Singh",
    }

    inspections = []
    for i in range(1, 26):
        m_id = mine_ids[i % 5]
        cat  = categories[i % 4]
        sev  = "CRITICAL" if i % 8 == 0 else ("MAJOR" if i % 3 == 0 else "MINOR")
        inspections.append({
            "inspectionId":   f"INS-2026-{i:04d}",
            "mineId":         m_id,
            "zone":           zones[i % 5],
            "category":       cat,
            "inspectorId":    inspector_map[m_id],
            "inspectorName":  inspector_name_map[m_id],
            "inspectionDate": (datetime.utcnow() - timedelta(days=i*3)).isoformat(),
            "observations":   f"Statutory {cat.lower()} inspection at {zones[i%5]}. Compliance parameters checked.",
            "checklist": [
                {"item": "PPE Compliance",           "status": "FAIL" if sev == "CRITICAL" else "PASS"},
                {"item": "Ventilation Check",        "status": "PASS"},
                {"item": "Haul Road Sprinklers",     "status": "PASS" if i % 2 == 0 else "FAIL"},
                {"item": "Fire Safety Equipment",    "status": "PASS"},
                {"item": "Emergency Exits Clear",    "status": "PASS"},
                {"item": "Machinery Inspection Tags","status": "PASS" if sev != "MAJOR" else "FAIL"},
            ],
            "severity":    sev,
            "gpsLocation": {"lat": 23.0 + (i * 0.01), "lng": 85.0 + (i * 0.01)},
            "photos":      [],
            "status":      "REVIEWED" if i > 10 else "SUBMITTED",
            "createdAt":   (datetime.utcnow() - timedelta(days=i*3)).isoformat(),
            "updatedAt":   datetime.utcnow().isoformat(),
        })
    await db.inspections.drop()
    await db.inspections.insert_many(inspections)
    print(f"  ✓ {len(inspections)} inspections seeded")

    violations = []
    for i in range(1, 16):
        m_id = mine_ids[i % 5]
        cat  = categories[i % 4]
        sev  = "CRITICAL" if i % 5 == 0 else ("MAJOR" if i % 2 == 0 else "MINOR")
        rs   = 75 if sev == "CRITICAL" else (50 if sev == "MAJOR" else 25)
        violations.append({
            "violationId":  f"VIO-2026-{i:04d}",
            "mineId":       m_id,
            "inspectionId": f"INS-2026-{i:04d}",
            "category":     cat,
            "title":        f"{cat} non-compliance detected at {m_id}",
            "description":  f"Field observation identified deviation from statutory {cat.lower()} standard.",
            "severity":     sev,
            "regulation":   "Coal Mines Regulations 2017",
            "detectedDate": (datetime.utcnow() - timedelta(days=i*3)).isoformat(),
            "assignedTo":   "",
            "dueDate":      (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "status":       "OPEN",
            "riskScore":    rs,
            "riskLevel":    "HIGH" if rs >= 61 else ("MEDIUM" if rs >= 31 else "LOW"),
            "evidence":     [],
            "gpsLocation":  {"lat": 23.0 + (i * 0.01), "lng": 85.0 + (i * 0.01)},
            "createdAt":    (datetime.utcnow() - timedelta(days=i*3)).isoformat(),
            "updatedAt":    datetime.utcnow().isoformat(),
        })
    await db.violations.drop()
    await db.violations.insert_many(violations)
    print(f"  ✓ {len(violations)} violations seeded")

    incidents = []
    for i in range(1, 11):
        m_id = mine_ids[i % 5]
        incidents.append({
            "incidentId":  f"INC-2026-{i:04d}",
            "mineId":      m_id,
            "zone":        zones[i % 5],
            "category":    categories[i % 4],
            "severity":    "MAJOR" if i % 2 == 0 else "MINOR",
            "description": f"Near-miss incident at {zones[i%5]} involving heavy machinery.",
            "reportedBy":  inspector_name_map[m_id],
            "reporterId":  inspector_map[m_id],
            "reportedAt":  (datetime.utcnow() - timedelta(days=i*4)).isoformat(),
            "gpsLocation": {"lat": 23.0 + (i * 0.01), "lng": 85.0 + (i * 0.01)},
            "photos":      [],
            "status":      "REPORTED",
            "createdAt":   (datetime.utcnow() - timedelta(days=i*4)).isoformat(),
        })
    await db.incidents.drop()
    await db.incidents.insert_many(incidents)
    print(f"  ✓ {len(incidents)} incidents seeded")

    # ── 5. Notifications ───────────────────────────────────────────────────────
    await db.notifications.drop()
    await db.notifications.insert_many([
        {
            "role": "CORPORATE_ADMIN",
            "title": "MineGuard Platform Ready",
            "message": "System seeded successfully. All mines, managers, and inspectors are active.",
            "type": "SYSTEM",
            "isRead": False,
            "link": "/dashboard",
            "createdAt": datetime.utcnow().isoformat(),
        }
    ])

    print("\n✅ Seed complete!")
    print("─" * 55)
    print(f"  Corporate Admin : admin@mineguard.gov.in / {ADMIN_PASSWORD}")
    print(f"  Super Admin     : superadmin@mineguard.gov.in / {SUPERADMIN_PASSWORD}")
    print(f"  Mine Managers   : manager.mineXXX@mineguard.gov.in / {MANAGER_PASSWORD}")
    print(f"  Inspectors      : inspector.mineXXX@mineguard.gov.in / {INSPECTOR_PASSWORD}")
    print(f"  Contractors     : contractor.mineXXX@mineguard.gov.in / {CONTRACTOR_PASSWORD}")
    print(f"  (XXX = 001 to 005)")
    print("─" * 55)


async def run_seed_if_empty():
    """Called from main.py on startup — only seeds if DB is empty."""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db     = client[settings.DATABASE_NAME]
    count  = await db.users.count_documents({})
    if count == 0:
        print("📭 Database is empty — running auto-seed...")
        await seed_database(db)
    else:
        print(f"✅ Database already has {count} users — skipping auto-seed.")
    client.close()


if __name__ == "__main__":
    async def main():
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db     = client[settings.DATABASE_NAME]
        await seed_database(db)
        client.close()
    asyncio.run(main())
