#!/bin/bash

# Prox Autonomous Discovery - Docker Development Environment Startup
# Complete containerized development setup for simplified local development

set -e

echo "🚀 Starting Prox Autonomous Discovery Development Environment"
echo "============================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check for required environment variables
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env file template..."
    cat > "$ENV_FILE" << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prox_discovery

# Redis Configuration  
REDIS_URL=redis://localhost:6379

# AI Service API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Amazon Affiliate Configuration
AMAZON_ASSOCIATE_TAG=proxdesign20-20
NEXT_PUBLIC_AFFILIATE_TAG=proxdesign20-20

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    echo "⚠️  Please edit .env file with your API keys before continuing"
    echo "   Required: ANTHROPIC_API_KEY"
    echo ""
    read -p "Press Enter to continue after setting up .env file..."
fi

# Source environment variables
source "$ENV_FILE"

# Validate required environment variables
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key_here" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set in .env file"
    echo "   Please add your Anthropic API key to .env and restart"
    exit 1
fi

echo "✅ Environment variables loaded"

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down --volumes 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

# Wait for PostgreSQL
echo "   Checking PostgreSQL..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo "   ✅ PostgreSQL ready"
        break
    fi
    echo "   ⏳ Waiting for PostgreSQL ($i/30)..."
    sleep 2
done

# Wait for Redis
echo "   Checking Redis..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo "   ✅ Redis ready"
        break
    fi
    echo "   ⏳ Waiting for Redis ($i/30)..."
    sleep 2
done

# Wait for API
echo "   Checking API..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "   ✅ API ready"
        break
    fi
    echo "   ⏳ Waiting for API ($i/30)..."
    sleep 2
done

# Wait for Frontend
echo "   Checking Frontend..."
for i in {1..60}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "   ✅ Frontend ready"
        break
    fi
    echo "   ⏳ Waiting for Frontend ($i/60)..."
    sleep 2
done

echo ""
echo "🎉 Development Environment Started Successfully!"
echo "=============================================="
echo ""
echo "📊 Services Available:"
echo "   • Frontend:  http://localhost:3000"
echo "   • API:       http://localhost:8000"
echo "   • API Docs:  http://localhost:8000/docs"
echo "   • Database:  localhost:5432 (postgres/postgres)"
echo "   • Redis:     localhost:6379"
echo ""
echo "🛠️  Development Commands:"
echo "   • View logs:     docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart:       docker-compose restart"
echo "   • Shell access:  docker-compose exec prox-api bash"
echo ""
echo "📝 Database Management:"
echo "   • Connect:       docker-compose exec postgres psql -U postgres -d prox_discovery"
echo "   • Backup:        docker-compose exec postgres pg_dump -U postgres prox_discovery > backup.sql"
echo ""

# Show running containers
echo "🐳 Running Containers:"
docker-compose ps

echo ""
echo "✨ Happy coding! Your development environment is ready."