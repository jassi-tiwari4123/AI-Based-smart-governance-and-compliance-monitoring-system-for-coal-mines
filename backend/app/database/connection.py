from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger("mineguard.db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()


async def connect_to_mongo():
    url = settings.MONGODB_URL

    # Mask credentials in the log so passwords are never printed
    if "@" in url:
        masked = "mongodb+srv://***:***@" + url.split("@", 1)[1]
    else:
        masked = url

    logger.info(f"Connecting to MongoDB: {masked}")

    # Motor options that work for both localhost and Atlas
    client_kwargs = {
        "serverSelectionTimeoutMS": 10_000,   # fail fast if unreachable
        "connectTimeoutMS":         10_000,
        "socketTimeoutMS":          30_000,
        "retryWrites":              True,
        "w":                        "majority",
    }

    db_instance.client = AsyncIOMotorClient(url, **client_kwargs)

    # Ping to verify the connection before the server finishes starting
    try:
        await db_instance.client.admin.command("ping")
        logger.info("✅ MongoDB connection verified (ping OK)")
    except Exception as exc:
        logger.error(
            f"❌ Could not reach MongoDB at {masked}\n"
            f"   Error: {exc}\n"
            f"   → If using Atlas: check MONGODB_URL in .env, allow your IP in Atlas Network Access,\n"
            f"     and make sure the database user credentials are correct.\n"
            f"   → If using localhost: make sure mongod is running."
        )
        raise

    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    logger.info(f"📦 Using database: '{settings.DATABASE_NAME}'")


async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("Closed MongoDB connection.")


def get_database():
    if db_instance.db is None:
        raise RuntimeError(
            "Database not initialised. "
            "connect_to_mongo() must be called during app startup."
        )
    return db_instance.db
