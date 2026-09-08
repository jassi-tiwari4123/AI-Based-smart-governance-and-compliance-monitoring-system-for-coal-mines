from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# User & Auth Schemas
class UserRole:
    SUPER_ADMIN = "SUPER_ADMIN"
    CORPORATE_ADMIN = "CORPORATE_ADMIN"
    MINE_MANAGER = "MINE_MANAGER"
    INSPECTOR = "INSPECTOR"
    REGULATOR = "REGULATOR"
    CONTRACTOR = "CONTRACTOR"

class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    role: str = UserRole.INSPECTOR
    mineId: Optional[str] = None
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    email: str
    name: str
    role: str
    mineId: Optional[str] = None
    department: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Mine Schema
class MineCreate(BaseModel):
    name: str
    location: str
    state: str
    district: str
    latitude: float
    longitude: float
    manager: str
    operationalStatus: str = "Operational" # Operational, Under Maintenance, Under Investigation
    complianceScore: float = 85.0
    riskLevel: str = "LOW" # LOW, MEDIUM, HIGH, CRITICAL

class MineUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    manager: Optional[str] = None
    operationalStatus: Optional[str] = None
    complianceScore: Optional[float] = None
    riskLevel: Optional[str] = None

# Inspection Schema
class InspectionCreate(BaseModel):
    mineId: str
    zone: str
    category: str # SAFETY, ENVIRONMENT, PRODUCTION, LABOUR
    inspectionDate: Optional[str] = None
    observations: str
    checklist: Optional[List[Dict[str, Any]]] = []
    severity: str # MINOR, MAJOR, CRITICAL
    gpsLocation: Optional[Dict[str, float]] = None # {"lat": ..., "lng": ...}
    photos: Optional[List[str]] = []
    documents: Optional[List[str]] = []
    status: str = "SUBMITTED" # DRAFT, SUBMITTED, REVIEWED, CLOSED

class InspectionUpdate(BaseModel):
    observations: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    checklist: Optional[List[Dict[str, Any]]] = None

# Violation Schema
class ViolationCreate(BaseModel):
    mineId: str
    inspectionId: Optional[str] = None
    category: str
    title: str
    description: str
    severity: str
    regulation: Optional[str] = None
    assignedTo: Optional[str] = None
    dueDate: Optional[str] = None
    status: str = "OPEN" # OPEN, ASSIGNED, IN_PROGRESS, SUBMITTED, VERIFICATION, CLOSED, ESCALATED, REWORK
    evidence: Optional[List[str]] = []

class ViolationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    assignedTo: Optional[str] = None
    dueDate: Optional[str] = None
    status: Optional[str] = None
    regulation: Optional[str] = None
    reworkNotes: Optional[str] = None

# Incident Schema
class IncidentCreate(BaseModel):
    mineId: str
    zone: str
    category: str
    severity: str
    description: str
    gpsLocation: Optional[Dict[str, float]] = None
    photos: Optional[List[str]] = []
    status: str = "REPORTED"

# Corrective Action Schema
class CorrectiveActionCreate(BaseModel):
    violationId: str
    mineId: str
    assignedTo: str
    assignedUserId: Optional[str] = None
    description: str
    deadline: str

class EvidenceSubmission(BaseModel):
    submittedEvidence: List[str]
    notes: Optional[str] = ""

class VerificationAction(BaseModel):
    approved: bool
    verificationNotes: Optional[str] = ""

# AI Analysis Schema
class RiskAnalysisRequest(BaseModel):
    violationId: str

class AIInvestigationRequest(BaseModel):
    violationId: str
    additionalContext: Optional[str] = None

class InspectionSuggestionRequest(BaseModel):
    observation: str  # free-text field observation from the inspector

class ChecklistSuggestion(BaseModel):
    item: str
    suggestedStatus: str  # PASS | FAIL
    reason: str           # brief rationale

class InspectionSuggestionResponse(BaseModel):
    severity: str                              # MINOR | MAJOR | CRITICAL
    severityReason: str
    category: str                              # SAFETY | ENVIRONMENT | PRODUCTION | LABOUR
    categoryReason: str
    checklist: List[ChecklistSuggestion]
    summary: str                               # one-line AI summary of the observation
    confidence: str

# Document Schema
class DocumentCreate(BaseModel):
    mineId: str
    fileName: str
    documentType: str
    issueDate: Optional[str] = None
    expiryDate: Optional[str] = None


# Worker Schema
class WorkerCreate(BaseModel):
    name: str
    workerId: Optional[str] = None       # e.g. WRK-001, auto-generated if omitted
    role: str = "General Labour"         # e.g. Driller, Blaster, General Labour
    shift: str = "DAY"                   # DAY | NIGHT
    mineId: Optional[str] = None         # auto-filled from contractor's mineId
    contractorId: Optional[str] = None   # auto-filled from logged-in contractor

class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    shift: Optional[str] = None
    active: Optional[bool] = None

# Attendance Schema
class AttendanceRecord(BaseModel):
    workerId: str
    status: str  # PRESENT | ABSENT | HALF_DAY | LEAVE

class AttendanceCreate(BaseModel):
    mineId: str
    date: str                            # ISO date string e.g. "2026-09-07"
    records: List[AttendanceRecord]      # one entry per worker
