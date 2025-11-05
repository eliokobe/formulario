#!/bin/bash

# DigitalOcean App Platform Deployment Script
# Make sure you have doctl installed and authenticated

set -e

echo "🚀 Deploying Contacto App to DigitalOcean App Platform..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI is not installed. Please install it first:"
    echo "   Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if user is authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ doctl is not authenticated. Please run:"
    echo "   doctl auth init"
    exit 1
fi

# Build and deploy
echo "📦 Building application..."
npm run build

echo "🚢 Deploying to DigitalOcean..."
doctl apps create .do/app.yaml

echo "✅ Deployment initiated!"
echo "📊 Check your app status with: doctl apps list"
echo "📝 View logs with: doctl apps logs <APP_ID>"
echo "🌐 Your app will be available at: https://<app-name>-<random>.ondigitalocean.app"
