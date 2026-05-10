@echo off
setlocal
cd /d "%~dp0"
where pnpm >nul 2>nul
if errorlevel 1 (
  echo ERROR: pnpm is not installed or not on PATH.
  pause
  exit /b 1
)
call pnpm start:local
set "EXITCODE=%ERRORLEVEL%"
if not "%EXITCODE%"=="0" (
  echo.
  echo Start failed with exit code %EXITCODE%. Scroll up for the error.
  pause
  exit /b %EXITCODE%
)
echo.
pause
exit /b 0
