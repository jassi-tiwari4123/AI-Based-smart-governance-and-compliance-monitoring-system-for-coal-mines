"""
migrate_to_atlas.py
===================
Migrates your local mineguard_db to MongoDB Atlas.

Two modes:
  1. MIGRATE  — copies all documents from local → Atlas (if local is running)
  2. SEED     — runs seed.py on Atlas directly (if local is unavailable)

Usage:
    py -3.12 migrate_to_atlas.py

Requirements:
  • Set ATLAS_URL in this script (or set MONGODB_URL in .env to Atlas URI)
  • Local MongoDB must be running for migrate mode (optional)
"""

import asyncio
import sys
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
# Paste your Atlas connection string here:
# e.g. mongodb+srv://mineguard_admin:PASSWORD@cluster0.xxxxx.mongodb.net/
ATLAS_URL = os.getenv("ATLAS_URL") or os.getenv("MONGODB_URL", "")

# Allow override via command line argument
if len(sys.argv) > 1:
    ATLAS_URL = sys.argv[1]

LOCAL_URL  = "mongodb://localhost:27017"
DB_NAME    = "mineguard_db"
# ──────────────────────────────────────────────────────────────────────────────


def check_atlas_url():
    if not ATLAS_URL or "<password>" in ATLAS_URL or "localhost" in ATLAS_URL:
        print("\n❌  ATLAS_URL is not set or still has placeholder values.")
        print("   Open migrate_to_atlas.py and set ATLAS_URL at the top,")
        print("   OR set MONGODB_URL in your .env file to the Atlas URI.\n")
        print("   Example Atlas URI:")
        print("   mongodb+srv://mineguard_admin:MyPass123@cluster0.abcde.mongodb.net/\n")
        sys.exit(1)


async def ping(client, label):
    try:
        await client.admin.command("ping", serverSelectionTimeoutMS=5000)
        print(f"  ✅ {label} — connected")
        return True
    except Exception as e:
        print(f"  ⚠️  {label} — unreachable: {e}")
        return False


async def count_local(local_db):
    """Return dict of {collection: count} from local DB."""
    cols = await local_db.list_collection_names()
    result = {}
    for col in cols:
        result[col] = await local_db[col].count_documents({})
    return result


async def migrate(local_db, atlas_db):
    """Copy every document from local → Atlas, skipping duplicates."""
    collections = await local_db.list_collection_names()
    if not collections:
        print("\n  ⚠️  Local database is empty — nothing to migrate.")
        return False

    total_copied = 0
    print(f"\n  Migrating {len(collections)} collections...\n")

    for col_name in collections:
        docs = await local_db[col_name].find().to_list(length=100_000)
        if not docs:
            print(f"    {col_name}: 0 docs — skipped")
            continue

        # Convert ObjectId to string so they survive the round-trip cleanly
        for doc in docs:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])

        # Drop & re-insert so we always get a clean copy
        await atlas_db[col_name].drop()
        result = await atlas_db[col_name].insert_many(docs)
        count = len(result.inserted_ids)
        total_copied += count
        print(f"    ✅  {col_name}: {count} documents migrated")

    print(f"\n  🎉 Migration complete — {total_copied} total documents written to Atlas.")
    return True


async def seed_on_atlas(atlas_db):
    """
    Run the seed script directly against Atlas.
    This drops and re-creates all collections with fresh demo data.
    """
    print("\n  Running seed script on Atlas database...\n")

    # Dynamically import and run seed
    sys.path.insert(0, os.path.dirname(__file__))
    try:
        # Temporarily override settings so seed.py targets Atlas
        from app.config import settings
        settings.MONGODB_URL = ATLAS_URL
        settings.DATABASE_NAME = DB_NAME

        # Run the seed function
        from seed import seed_database
        await seed_database()
        print("\n  🎉 Seed complete — Atlas database is ready with demo data.")
    except ImportError:
        print("  ⚠️  Could not import seed.py — running inline minimal seed instead.")
        await minimal_seed(atlas_db)


