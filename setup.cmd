@echo off
setlocal
cd /d "%~dp0"
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
set "EXITCODE=%ERRORLEVEL%"
if not "%EXITCODE%"=="0" (
  echo.
  echo Setup failed with exit code %EXITCODE%. Scroll up for the error.
  pause
  exit /b %EXITCODE%
)
echo.
pause
exit /b 0
