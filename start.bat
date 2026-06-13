@echo off
title LeadStream CRM
color 0B
echo.
echo  ==================================================
echo   LeadStream CRM ^| Cold Calling Dashboard
echo  ==================================================
echo.

:: Change to the project root (same directory as this bat file)
cd /d "%~dp0"

:: Check if venv exists, create it if not
if not exist ".venv\Scripts\python.exe" (
    echo  [1/3] Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo  ERROR: Python not found. Please install Python 3.11+
        pause
        exit /b 1
    )
    echo  Done.
    echo.
)

:: Activate venv
call .venv\Scripts\activate.bat

:: Install backend dependencies if needed
echo  [2/3] Checking dependencies...
pip install -q -r backend\requirements.txt
echo  Done.
echo.

:: Run importer if DB doesn't exist yet
if not exist "leads.db" (
    echo  [3/3] Importing leads from CSV...
    python import_leads.py
    echo.
) else (
    echo  [3/3] Database found. Skipping import.
    echo.
)

:: Open browser after short delay
echo  Starting server at http://localhost:8000
echo  Press Ctrl+C to stop.
echo.
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8000"

:: Start backend from backend directory
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