async def minimal_seed(db):
    """Minimal seed if seed.py can't be imported."""
    from app.utils.security import hash_password
    hashed = hash_password("password123")

    await db.users.drop()
    await db.users.insert_many([
        {"userId": "USR-0001", "email": "admin@mineguard.gov.in",      "password": hashed, "name": "Rajesh Kumar",          "role": "CORPORATE_ADMIN", "createdAt": datetime.utcnow().isoformat()},
        {"userId": "USR-0002", "email": "manager@mineguard.gov.in",    "password": hashed, "name": "Subhashish Panda",       "role": "MINE_MANAGER",    "mineId": "MINE-007", "createdAt": datetime.utcnow().isoformat()},
        {"userId": "USR-0003", "email": "inspector@mineguard.gov.in",  "password": hashed, "name": "Ananya Sharma",          "role": "INSPECTOR",       "mineId": "MINE-007", "createdAt": datetime.utcnow().isoformat()},
        {"userId": "USR-0004", "email": "regulator@mineguard.gov.in",  "password": hashed, "name": "Dr. V. K. Singh",        "role": "REGULATOR",       "createdAt": datetime.utcnow().isoformat()},
        {"userId": "USR-0005", "email": "contractor@mineguard.gov.in", "password": hashed, "name": "Vikram Heavy Infra",     "role": "CONTRACTOR",      "mineId": "MINE-007", "createdAt": datetime.utcnow().isoformat()},
        {"userId": "USR-0006", "email": "superadmin@mineguard.gov.in", "password": hashed, "name": "System Administrator",   "role": "SUPER_ADMIN",     "createdAt": datetime.utcnow().isoformat()},
    ])
    print("    ✅  users: 6 demo accounts created (password: password123)")


async def show_atlas_summary(atlas_db):
    cols = await atlas_db.list_collection_names()
    print("\n  📊 Atlas database summary:")
    for col in sorted(cols):
        count = await atlas_db[col].count_documents({})
        print(f"    {col:35s} {count:>5} documents")


async def main():
    check_atlas_url()

    print("=" * 60)
    print("  MINEGUARD — MongoDB Atlas Migration Tool")
    print("=" * 60)

    # ── Connect to Atlas ──────────────────────────────────────
    print("\n1. Testing Atlas connection...")
    atlas_client = AsyncIOMotorClient(
        ATLAS_URL,
        serverSelectionTimeoutMS=10_000,
        retryWrites=True,
        w="majority",
    )
    atlas_ok = await ping(atlas_client, "Atlas")
    if not atlas_ok:
        atlas_client.close()
        print("\n❌ Cannot reach Atlas. Check:\n"
              "   • Your ATLAS_URL / MONGODB_URL in .env\n"
              "   • Atlas Network Access — add your IP or 0.0.0.0/0\n"
              "   • Database user credentials are correct\n")
        sys.exit(1)

    atlas_db = atlas_client[DB_NAME]

    # ── Try local MongoDB ─────────────────────────────────────
    print("\n2. Testing local MongoDB connection...")
    local_client = AsyncIOMotorClient(LOCAL_URL, serverSelectionTimeoutMS=3_000)
    local_ok = await ping(local_client, "Local MongoDB (localhost:27017)")

    if local_ok:
        local_db = local_client[DB_NAME]
        counts   = await count_local(local_db)
        total    = sum(counts.values())

        if total > 0:
            print(f"\n  Found {total} documents across {len(counts)} collections in local DB:")
            for col, cnt in sorted(counts.items()):
                print(f"    {col:35s} {cnt:>5} docs")

            print("\n3. Migrating local data → Atlas...")
            migrated = await migrate(local_db, atlas_db)
        else:
            print("\n  Local database is empty.")
            print("\n3. Seeding fresh data on Atlas...")
            await seed_on_atlas(atlas_db)
    else:
        print("\n  Local MongoDB not running — will seed Atlas with fresh demo data.")
        print("\n3. Seeding Atlas database...")
        await seed_on_atlas(atlas_db)

    local_client.close()

    # ── Final summary ─────────────────────────────────────────
    print("\n4. Verifying Atlas database...")
    await show_atlas_summary(atlas_db)

    atlas_client.close()

    print("\n" + "=" * 60)
    print("  ✅ DONE!  Your Atlas database is ready.")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Make sure your backend .env has:")
    print(f"     MONGODB_URL={ATLAS_URL[:60]}...")
    print("  2. Restart the backend:  py -3.12 -m uvicorn app.main:app --reload --port 8000")
    print("  3. The app now uses Atlas — all teammates share the same database!\n")
    print("  Demo credentials (password: password123):")
    accounts = [
        ("CORPORATE_ADMIN", "admin@mineguard.gov.in"),
        ("MINE_MANAGER",    "manager@mineguard.gov.in"),
        ("INSPECTOR",       "inspector@mineguard.gov.in"),
        ("REGULATOR",       "regulator@mineguard.gov.in"),
        ("CONTRACTOR",      "contractor@mineguard.gov.in"),
        ("SUPER_ADMIN",     "superadmin@mineguard.gov.in"),
    ]
    for role, email in accounts:
        print(f"    {role:20s}  {email}")
    print()


if __name__ == "__main__":
    asyncio.run(main())
