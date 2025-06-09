@echo off
:: Quick Manual Deployment for Finance Dashboard
:: This script handles the immediate deployment need

echo ============================================================
echo Quick Deployment - Finance Dashboard
echo ============================================================
echo.

echo Step 1: Adding all files...
git add .

echo.
echo Step 2: Force-adding ignored files...
git add -f app-utils-privacy-fix.js
git add -f temp-fix-deps.js
git add -f app-render-debug.js
git add -f app-component-fix.js
git add -f app-debug-components.js

echo.
echo Step 3: Creating commit...
git commit -m "Deploy: Force add ignored files for GitHub Pages - %date% %time%"

echo.
echo Step 4: Pushing to GitHub...
git push origin main

echo.
echo ============================================================
echo DEPLOYMENT COMPLETE!
echo ============================================================
echo.
echo Please wait 2-5 minutes for GitHub Pages to update.
echo.
echo Test URLs:
echo - Main App: https://chudeemeke.github.io/finance-dashboard/
echo - Test Page: https://chudeemeke.github.io/finance-dashboard/test-basic.html
echo - Verification: https://chudeemeke.github.io/finance-dashboard/deployment-verification.html
echo.
pause