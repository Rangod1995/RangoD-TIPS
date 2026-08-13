@echo off
setlocal

if "%RANGOD_AI_API_KEY%"=="" (
    echo.
    echo RANGOD_AI_API_KEY is not configured.
    echo.
    exit /b 1
)

node automation\aiRepairTest.js %*
