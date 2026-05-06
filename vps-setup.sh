#!/bin/bash
# OTL System - VPS Deployment Script
# Run this on your VPS: bash vps-setup.sh

set -e

APP_DIR="/var/www/otlsystem"
REPO_URL=""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OTL System - VPS Deployment Script   ${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Update & install Node.js 20
echo -e "\n${YELLOW}[1/8] Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "Node.js version: $(node --version)"

# Step 2: Install PM2 and Nginx
echo -e "\n${YELLOW}[2/8] Installing PM2 and Nginx...${NC}"
npm install -g pm2
apt-get install -y nginx
systemctl enable nginx

# Step 3: Clone or update repository
echo -e "\n${YELLOW}[3/8] Setting up repository...${NC}"
if [ -d "$APP_DIR/.git" ]; then
  echo "Repository exists, pulling latest changes..."
  cd $APP_DIR && git pull origin main
else
  echo "Cloning repository..."
  mkdir -p /var/www
  git clone $REPO_URL $APP_DIR
fi

# Step 4: Install npm dependencies
echo -e "\n${YELLOW}[4/8] Installing npm dependencies...${NC}"
cd $APP_DIR && npm install

# Step 5: Create .env file
echo -e "\n${YELLOW}[5/8] Creating .env file...${NC}"
cat > $APP_DIR/.env << 'EOF'
SUPABASE_URL=https://yuddakkcoxllxfnaikus.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZii6Inl1ZGRha2tjb3hsbHhmbmFpa3VzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU3NTA0NiwiZXhwIjoyMDYyMTUxMDQ2fQ.HhvmpcTwzMSyf4WKJoXyweXaZLIBNC8TRD_x18aCKMw
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZii6Inl1ZGRha2tjb3hsbHhmbmFpa3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzUwNDYsImV4cCI6MjA2MjE1MTA0Nn0.byWMbObnT7TVUEJrtGHWoZqDdmiJLhKu_0JUrsmQQK4
PORT=5000
NODE_ENV=production
EOF
echo ".env file created."

# Step 6: Build frontend
echo -e "\n${YELLOW}[6/8] Building frontend...${NC}"
cd $APP_DIR && npm run build

# Step 7: Setup PM2 for backend
echo -e "\n${YELLOW}[7/8] Starting backend with PM2...${NC}"
pm2 delete otl-backend 2>/dev/null || true
cd $APP_DIR && pm2 start server/index.cjs --name otl-backend
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

# Step 8: Configure Nginx
echo -e "\n${YELLOW}[8/9] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/otlsystem << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    root /var/www/otlsystem/dist;
    index index.html;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        client_max_body_size 50m;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/otlsystem /etc/nginx/sites-enabled/otlsystem
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Step 9: Configure Firewall (UFW)
echo -e "\n${YELLOW}[9/9] Configuring Firewall...${NC}"
ufw allow 22/tcp
ufw allow 'Nginx Full'
ufw deny 5000/tcp
ufw --force enable
ufw status

# Done!
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETE!               ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "🌐 Website: ${GREEN}http://$VPS_IP${NC}"
echo -e "📡 API:     ${GREEN}http://$VPS_IP:5000${NC}"
echo -e "☁️  DB:      Supabase (cloud)"
echo -e ""
echo -e "📋 PM2 Status:"
pm2 list
echo -e ""
echo -e "Use 'pm2 logs otl-backend' to view server logs"
echo -e "${GREEN}========================================${NC}"
