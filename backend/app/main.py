from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database.connection import connect_to_mongo, close_mongo_connection
from app.routers import (
    auth, mines, inspections, violations, incidents,
    corrective_actions, ai_router, gis, dashboard,
    workflows, audit, reports, documents, notifications
)
import os

app = FastAPI(
    title="MINEGUARD API",
    description="AI-Based Smart Governance and Compliance Monitoring System for Coal Mines",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
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

# Database lifecycle
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Static uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
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

@app.get("/")
async def root():
    return {
        "system": "MINEGUARD",
        "status": "Operational",
        "version": "1.0.0",
        "documentation": "/docs"
    }
