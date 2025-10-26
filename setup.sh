#!/bin/bash

# Setup script for Investments Dashboard Service
# This script helps initialize the project

set -e

echo "🚀 Initializing Investments Dashboard Service..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=investments_dash
DATABASE_URL=postgresql://postgres:postgres@db:5432/investments_dash

# Application Configuration
APP_NAME=Investments Dashboard API
APP_VERSION=0.1.0
DEBUG=True
HOST=0.0.0.0
PORT=8000
EOF
    echo "✅ .env file created!"
else
    echo "ℹ️  .env file already exists, skipping..."
fi

# Check if .env.example exists
if [ ! -f .env.example ]; then
    echo "📝 Creating .env.example file..."
    cat > .env.example << 'EOF'
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=investments_dash
DATABASE_URL=postgresql://postgres:your_secure_password_here@db:5432/investments_dash

# Application Configuration
APP_NAME=Investments Dashboard API
APP_VERSION=0.1.0
DEBUG=True
HOST=0.0.0.0
PORT=8000
EOF
    echo "✅ .env.example file created!"
else
    echo "ℹ️  .env.example file already exists, skipping..."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Next steps:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Start the application:"
echo "   docker-compose up --build -d"
echo ""
echo "2. Check logs:"
echo "   docker-compose logs -f"
echo ""
echo "3. Create initial migration (if needed):"
echo "   docker-compose exec app alembic revision --autogenerate -m 'Initial migration'"
echo ""
echo "4. Open API documentation:"
echo "   🌐 Swagger UI: http://localhost:8000/docs"
echo "   🌐 ReDoc:      http://localhost:8000/redoc"
echo "   ❤️  Health:     http://localhost:8000/health"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Useful commands:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "• View logs:        docker-compose logs -f"
echo "• Stop services:    docker-compose down"
echo "• Restart:          docker-compose restart"
echo "• Run tests:        docker-compose exec app pytest"
echo "• Access DB:        docker-compose exec db psql -U postgres -d investments_dash"
echo "• Shell in app:     docker-compose exec app bash"
echo ""
echo "For more details, see:"
echo "  📖 QUICKSTART.md - Quick start guide"
echo "  📖 SETUP_GUIDE.md - Detailed setup instructions"
echo "  📖 ARCHITECTURE.md - Project architecture"
echo "  📖 README.md - Full documentation"
echo ""

