#!/bin/bash

# SSL Certificate Setup Script
# This script helps to set up SSL certificates using Let's Encrypt

set -e

echo "🔐 SSL Certificate Setup for Investments Dashboard"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script should be run as root or with sudo${NC}"
    echo "Please run: sudo ./setup-ssl.sh"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., example.com): " DOMAIN
read -p "Enter your email for Let's Encrypt notifications: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Domain and email are required!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  Email: $EMAIL"
echo ""
read -p "Is this correct? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${RED}Setup cancelled.${NC}"
    exit 1
fi

# Install certbot if not already installed
echo ""
echo "📦 Checking for certbot..."
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt-get update
    apt-get install -y certbot
else
    echo "✅ certbot is already installed"
fi

# Stop nginx temporarily if running
echo ""
echo "🛑 Stopping nginx temporarily..."
docker-compose -f docker-compose.production.yml stop nginx || true

# Obtain certificate
echo ""
echo "🔒 Obtaining SSL certificate..."
certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http

# Copy certificates to nginx directory
echo ""
echo "📋 Copying certificates..."
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem

# Update nginx configuration
echo ""
echo "⚙️  Updating nginx configuration..."
echo -e "${YELLOW}Please uncomment the HTTPS server block in nginx/conf.d/default.conf${NC}"
echo -e "${YELLOW}and update 'your-domain.com' to '$DOMAIN'${NC}"

# Restart nginx
echo ""
echo "🚀 Starting nginx..."
docker-compose -f docker-compose.production.yml up -d nginx

# Setup auto-renewal
echo ""
echo "🔄 Setting up auto-renewal..."
cat > /etc/cron.d/certbot-renew << EOF
0 3 * * * root certbot renew --quiet --deploy-hook "docker-compose -f $(pwd)/docker-compose.production.yml restart nginx"
EOF

echo ""
echo -e "${GREEN}✅ SSL setup completed successfully!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Edit nginx/conf.d/default.conf and uncomment the HTTPS server block"
echo "2. Replace 'your-domain.com' with '$DOMAIN' in the nginx config"
echo "3. Restart nginx: docker-compose -f docker-compose.production.yml restart nginx"
echo ""
echo "🎉 Your site will be available at: https://$DOMAIN"

