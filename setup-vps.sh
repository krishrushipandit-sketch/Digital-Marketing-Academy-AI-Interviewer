#!/bin/bash
# ============================================================
# RUSHIPANDIT AI Interviewer — First-Time VPS Setup Script
# Run this on your Hostinger VPS as root
# Usage: bash setup-vps.sh
# ============================================================

set -e  # Stop on error
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

log "🚀 Starting RUSHIPANDIT Interviewer VPS Setup..."

# ── 1. System update ─────────────────────────────────────────
log "Updating system packages..."
apt update && apt upgrade -y

# ── 2. Install Node.js 20 ────────────────────────────────────
log "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node --version && npm --version

# ── 3. Install PM2 (process manager) ─────────────────────────
log "Installing PM2..."
npm install -g pm2

# ── 4. Install Nginx ──────────────────────────────────────────
log "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# ── 5. Install Certbot (SSL) ──────────────────────────────────
log "Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx

# ── 6. Install Git ────────────────────────────────────────────
log "Installing Git..."
apt install -y git

# ── 7. Clone the repo ─────────────────────────────────────────
log "Cloning project from GitHub..."
mkdir -p /var/www
cd /var/www

if [ -d "interviewer" ]; then
    warn "Directory already exists. Pulling latest..."
    cd interviewer && git pull origin main
else
    git clone https://github.com/krishrushipandit-sketch/interviewer.git
    cd interviewer
fi

# ── 8. Install backend dependencies ───────────────────────────
log "Installing backend dependencies..."
cd /var/www/interviewer/backend
npm install --production

# ── 9. Configure Nginx ────────────────────────────────────────
log "Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/interviewer << 'NGINX'
server {
    listen 80;
    server_name 72.61.228.175;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/interviewer /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 10. Create .env file (placeholder — user must fill) ───────
log "Creating .env template..."
if [ ! -f /var/www/interviewer/backend/.env ]; then
    cat > /var/www/interviewer/backend/.env << 'ENVFILE'
# Fill in your actual values:
PORT=5000
CLIENT_URL=https://your-app.vercel.app
JWT_SECRET=supersecretinterviewerkey123

GEMINI_API_KEY=your_gemini_key_here
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY=./service-account-key.json

RETELL_API_KEY=your_retell_key_here
RETELL_AGENT_ID_GOOGLE_ADS=
RETELL_AGENT_ID_META_ADS=
RETELL_AGENT_ID_SEO=
RETELL_AGENT_ID_DIGITAL_MARKETING=
RETELL_AGENT_ID_HR=

CORS_ORIGIN=https://your-app.vercel.app
ENVFILE
    warn "⚠️  Edit /var/www/interviewer/backend/.env with your real values!"
    warn "⚠️  Upload service-account-key.json to /var/www/interviewer/backend/"
fi

# ── 11. Start backend with PM2 ────────────────────────────────
log "Starting backend with PM2..."
cd /var/www/interviewer
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

log ""
log "=============================================="
log "  ✅ VPS Setup Complete!"
log "=============================================="
log "  Backend: http://72.61.228.175/api/health"
log ""
log "  NEXT STEPS:"
log "  1. Edit .env:     nano /var/www/interviewer/backend/.env"
log "  2. Upload key:    scp service-account-key.json root@72.61.228.175:/var/www/interviewer/backend/"
log "  3. Restart:       pm2 restart interviewer-api"
log "  4. Check logs:    pm2 logs interviewer-api"
log "=============================================="
