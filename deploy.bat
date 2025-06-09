@echo off
:: Finance Dashboard GitHub Pages Deployment Script
:: Handles force-adding ignored files and pushing to GitHub

echo ============================================================
echo Finance Dashboard - GitHub Pages Deployment
echo ============================================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

:: Run the deployment script
echo Running deployment script...
echo.
node deploy.js

:: Check if deployment was successful
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo DEPLOYMENT SUCCESSFUL!
    echo ============================================================
    echo.
    echo Next steps:
    echo 1. Wait 2-5 minutes for GitHub Pages to update
    echo 2. Test your app at: https://chudeemeke.github.io/finance-dashboard/
    echo 3. Verify deployment: https://chudeemeke.github.io/finance-dashboard/deployment-verification.html
    echo.
) else (
    echo.
    echo ============================================================
    echo DEPLOYMENT FAILED!
    echo ============================================================
    echo Please check the error messages above and try again.
    echo.
)

pause