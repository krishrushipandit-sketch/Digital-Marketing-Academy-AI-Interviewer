@echo off
echo === RUSHIPANDIT Interviewer — GitHub Push ===
echo.

cd /d "C:\Users\HP\Desktop\INTERVIEWER"

echo [1/5] Initializing Git...
git init
if errorlevel 1 goto error

echo [2/5] Staging all files...
git add .
if errorlevel 1 goto error

echo [3/5] Creating commit...
git commit -m "Initial commit - RUSHIPANDIT AI Interviewer"
if errorlevel 1 goto error

echo [4/5] Setting up remote & branch...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/krishrushipandit-sketch/interviewer.git
if errorlevel 1 goto error

echo [5/5] Pushing to GitHub...
echo.
echo NOTE: A browser window will open — sign in to GitHub to authorize.
echo.
git push -u origin main
if errorlevel 1 goto error

echo.
echo =============================================
echo   SUCCESS! Code is now on GitHub!
echo   https://github.com/krishrushipandit-sketch/interviewer
echo =============================================
pause
goto end

:error
echo.
echo ERROR occurred. Check the message above.
pause

:end
