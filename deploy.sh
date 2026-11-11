#!/bin/bash
set -e

APP_DIR="/var/www/ALP-System-2-"
cd "$APP_DIR"

echo "=========================================="
echo "🚀 ALP System - Automated Deployment"
echo "=========================================="

# 1. Clean working tree (discard local drifts so pull is always clean)
echo "🧹 Checking working tree..."
git checkout -- . 2>/dev/null || true

# 2. Pull latest code
echo "📥 Pulling latest code from origin/main..."
git pull origin main

# 3. Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install --no-audit

# 4. Install Puppeteer Chrome browser for PDF generation
echo "🌐 Ensuring Puppeteer Chrome is installed..."
npx puppeteer browsers install chrome || true

# 5. Build frontend
echo "🛠️ Building Vite frontend..."
npm run build

# 6. Restart backend via PM2
echo "🔄 Restarting PM2 process 'ALPSystem'..."
if pm2 describe ALPSystem > /dev/null 2>&1; then
    pm2 restart ALPSystem --update-env
else
    pm2 start server/index.cjs --name ALPSystem
fi
pm2 save

# 7. Health Check
echo "🔍 Running health check..."
HTTP_STATUS=""
for i in {1..10}; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5001/api/bot/status || true)
    if [ "$HTTP_STATUS" = "200" ]; then
        break
    fi
    sleep 1
done

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Health check passed! (HTTP 200 on /api/bot/status)"
else
    echo "⚠️ Warning: Health check returned status: $HTTP_STATUS (check 'pm2 logs ALPSystem')"
fi

echo "=========================================="
echo "🎉 Deployment Complete!"
echo "🌐 Live App:     https://alphalogisticsystem.com"
echo "📱 WhatsApp QR:  https://alphalogisticsystem.com/api/bot/qr"
echo "=========================================="
