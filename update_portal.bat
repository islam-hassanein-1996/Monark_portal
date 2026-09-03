@echo off
title Updating Monark Portal...
cd /d "F:\Monark\claude_projects\portal"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing changes...
git commit -m "Auto update pages: %date% %time%"

echo [3/3] Pushing to GitHub and Cloudflare...
git push origin main

echo ===================================================
echo  Done! Cloudflare is updating your site right now.
echo ===================================================
pause