from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.config import settings
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.routers import (
    auth, mines, inspections, violations, incidents,
    corrective_actions, ai_router, gis, dashboard,
    workflows, audit, reports, documents, notifications, users,
    workers, attendance
)
from bson import ObjectId
import os
import json


# ── Global ObjectId serialiser ──────────────────────────────────────────────
def convert_objectid(obj):
    """Recursively stringify any ObjectId in dicts / lists."""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    return obj


app = FastAPI(
    title="MINEGUARD API",
    description="AI-Based Smart Governance and Compliance Monitoring System for Coal Mines",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Middleware: sanitise every response body ──────────────────────────────────
@app.middleware("http")
async def objectid_sanitiser(request, call_next):
    response = await call_next(request)
    # Only touch JSON responses
    if "application/json" in response.headers.get("content-type", ""):
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        try:
            data = json.loads(body)
            data = convert_objectid(data)
            clean_body = json.dumps(data).encode()
        except Exception:
            clean_body = body
        return JSONResponse(
            content=json.loads(clean_body),
            status_code=response.status_code,
            headers=dict(response.headers),
        )
    return response


# ── Database lifecycle ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


# ── Static uploads ────────────────────────────────────────────────────────────
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(mines.router)
app.include_router(inspections.router)
app.include_router(violations.router)
app.include_router(incidents.router)
app.include_router(corrective_actions.router)
app.include_router(ai_router.router)
app.include_router(gis.router)
app.include_router(dashboard.router)
app.include_router(workflows.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(documents.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(workers.router)
app.include_router(attendance.router)


@app.get("/")
async def root():
    return {
        "system": "MINEGUARD",
        "status": "Operational",
        "version": "1.0.0",
        "documentation": "/docs"
    }
