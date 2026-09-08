@echo off
title MineGuard - Starting...

echo.
echo  ========================================
echo   MINEGUARD - AI Coal Mine Governance
echo  ========================================
echo.

:: Start Backend
echo  [1/2] Starting Backend (FastAPI)...
start "MineGuard Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

:: Wait a moment for backend to init
timeout /t 3 /nobreak > nul

:: Start Frontend
echo  [2/2] Starting Frontend (Vite)...
start "MineGuard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  ----------------------------------------
echo   Backend  ->  http://localhost:8000
echo   Frontend ->  http://localhost:5173
echo   API Docs ->  http://localhost:8000/docs
echo  ----------------------------------------
echo.
echo  Both servers are starting in separate windows.
echo  Close this window anytime.
echo.
pause
