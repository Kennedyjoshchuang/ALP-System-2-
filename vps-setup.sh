#!/bin/bash
# ALP System - VPS Deployment Script
# Run this on your VPS: bash vps-setup.sh

set -e

APP_DIR="/var/www/alpsystem"
REPO_URL="https://github.com/Kennedyjoshchuang/ALP-System-2-.git"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ALP System - VPS Deployment Script   ${NC}"
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
if [ -f "$APP_DIR/.env" ]; then
  echo ".env file already exists. Skipping creation."
else
  echo -e "${YELLOW}Please enter the Supabase configuration details:${NC}"
  read -p "SUPABASE_URL: " supabase_url
  read -p "SUPABASE_SERVICE_KEY: " supabase_service_key
  read -p "SUPABASE_ANON_KEY: " supabase_anon_key

  # Generate a secure random JWT_SECRET
  jwt_secret=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null || echo "a5e3f1c2b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1")

  cat > $APP_DIR/.env << EOF
SUPABASE_URL=$supabase_url
SUPABASE_SERVICE_KEY=$supabase_service_key
SUPABASE_ANON_KEY=$supabase_anon_key
PORT=5000
NODE_ENV=production
JWT_SECRET=$jwt_secret
EOF
  echo ".env file created with generated JWT_SECRET."
fi

# Step 6: Build frontend
echo -e "\n${YELLOW}[6/8] Building frontend...${NC}"
cd $APP_DIR && npm run build

# Step 7: Setup PM2 for backend
echo -e "\n${YELLOW}[7/8] Starting backend with PM2...${NC}"
pm2 delete alp-backend 2>/dev/null || true
cd $APP_DIR && pm2 start server/index.cjs --name alp-backend
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

# Step 8: Configure Nginx
echo -e "\n${YELLOW}[8/9] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/alpsystem << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    root /var/www/alpsystem/dist;
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

ln -sf /etc/nginx/sites-available/alpsystem /etc/nginx/sites-enabled/alpsystem
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
echo -e "Use 'pm2 logs alp-backend' to view server logs"
echo -e "${GREEN}========================================${NC}"
