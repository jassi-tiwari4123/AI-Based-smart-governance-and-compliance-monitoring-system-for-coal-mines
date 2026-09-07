# MineGuard — AI-Based Smart Governance & Compliance Monitoring System for Coal Mines

> An end-to-end AI-powered platform for statutory compliance, safety inspection, incident management, and worker attendance across Indian coal mines.

---

## Core Workflow

```
Field Inspectors & Contractors
        ↓
Mobile Field Reports (Inspections / Incidents)
        ↓
AI Risk Engine — auto-scores violations (0–100)
        ↓
Mine Manager Dashboard — assigns corrective actions
        ↓
Contractor submits fix evidence
        ↓
Mine Manager verifies → Violation CLOSED
        ↓
Corporate Admin — cross-mine analytics & governance
```

## Workflow Diagram

<img width="1536" height="1024" alt="MineGuard Workflow" src="https://github.com/user-attachments/assets/69bd2fea-5156-4110-bc14-d48c281f7edd" />

---

## Features

### Role-Based Access Control (RBAC)
- **Corporate Admin** — manages mine portfolio, assigns managers, cross-mine analytics
- **Mine Manager** — runs one mine, AI violation investigation, corrective actions, attendance reports
- **Inspector** — files inspection reports and incidents via mobile-first form
- **Contractor** — marks daily worker attendance, submits corrective fix evidence

### Inspection & Violation Management
- Mobile Field Report with 3 modes: Inspection / Incident / Both
- AI auto-detects violations from inspection observations
- Risk Score (0–100) calculated per violation
- Full corrective action lifecycle: Assign → Submit Evidence → Verify → Close

### Incident Management
- Inspector reports incidents on-site
- Mine Manager raises queries, escalates, or resolves
- Inspector replies in threaded query conversation
- Unified Violations & Incidents Log for Mine Manager

### Attendance System
- Contractor adds workers (Driller, Blaster, Loader Operator, etc.)
- Daily attendance marking: Present / Absent / Half Day / Leave
- Mine Manager views attendance reports with date range filters

### Mine & Manager Administration
- Corporate Admin adds new mines, changes operational status
- Assign / change / remove Mine Managers per mine
- Dedicated Manager Management page with unassigned manager tracking

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Recharts, React Router v6 |
| Backend | FastAPI (Python), Uvicorn |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose), bcrypt |
| AI | Groq / OpenAI / Fallback rule engine |
| Maps | Leaflet, React-Leaflet |

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`

### 1. Clone the repo
```bash
git clone https://github.com/jassi-tiwari4123/AI-Based-smart-governance-and-compliance-monitoring-system-for-coal-mines.git
cd AI-Based-smart-governance-and-compliance-monitoring-system-for-coal-mines
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Auto-seed:** On first startup, if the database is empty, the backend automatically seeds all 5 mines, managers, inspectors, contractors, workers, and sample data. No manual steps needed.

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

---

## Default Login Credentials

### Corporate Admin
| Email | Password |
|-------|----------|
| admin@mineguard.gov.in | password123 |

### Mine Managers — `Manager@1234`
| Manager | Mine | Email |
|---------|------|-------|
| A. K. Mukhopadhyay | MINE-001 Dhanbad | manager.mine001@mineguard.gov.in |
| Suresh Chandra | MINE-002 Gevra | manager.mine002@mineguard.gov.in |
| Debasis Banerjee | MINE-003 Raniganj | manager.mine003@mineguard.gov.in |
| Pradeep Mohanty | MINE-004 Ib Valley | manager.mine004@mineguard.gov.in |
| R. N. Prasad | MINE-005 Rajrappa | manager.mine005@mineguard.gov.in |

### Inspectors — `Inspector@1234`
Email pattern: `inspector.mineXXX@mineguard.gov.in` and `inspector2.mineXXX@mineguard.gov.in` (XXX = 001–005)

### Contractors — `Contractor@1234`
Email pattern: `contractor.mineXXX@mineguard.gov.in` (XXX = 001–005)

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── routers/          # API route handlers
│   │   ├── schemas/          # Pydantic models
│   │   ├── services/         # AI, audit, risk engine
│   │   ├── middleware/       # JWT auth
│   │   └── main.py           # FastAPI app entry point
│   ├── seed.py               # Auto-seed script (runs on startup if DB empty)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # All page components
│   │   ├── components/       # Navbar, Sidebar, ProtectedRoute
│   │   ├── context/          # Auth, Notification context
│   │   └── services/         # Axios API client
│   └── package.json
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=mineguard_db
JWT_SECRET=your_secret_key
AI_PROVIDER=fallback          # groq | openai | fallback
GROQ_API_KEY=                 # optional
OPENAI_API_KEY=               # optional
```

---

## Team

Smart India Hackathon 2026 — Problem Statement: AI-Based Smart Governance and Compliance Monitoring System for Coal Mines
