import asyncio
import sys
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# Add current dir to path
sys.path.append(os.path.dirname(__file__))

from app.config import settings
from app.utils.security import hash_password

async def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    # Drop existing collections to reset clean seed
    collections = [
        "users", "mines", "inspections", "violations", "incidents",
        "corrective_actions", "notifications", "audit_trails", "documents",
        "regulations", "compliance_rules", "historical_violations", "sops",
        "mine_profiles", "contractor_profiles"
    ]
    for col in collections:
        await db[col].drop()
    print("Cleared existing collections.")

    hashed_pwd = hash_password("password123")

    # 1. SEED DEMO USERS
    demo_users = [
        {
            "userId": "USR-0001",
            "email": "admin@mineguard.gov.in",
            "password": hashed_pwd,
            "name": "Rajesh Kumar (Corporate Admin)",
            "role": "CORPORATE_ADMIN",
            "department": "Corporate Safety & Compliance Directorate",
            "createdAt": datetime.utcnow().isoformat()
        },
        {
            "userId": "USR-0002",
            "email": "manager@mineguard.gov.in",
            "password": hashed_pwd,
            "name": "Subhashish Panda (Mine Manager)",
            "role": "MINE_MANAGER",
            "mineId": "MINE-007",
            "department": "Mine Operations & Safety",
            "createdAt": datetime.utcnow().isoformat()
        },
        {
            "userId": "USR-0003",
            "email": "inspector@mineguard.gov.in",
            "password": hashed_pwd,
            "name": "Ananya Sharma (DGMS Safety Inspector)",
            "role": "INSPECTOR",
            "mineId": "MINE-007",
            "department": "Directorate General of Mines Safety",
            "createdAt": datetime.utcnow().isoformat()
        },
        {
            "userId": "USR-0004",
            "email": "regulator@mineguard.gov.in",
            "password": hashed_pwd,
            "name": "Dr. V. K. Singh (Coal Regulator)",
            "role": "REGULATOR",
            "department": "Ministry of Coal Compliance Monitoring",
            "createdAt": datetime.utcnow().isoformat()
        },
        {
            "userId": "USR-0005",
            "email": "contractor@mineguard.gov.in",
            "password": hashed_pwd,
            "name": "Vikram Heavy Infra (Contractor)",
            "role": "CONTRACTOR",
            "mineId": "MINE-007",
            "department": "Mining Heavy Equipment Contractor",
            "createdAt": datetime.utcnow().isoformat()
        },
        {
            "userId": "USR-0006",
            "email": "superadmin@mineguard.gov.in",
            "password": hashed_pwd,
            "name": "System Administrator",
            "role": "SUPER_ADMIN",
            "department": "IT Governance",
            "createdAt": datetime.utcnow().isoformat()
        }
    ]
    await db.users.insert_many(demo_users)
    print(f"Seeded {len(demo_users)} demo user accounts.")

    # 2. SEED 10 INDIAN MINES
    mines = [
        {
            "mineId": "MINE-007",
            "name": "Mine 07 (Talcher Coalfield)",
            "location": "Talcher, Angul",
            "state": "Odisha",
            "district": "Angul",
            "latitude": 20.9517,
            "longitude": 85.0985,
            "manager": "Subhashish Panda",
            "operationalStatus": "Operational",
            "complianceScore": 68.5,
            "riskLevel": "CRITICAL",
            "createdAt": (datetime.utcnow() - timedelta(days=90)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-001",
            "name": "Dhanbad Opencast Pit #4",
            "location": "Jharia Coalfield",
            "state": "Jharkhand",
            "district": "Dhanbad",
            "latitude": 23.7957,
            "longitude": 86.4304,
            "manager": "A. K. Mukhopadhyay",
            "operationalStatus": "Operational",
            "complianceScore": 74.2,
            "riskLevel": "HIGH",
            "createdAt": (datetime.utcnow() - timedelta(days=120)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-002",
            "name": "Gevra Mega Open Cast Mine",
            "location": "Korba Coalfield",
            "state": "Chhattisgarh",
            "district": "Korba",
            "latitude": 22.3486,
            "longitude": 82.6841,
            "manager": "Suresh Chandra",
            "operationalStatus": "Operational",
            "complianceScore": 89.0,
            "riskLevel": "MEDIUM",
            "createdAt": (datetime.utcnow() - timedelta(days=150)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-003",
            "name": "Raniganj Underground Sector B",
            "location": "Asansol Belt",
            "state": "West Bengal",
            "district": "Paschim Bardhaman",
            "latitude": 23.6889,
            "longitude": 86.9661,
            "manager": "Debasis Banerjee",
            "operationalStatus": "Under Maintenance",
            "complianceScore": 91.5,
            "riskLevel": "LOW",
            "createdAt": (datetime.utcnow() - timedelta(days=200)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-004",
            "name": "Ib Valley Open Cast Pit #2",
            "location": "Jharsuguda",
            "state": "Odisha",
            "district": "Jharsuguda",
            "latitude": 21.8557,
            "longitude": 83.9234,
            "manager": "Pradeep Mohanty",
            "operationalStatus": "Operational",
            "complianceScore": 82.4,
            "riskLevel": "MEDIUM",
            "createdAt": (datetime.utcnow() - timedelta(days=100)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-005",
            "name": "Rajrappa Open Pit & Washery",
            "location": "Ramgarh",
            "state": "Jharkhand",
            "district": "Ramgarh",
            "latitude": 23.6300,
            "longitude": 85.7100,
            "manager": "R. N. Prasad",
            "operationalStatus": "Operational",
            "complianceScore": 86.0,
            "riskLevel": "LOW",
            "createdAt": (datetime.utcnow() - timedelta(days=80)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-006",
            "name": "Dipka Open Cast Mine",
            "location": "Gevra Region",
            "state": "Chhattisgarh",
            "district": "Korba",
            "latitude": 22.3167,
            "longitude": 82.5667,
            "manager": "M. K. Verma",
            "operationalStatus": "Operational",
            "complianceScore": 79.8,
            "riskLevel": "HIGH",
            "createdAt": (datetime.utcnow() - timedelta(days=110)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-008",
            "name": "Jayant Open Cast Project",
            "location": "Singrauli",
            "state": "Madhya Pradesh",
            "district": "Singrauli",
            "latitude": 24.1167,
            "longitude": 82.6167,
            "manager": "S. K. Tripathi",
            "operationalStatus": "Operational",
            "complianceScore": 93.0,
            "riskLevel": "LOW",
            "createdAt": (datetime.utcnow() - timedelta(days=180)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-009",
            "name": "Dulanga Open Cast Block",
            "location": "Sundargarh",
            "state": "Odisha",
            "district": "Sundargarh",
            "latitude": 22.1167,
            "longitude": 83.8833,
            "manager": "Sunil Patra",
            "operationalStatus": "Operational",
            "complianceScore": 88.0,
            "riskLevel": "LOW",
            "createdAt": (datetime.utcnow() - timedelta(days=60)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        },
        {
            "mineId": "MINE-010",
            "name": "Tamnar Captive Coal Pit",
            "location": "Raigarh",
            "state": "Chhattisgarh",
            "district": "Raigarh",
            "latitude": 21.9000,
            "longitude": 83.4000,
            "manager": "Anil Deshmukh",
            "operationalStatus": "Operational",
            "complianceScore": 84.5,
            "riskLevel": "MEDIUM",
            "createdAt": (datetime.utcnow() - timedelta(days=70)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
    ]
    await db.mines.insert_many(mines)
    print(f"Seeded {len(mines)} Indian coal mine records.")

    # 3. SEED KNOWLEDGE BASE (REGULATIONS & HISTORICAL)
    regulations = [
        {
            "regId": "REG-104",
            "act": "Coal Mines Regulations 2017",
            "ruleNumber": "CMR 104",
            "category": "SAFETY",
            "title": "Duty of Manager regarding Personal Protective Equipment and Dust Control",
            "mandatoryAction": "Mandatory provision of helmet, steel-toed boots, respiratory dust masks, and safety goggles to every underground and pit worker.",
            "penaltyClause": "Immediate stop work order and penalty under Section 72A of Mines Act 1952."
        },
        {
            "regId": "REG-123",
            "act": "Coal Mines Regulations 2017",
            "ruleNumber": "CMR 123",
            "category": "SAFETY",
            "title": "Precautions against inflammable gas and slope stability in opencast workings",
            "mandatoryAction": "Benches in overburden pit shall not exceed 10m height with minimum width of 12m for slope stability.",
            "penaltyClause": "Immediate bench restabilization requirement."
        },
        {
            "regId": "REG-152",
            "act": "Coal Mines Regulations 2017",
            "ruleNumber": "CMR 152",
            "category": "ENVIRONMENT",
            "title": "Effluent Treatment and Dust Suppression Sprinklers at Coal Haul Roads",
            "mandatoryAction": "Continuous mist sprinklers along 100% of haulage transport corridors.",
            "penaltyClause": "Notice under Environment Protection Act 1986."
        },
        {
            "regId": "REG-190",
            "act": "Coal Mines Regulations 2017",
            "ruleNumber": "CMR 190",
            "category": "LABOUR",
            "title": "Working Hours and Contractual Labour Health Audit Requirements",
            "mandatoryAction": "Mandatory 6-month medical checkups for heavy machinery operators.",
            "penaltyClause": "Contractor license suspension."
        }
    ]
    await db.regulations.insert_many(regulations)

    historical_violations = [
        {
            "title": "Uncertified Heavy Machinery Operating in Active Pit Zone B",
            "category": "SAFETY",
            "date": "2026-01-18",
            "mineId": "MINE-007",
            "keywords": ["safety", "equipment", "ppe", "machinery"],
            "resolution": "Imposed Rs. 2,00,000 fine and issued formal warning to contractor Vikram Heavy Infra."
        },
        {
            "title": "Absence of High-Pressure Water Sprinklers along Main Haulage Road",
            "category": "ENVIRONMENT",
            "date": "2026-02-04",
            "mineId": "MINE-001",
            "keywords": ["dust", "sprinklers", "environment"],
            "resolution": "Installed automated misting cannons within 72 hours."
        }
    ]
    await db.historical_violations.insert_many(historical_violations)

    sops = [
        {
            "title": "SOP-SAF-01: Pit Safety Equipment Protocol",
            "category": "SAFETY",
            "steps": ["Verify PPE before entry", "Log equipment inspection", "Check reflector jackets"]
        },
        {
            "title": "SOP-ENV-04: Ambient Air Quality & Particulate Monitoring",
            "category": "ENVIRONMENT",
            "steps": ["Sample PM10/PM2.5 every 8 hours", "Verify water sprinkling log", "Check slurry pit overflow"]
        }
    ]
    await db.sops.insert_many(sops)
    print("Seeded statutory regulations & knowledge base.")

    # 4. SEED 50 INSPECTIONS
    inspections = []
    categories = ["SAFETY", "ENVIRONMENT", "PRODUCTION", "LABOUR"]
    severities = ["MINOR", "MAJOR", "CRITICAL"]
    zones = ["Zone A", "Zone B", "Pit #3", "Haulage Corridor", "Washery Area", "Stockpile #2"]

    for i in range(1, 51):
        ins_id = f"INS-2026-{i:04d}"
        cat = categories[i % len(categories)]
        sev = "CRITICAL" if i in [7, 14, 21, 35, 42] else ("MAJOR" if i % 3 == 0 else "MINOR")
        m_id = f"MINE-{((i % 10) + 1):03d}"
        if i == 7:
            m_id = "MINE-007"
            cat = "SAFETY"
            sev = "CRITICAL"
            obs = "Worker safety equipment compliance issue detected."
        else:
            obs = f"Routine statutory inspection observed minor variance in {cat.lower()} parameters at {zones[i % len(zones)]}."

        inspections.append({
            "inspectionId": ins_id,
            "mineId": m_id,
            "zone": zones[i % len(zones)],
            "category": cat,
            "inspectorId": "USR-0003",
            "inspectorName": "Ananya Sharma",
            "inspectionDate": (datetime.utcnow() - timedelta(days=i*2)).isoformat(),
            "observations": obs,
            "checklist": [
                {"item": "PPE Compliance", "status": "FAIL" if sev == "CRITICAL" else "PASS"},
                {"item": "Ventilation Check", "status": "PASS"},
                {"item": "Haul Road Sprinklers", "status": "PASS" if i % 2 == 0 else "FAIL"}
            ],
            "severity": sev,
            "gpsLocation": {"lat": 20.9167 + (i * 0.001), "lng": 85.1500 + (i * 0.001)},
            "photos": [f"/uploads/evidence_ins_{i}.jpg"],
            "documents": [f"/uploads/statutory_report_{i}.pdf"],
            "status": "REVIEWED" if i > 10 else "SUBMITTED",
            "createdAt": (datetime.utcnow() - timedelta(days=i*2)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        })
    await db.inspections.insert_many(inspections)
    print(f"Seeded {len(inspections)} inspection records.")

    # 5. SEED 30 VIOLATIONS
    violations = []
    for i in range(1, 31):
        v_id = f"VIO-2026-{i:04d}"
        m_id = f"MINE-{((i % 10) + 1):03d}"
        cat = categories[i % len(categories)]
        sev = "CRITICAL" if i in [1, 7, 14, 21] else ("MAJOR" if i % 2 == 0 else "MINOR")
        
        if i == 1:
            m_id = "MINE-007"
            cat = "SAFETY"
            sev = "CRITICAL"
            title = "Worker safety equipment compliance issue detected"
            desc = "Worker safety equipment compliance issue detected during pit observation in Zone B."
            risk_score = 82
            risk_level = "CRITICAL"
            assigned = "Vikram Heavy Infra (Contractor)"
            v_status = "OPEN"
        else:
            title = f"Statutory {cat} Non-Conformity in {m_id}"
            desc = f"Field observation identified deviation from statutory standard in {cat.lower()} protocol."
            risk_score = 40 + (i * 2) if i <= 20 else 25
            risk_level = "HIGH" if risk_score >= 61 else ("MEDIUM" if risk_score >= 31 else "LOW")
            assigned = "Mine Safety Officer"
            v_status = "CLOSED" if i > 15 else ("IN_PROGRESS" if i > 8 else "OPEN")

        violations.append({
            "violationId": v_id,
            "mineId": m_id,
            "inspectionId": f"INS-2026-{i:04d}",
            "category": cat,
            "title": title,
            "description": desc,
            "severity": sev,
            "regulation": "Coal Mines Regulations 2017 CMR 104",
            "detectedDate": (datetime.utcnow() - timedelta(days=i*3)).isoformat(),
            "assignedTo": assigned,
            "dueDate": (datetime.utcnow() + timedelta(days=5)).isoformat(),
            "status": v_status,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "aiAnalysis": {
                "riskScore": risk_score,
                "riskLevel": risk_level,
                "riskFactors": [
                    "Repeated violations in 21 days",
                    "Overdue corrective actions",
                    "High severity observation"
                ]
            },
            "evidence": [f"/uploads/violation_proof_{i}.jpg"],
            "gpsLocation": {"lat": 20.9167, "lng": 85.1500},
            "createdAt": (datetime.utcnow() - timedelta(days=i*3)).isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        })
    await db.violations.insert_many(violations)
    print(f"Seeded {len(violations)} violation records.")

    # 6. SEED INCIDENTS, CORRECTIVE ACTIONS, CONTRACTORS, AUDIT EVENTS
    incidents = []
    for i in range(1, 11):
        incidents.append({
            "incidentId": f"INC-2026-{i:04d}",
            "mineId": f"MINE-{((i % 10) + 1):03d}",
            "zone": f"Zone {chr(65 + (i % 4))}",
            "category": categories[i % len(categories)],
            "severity": "MAJOR" if i % 2 == 0 else "MINOR",
            "description": f"Near-miss incident reported regarding heavy machinery clearance in haul pit #{i}.",
            "reportedBy": "Ananya Sharma",
            "reporterId": "USR-0003",
            "reportedAt": (datetime.utcnow() - timedelta(days=i*4)).isoformat(),
            "gpsLocation": {"lat": 20.9300 + (i*0.002), "lng": 85.1200 + (i*0.002)},
            "photos": [f"/uploads/incident_{i}.jpg"],
            "status": "INVESTIGATING" if i <= 3 else "RESOLVED",
            "createdAt": (datetime.utcnow() - timedelta(days=i*4)).isoformat()
        })
    await db.incidents.insert_many(incidents)

    corrective_actions = []
    for i in range(1, 21):
        act_status = "ASSIGNED" if i == 1 else ("SUBMITTED" if i == 2 else ("VERIFIED" if i > 10 else "IN_PROGRESS"))
        corrective_actions.append({
            "actionId": f"ACT-2026-{i:04d}",
            "violationId": f"VIO-2026-{i:04d}",
            "mineId": f"MINE-{((i % 10) + 1):03d}",
            "assignedTo": "Vikram Heavy Infra (Contractor)" if i in [1, 2, 5] else "Mine Safety Officer",
            "description": f"Implement mandatory compliance rectification for violation VIO-2026-{i:04d}.",
            "deadline": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "status": act_status,
            "submittedEvidence": [f"/uploads/rectification_proof_{i}.jpg"] if act_status in ["SUBMITTED", "VERIFIED"] else [],
            "submittedAt": (datetime.utcnow() - timedelta(hours=12)).isoformat() if act_status in ["SUBMITTED", "VERIFIED"] else None,
            "verifiedBy": "Subhashish Panda" if act_status == "VERIFIED" else None,
            "verifiedAt": datetime.utcnow().isoformat() if act_status == "VERIFIED" else None,
            "verificationResult": "Verified compliant" if act_status == "VERIFIED" else None,
            "createdAt": (datetime.utcnow() - timedelta(days=i*2)).isoformat()
        })
    await db.corrective_actions.insert_many(corrective_actions)

    audit_events = []
    actions_list = ["Inspection Created", "Violation Detected", "AI Analysis Generated", "Action Assigned", "Evidence Uploaded", "Verification Submitted", "Violation Closed"]
    for i in range(1, 51):
        audit_events.append({
            "timestamp": (datetime.utcnow() - timedelta(hours=i*3)).isoformat(),
            "userId": "USR-0003" if i % 2 == 0 else "USR-0002",
            "userEmail": "inspector@mineguard.gov.in" if i % 2 == 0 else "manager@mineguard.gov.in",
            "role": "INSPECTOR" if i % 2 == 0 else "MINE_MANAGER",
            "action": actions_list[i % len(actions_list)],
            "module": "GOVERNANCE",
            "recordId": f"REC-2026-{i:04d}",
            "metadata": {"source": "System Audit Logger", "ip": "127.0.0.1"},
            "ipAddress": "127.0.0.1"
        })
    await db.audit_trails.insert_many(audit_events)

    notifications = [
        {
            "notificationId": "NOTIF-001",
            "role": "MINE_MANAGER",
            "title": "CRITICAL RISK ALERT: Mine 07",
            "message": "AI Risk Score updated to 82/100 (CRITICAL) for VIO-2026-0001.",
            "type": "HIGH_RISK_ALERT",
            "isRead": False,
            "link": "/violations/VIO-2026-0001",
            "createdAt": datetime.utcnow().isoformat()
        },
        {
            "notificationId": "NOTIF-002",
            "role": "CORPORATE_ADMIN",
            "title": "Enterprise Governance Summary",
            "message": "Weekly compliance index updated across 10 monitored coalfields.",
            "type": "GOVERNANCE",
            "isRead": False,
            "link": "/dashboard",
            "createdAt": datetime.utcnow().isoformat()
        }
    ]
    await db.notifications.insert_many(notifications)

    print("Seed complete! All database collections successfully initialized.")

if __name__ == "__main__":
    asyncio.run(seed_database())
