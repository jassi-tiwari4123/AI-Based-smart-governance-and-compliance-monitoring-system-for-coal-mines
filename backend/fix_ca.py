"""Fix corrective action records: remove duplicates, backfill assignedUserId, clean names."""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL   = "mongodb://localhost:27017"
DATABASE_NAME = "mineguard_db"

async def fix():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    # Build name -> userId map from contractor users
    contractors = await db.users.find({"role": "CONTRACTOR"}).to_list(length=100)
    name_map = {c["name"]: c["userId"] for c in contractors}
    print("Contractors in DB:", name_map)

    # Load all corrective actions
    actions = await db.corrective_actions.find({}).to_list(length=500)
    seen_ids = set()

    for a in actions:
        aid = a.get("actionId")

        # Remove duplicates — keep only the first occurrence of each actionId
        if aid in seen_ids:
            print(f"  Deleting duplicate {aid}")
            await db.corrective_actions.delete_one({"_id": a["_id"]})
            continue
        seen_ids.add(aid)

        assigned_name = a.get("assignedTo", "")
        # Strip stale " (Contractor)" suffix
        clean_name = assigned_name.replace(" (Contractor)", "").strip()
        uid = name_map.get(clean_name)

        update = {"assignedTo": clean_name}
        if uid:
            update["assignedUserId"] = uid

        await db.corrective_actions.update_one(
            {"_id": a["_id"]},
            {"$set": update}
        )
        print(f"  {aid}: '{assigned_name}' -> '{clean_name}' | userId={uid}")

    print("\nAll done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix())
