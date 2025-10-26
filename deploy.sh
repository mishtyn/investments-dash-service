#!/bin/bash

# Production deployment script for Investments Dashboard
# Author: Investments Dashboard Team
# Description: Deploys the application to production environment

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo -e "${YELLOW}Please create .env.production file based on .env.production.example${NC}"
    exit 1
fi

# Confirm deployment
echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION environment!${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 1
fi

echo ""
echo "📦 Step 1: Pulling latest code..."
git pull origin master || {
    echo -e "${RED}❌ Failed to pull latest code${NC}"
    exit 1
}

echo ""
echo "🏗️  Step 2: Building Docker images..."
docker-compose -f docker-compose.production.yml build || {
    echo -e "${RED}❌ Failed to build Docker images${NC}"
    exit 1
}

echo ""
echo "🛑 Step 3: Stopping existing containers..."
docker-compose -f docker-compose.production.yml down || {
    echo -e "${YELLOW}⚠️  No existing containers to stop${NC}"
}

echo ""
echo "🚀 Step 4: Starting new containers..."
docker-compose -f docker-compose.production.yml up -d || {
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
}

echo ""
echo "⏳ Step 5: Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo ""
echo "🔍 Checking service status..."
docker-compose -f docker-compose.production.yml ps

# Check backend health
echo ""
echo "🏥 Checking backend health..."
max_attempts=30
attempt=0
until curl -f http://localhost/api/health > /dev/null 2>&1 || [ $attempt -eq $max_attempts ]; do
    attempt=$((attempt+1))
    echo "Waiting for backend to be healthy... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Backend health check failed!${NC}"
    echo "Showing backend logs:"
    docker-compose -f docker-compose.production.yml logs backend
    exit 1
fi

echo ""
echo "🧹 Step 6: Cleaning up old images..."
docker image prune -f || {
    echo -e "${YELLOW}⚠️  Failed to clean up old images${NC}"
}

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Service URLs:"
echo "  - Frontend: http://localhost or http://your-server-ip"
echo "  - API Docs: http://localhost/docs"
echo "  - ReDoc: http://localhost/redoc"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.production.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.production.yml down"
echo "  - Restart services: docker-compose -f docker-compose.production.yml restart"
echo ""
echo "🎉 Happy deploying!"

