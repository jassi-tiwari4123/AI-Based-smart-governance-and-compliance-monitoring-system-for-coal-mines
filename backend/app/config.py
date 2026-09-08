import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "MINEGUARD Governance System"
    PORT:     int = 8000

    # ── MongoDB ────────────────────────────────────────────────────────────
    # Use a local URI by default so the app still works without .env.
    # In production / team setup, set MONGODB_URL in .env to an Atlas URI:
    #   mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
    MONGODB_URL:   str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "mineguard_db"

    # ── JWT ────────────────────────────────────────────────────────────────
    JWT_SECRET:                 str = "mineguard_super_secret_jwt_key_2026_coal_mine_governance"
    JWT_ALGORITHM:              str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440   # 24 hours

    # ── AI Provider ────────────────────────────────────────────────────────
    AI_PROVIDER:    str = "fallback"   # fallback | groq | openai
    GROQ_API_KEY:   str = ""
    OPENAI_API_KEY: str = ""

    # ── File Storage ───────────────────────────────────────────────────────
    UPLOAD_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "uploads"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
