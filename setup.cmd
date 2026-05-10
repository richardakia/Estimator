@echo off
setlocal
cd /d "%~dp0"
set "EXITCODE=0"
echo Cable Estimator - Local Setup
echo.
where pnpm >nul 2>nul
if errorlevel 1 (
  echo ERROR: pnpm is not installed or not on PATH.
  echo Install Node.js v22.7+ from https://nodejs.org and then run:
  echo   npm install -g pnpm
  pause
  exit /b 1
)
call pnpm setup:local
if errorlevel 1 (
  echo.
  echo Setup failed. Scroll up for the error.
  pause
  exit /b 1
)
echo.
pause
exit /b %EXITCODE%
