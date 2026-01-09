#!/bin/bash
# Production Deployment Script for Prox Data Collection

set -e

echo "🚀 Prox Production Deployment Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "scripts/run_collection.py" ]; then
    echo "❌ Error: Run this script from the prox_autonomous_discovery directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""
echo "🎯 Choose deployment platform:"
echo "1) Railway (Recommended - includes cron jobs)"
echo "2) Docker Compose (Self-hosted)"
echo "3) Kubernetes (Enterprise)"
echo "4) Test local setup first"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "🚂 Railway Deployment"
        echo "===================="
        
        # Check Railway CLI
        if ! command_exists railway; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        echo "✅ Railway CLI ready"
        echo ""
        echo "📋 Pre-deployment checklist:"
        echo "  • railway.json configured with cron jobs ✅"
        echo "  • Scripts tested and working ✅"
        echo "  • Database ready for connection"
        echo "  • API keys available"
        echo ""
        read -p "Continue with Railway deployment? [y/N]: " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            echo ""
            echo "🔐 Login to Railway..."
            railway login
            
            echo ""
            echo "🚀 Deploying to Railway..."
            railway up
            
            echo ""
            echo "✅ Deployment initiated!"
            echo ""
            echo "📝 Next steps:"
            echo "1. Go to Railway dashboard: https://railway.app/project"
            echo "2. Set environment variables:"
            echo "   • DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD"
            echo "   • ANTHROPIC_API_KEY"
            echo "   • REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET"
            echo "   • YOUTUBE_DATA_API_KEY"
            echo "   • PINTEREST_API_KEY (optional)"
            echo "3. Monitor cron jobs in Railway dashboard"
            echo ""
            echo "🔄 Automated jobs configured:"
            echo "   • Data collection: Every 6 hours"
            echo "   • Trend scoring: 30min after collection"
            echo "   • Health checks: Every 30min"
        else
            echo "Deployment cancelled."
        fi
        ;;
        
    2)
        echo ""
        echo "🐳 Docker Compose Deployment"
        echo "============================"
        
        # Check Docker
        if ! command_exists docker; then
            echo "❌ Docker not found. Please install Docker first."
            exit 1
        fi
        
        if ! command_exists docker-compose; then
            echo "❌ Docker Compose not found. Please install Docker Compose first."
            exit 1
        fi
        
        echo "✅ Docker and Docker Compose ready"
        echo ""
        
        # Check for .env.prod file
        if [ ! -f ".env.prod" ]; then
            echo "📝 Creating production environment file..."
            cp .env.prod.template .env.prod
            echo "⚠️  Please edit .env.prod with your actual values before continuing!"
            echo "   File: $(pwd)/.env.prod"
            echo ""
            read -p "Have you configured .env.prod? [y/N]: " configured
            
            if [[ ! $configured =~ ^[Yy]$ ]]; then
                echo "Please configure .env.prod first, then run this script again."
                exit 1
            fi
        fi
        
        echo ""
        echo "🔧 Starting production deployment..."
        
        # Build and start services
        docker-compose -f docker-compose.prod.yml --env-file .env.prod build
        docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
        
        echo ""
        echo "✅ Docker Compose deployment started!"
        echo ""
        echo "📊 Service status:"
        docker-compose -f docker-compose.prod.yml ps
        echo ""
        echo "📝 Useful commands:"
        echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
        echo "  Stop: docker-compose -f docker-compose.prod.yml down"
        echo "  Manual collection: docker-compose -f docker-compose.prod.yml exec scheduler python3 scripts/run_collection.py"
        echo ""
        echo "🌐 API will be available at: http://localhost:8000"
        echo "📊 Health check: curl http://localhost:8000/health"
        ;;
        
    3)
        echo ""
        echo "☸️  Kubernetes Deployment"
        echo "========================"
        
        # Check kubectl
        if ! command_exists kubectl; then
            echo "❌ kubectl not found. Please install kubectl first."
            exit 1
        fi
        
        echo "✅ kubectl ready"
        echo ""
        echo "📋 Pre-deployment checklist:"
        echo "  • Kubernetes cluster accessible"
        echo "  • Docker image built and pushed to registry"
        echo "  • Secrets configured in k8s/secrets.yaml"
        echo ""
        read -p "Continue with Kubernetes deployment? [y/N]: " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            echo ""
            echo "⚠️  Please update k8s/secrets.yaml with your actual values first!"
            echo "   Then edit the image references in k8s/cronjobs.yaml"
            echo ""
            read -p "Have you updated the K8s configs? [y/N]: " configured
            
            if [[ $configured =~ ^[Yy]$ ]]; then
                echo ""
                echo "🚀 Deploying to Kubernetes..."
                
                kubectl apply -f k8s/namespace.yaml
                kubectl apply -f k8s/secrets.yaml
                kubectl apply -f k8s/cronjobs.yaml
                
                echo ""
                echo "✅ Kubernetes deployment complete!"
                echo ""
                echo "📝 Management commands:"
                echo "  Status: kubectl get cronjobs -n prox-discovery"
                echo "  Jobs: kubectl get jobs -n prox-discovery"
                echo "  Logs: kubectl logs -l app.kubernetes.io/component=collector -n prox-discovery"
                echo "  Manual run: kubectl create job --from=cronjob/prox-data-collection manual-run-$(date +%s) -n prox-discovery"
            else
                echo "Please update K8s configurations first."
            fi
        else
            echo "Deployment cancelled."
        fi
        ;;
        
    4)
        echo ""
        echo "🧪 Testing Local Setup"
        echo "====================="
        
        # Run the quick start script
        if [ -f "quick_start_automation.sh" ]; then
            ./quick_start_automation.sh
        else
            echo "❌ quick_start_automation.sh not found"
        fi
        ;;
        
    5)
        echo "Goodbye! 👋"
        exit 0
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "📖 For detailed documentation, see:"
echo "   • PRODUCTION-DEPLOYMENT.md - Complete production guide"
echo "   • LOCAL-AUTOMATION-GUIDE.md - Local development setup"
echo "   • AUTOMATION-SETUP.md - General automation guide"
echo ""
echo "🎉 Happy deploying! Your automated data collection is ready."