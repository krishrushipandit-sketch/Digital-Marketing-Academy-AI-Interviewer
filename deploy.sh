#!/bin/bash
# RUSHIPANDIT Interviewer — VPS Deploy Script
# Run this on the VPS after first-time setup

set -e  # Stop on any error

echo "🚀 Deploying RUSHIPANDIT Interviewer..."

# Pull latest code
git pull origin main

# Install backend dependencies
cd /var/www/interviewer/backend
npm install --production

# Restart backend with PM2
cd /var/www/interviewer
pm2 restart interviewer-api 2>/dev/null || pm2 start ecosystem.config.js
pm2 save

echo "✅ Deployment complete! Backend running on port 5000."
echo "📋 Check status: pm2 status"
echo "📋 Check logs:   pm2 logs interviewer-api"
