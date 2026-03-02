@echo off
echo ============================================
echo  Uploading secrets to VPS: 72.61.228.175
echo ============================================
echo.
echo This will upload:
echo   - .env (production environment variables)
echo   - service-account-key.json (Google Sheets credentials)
echo.
echo You will be asked for your VPS password twice.
echo.

cd /d "C:\Users\HP\Desktop\INTERVIEWER\backend"

echo [1/2] Uploading .env.production as .env...
scp .env.production root@72.61.228.175:/var/www/interviewer/backend/.env

echo [2/2] Uploading service-account-key.json...
scp service-account-key.json root@72.61.228.175:/var/www/interviewer/backend/service-account-key.json

echo.
echo ============================================
echo  SUCCESS! Secrets uploaded to VPS.
echo  Now run: pm2 restart interviewer-api
echo ============================================
pause
