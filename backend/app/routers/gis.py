from fastapi import APIRouter, Depends
from app.database.connection import get_database
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/gis", tags=["GIS & Spatial Map Data"])

@router.get("/mines")
async def get_gis_mines(current_user: dict = Depends(get_current_user)):
    db = get_database()
    mines = await db.mines.find().to_list(length=200)
    features = []
    for m in mines:
        features.append({
            "id": m.get("mineId"),
            "name": m.get("name"),
            "state": m.get("state"),
            "district": m.get("district"),
            "latitude": m.get("latitude", 20.9517),
            "longitude": m.get("longitude", 85.0985),
            "riskLevel": m.get("riskLevel", "LOW"),
            "complianceScore": m.get("complianceScore", 85),
            "status": m.get("operationalStatus", "Operational"),
            "manager": m.get("manager")
        })
    return features

@router.get("/violations")
async def get_gis_violations(current_user: dict = Depends(get_current_user)):
    db = get_database()
    violations = await db.violations.find({"status": {"$ne": "CLOSED"}}).to_list(length=300)
    features = []
    for v in violations:
        gps = v.get("gpsLocation") or {}
        features.append({
            "id": v.get("violationId"),
            "mineId": v.get("mineId"),
            "title": v.get("title"),
            "category": v.get("category"),
            "severity": v.get("severity"),
            "riskLevel": v.get("riskLevel", "HIGH"),
            "riskScore": v.get("riskScore", 75),
            "latitude": gps.get("lat", 20.9167),
            "longitude": gps.get("lng", 85.1500),
            "status": v.get("status")
        })
    return features

@router.get("/incidents")
async def get_gis_incidents(current_user: dict = Depends(get_current_user)):
    db = get_database()
    incidents = await db.incidents.find().to_list(length=200)
    features = []
    for inc in incidents:
        gps = inc.get("gpsLocation") or {}
        features.append({
            "id": inc.get("incidentId"),
            "mineId": inc.get("mineId"),
            "zone": inc.get("zone"),
            "category": inc.get("category"),
            "severity": inc.get("severity"),
            "description": inc.get("description"),
            "latitude": gps.get("lat", 20.9300),
            "longitude": gps.get("lng", 85.1200),
            "reportedAt": inc.get("reportedAt")
        })
    return features
