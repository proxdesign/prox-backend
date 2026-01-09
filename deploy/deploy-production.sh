#!/bin/bash
# Prox Production Deployment Helper Script

set -e

echo "🚀 Prox Production Deployment Helper"
echo "===================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo "📁 Project directory: $PROJECT_ROOT"

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/railway.json" ]; then
    echo "❌ Error: railway.json not found in project root"
    echo "   Make sure you're running this from the deploy directory"
    exit 1
fi

echo ""
echo "🎯 Pre-deployment checklist:"
echo ""

# Check for required files
echo "📄 Checking required files..."
required_files=(
    "railway.json"
    "requirements.txt"
    "prox_autonomous_discovery/api/main.py"
    "prox-frontend-v2/package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
        exit 1
    fi
done

echo ""
echo "🔧 Checking tools..."

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Consider committing them first."
    read -p "Continue anyway? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Choose deployment option:"
echo ""
echo "1) Prepare for Railway backend deployment"
echo "2) Prepare for Vercel frontend deployment" 
echo "3) Test production build locally"
echo "4) Validate environment variables"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "🚂 Preparing Railway Backend Deployment"
        echo "======================================"
        
        cd "$PROJECT_ROOT"
        
        # Ensure we're on main branch
        current_branch=$(git branch --show-current)
        if [ "$current_branch" != "main" ]; then
            echo "⚠️  You're on branch '$current_branch', not 'main'"
            read -p "Switch to main branch? [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git checkout main
            fi
        fi
        
        # Check if railway is logged in
        echo "🔐 Checking Railway authentication..."
        if ! railway whoami &> /dev/null; then
            echo "Please login to Railway:"
            railway login
        fi
        
        echo ""
        echo "📋 Railway Deployment Steps:"
        echo ""
        echo "1. Go to Railway dashboard: https://railway.app/dashboard"
        echo "2. Create new project"
        echo "3. Select 'Deploy from GitHub repo'"
        echo "4. Choose this repository"
        echo "5. Select main branch"
        echo ""
        echo "Environment variables to set in Railway:"
        echo "---------------------------------------"
        cat "$SCRIPT_DIR/environment-template.env" | grep -E "^[A-Z]" | head -15
        echo "... (see environment-template.env for complete list)"
        echo ""
        echo "✨ Railway will automatically use railway.json configuration"
        echo ""
        read -p "Press Enter when Railway project is created..."
        
        echo ""
        echo "🧪 Testing Railway deployment..."
        echo "After deployment completes:"
        echo ""
        echo "Test commands:"
        echo "curl https://your-app.railway.app/health"
        echo "curl https://your-app.railway.app/api/products/trending"
        echo ""
        ;;
        
    2)
        echo ""
        echo "🌐 Preparing Vercel Frontend Deployment"
        echo "======================================"
        
        cd "$PROJECT_ROOT/prox-frontend-v2"
        
        # Check if package.json exists
        if [ ! -f "package.json" ]; then
            echo "❌ package.json not found in prox-frontend-v2/"
            exit 1
        fi
        
        echo "📦 Installing dependencies..."
        npm install
        
        echo ""
        echo "🔨 Testing production build..."
        if npm run build; then
            echo "✅ Production build successful"
        else
            echo "❌ Production build failed"
            exit 1
        fi
        
        # Check if vercel is logged in
        echo ""
        echo "🔐 Checking Vercel authentication..."
        if ! vercel whoami &> /dev/null; then
            echo "Please login to Vercel:"
            vercel login
        fi
        
        echo ""
        echo "📋 Vercel Deployment Steps:"
        echo ""
        echo "1. Go to Vercel dashboard: https://vercel.com/dashboard"
        echo "2. Click 'New Project'"
        echo "3. Import this GitHub repository"
        echo "4. Set Root Directory: prox-frontend-v2"
        echo "5. Framework Preset: Next.js"
        echo ""
        echo "Environment variables to set in Vercel:"
        echo "---------------------------------------"
        echo "NEXT_PUBLIC_API_URL=https://your-railway-backend.railway.app"
        echo "NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app"
        echo "NEXT_PUBLIC_AMAZON_PARTNER_TAG=your-amazon-associate-tag"
        echo "NEXT_PUBLIC_ENVIRONMENT=production"
        echo ""
        read -p "Press Enter when Vercel project is created..."
        ;;
        
    3)
        echo ""
        echo "🧪 Testing Production Build Locally"
        echo "=================================="
        
        echo ""
        echo "Testing Backend..."
        cd "$PROJECT_ROOT/prox_trend_discovery"
        
        if [ -f ".env" ]; then
            echo "✅ Backend .env file found"
        else
            echo "⚠️  Backend .env file not found"
            echo "Create .env with required variables for testing"
        fi
        
        # Test backend import
        if python3 -c "import api.main; print('Backend imports successful')" 2>/dev/null; then
            echo "✅ Backend imports working"
        else
            echo "❌ Backend import errors detected"
        fi
        
        echo ""
        echo "Testing Frontend..."
        cd "$PROJECT_ROOT/prox-frontend-v2"
        
        if [ -f ".env.local" ]; then
            echo "✅ Frontend .env.local file found"
        else
            echo "⚠️  Frontend .env.local file not found"
            echo "Create .env.local with NEXT_PUBLIC_* variables for testing"
        fi
        
        # Test frontend build
        if npm run build > /dev/null 2>&1; then
            echo "✅ Frontend builds successfully"
        else
            echo "❌ Frontend build errors detected"
            echo "Run 'npm run build' to see details"
        fi
        ;;
        
    4)
        echo ""
        echo "🔍 Environment Variables Validation"
        echo "=================================="
        
        echo ""
        echo "Required environment variables checklist:"
        echo ""
        
        required_vars=(
            "DATABASE_URL"
            "ANTHROPIC_API_KEY"
            "AMAZON_ACCESS_KEY"
            "AMAZON_SECRET_KEY"
            "AMAZON_PARTNER_TAG"
            "JWT_SECRET"
            "REDDIT_CLIENT_ID"
            "REDDIT_CLIENT_SECRET"
            "YOUTUBE_DATA_API_KEY"
        )
        
        echo "Backend (Railway) variables:"
        for var in "${required_vars[@]}"; do
            echo "  ☐ $var"
        done
        
        echo ""
        echo "Frontend (Vercel) variables:"
        echo "  ☐ NEXT_PUBLIC_API_URL"
        echo "  ☐ NEXT_PUBLIC_SITE_URL"
        echo "  ☐ NEXT_PUBLIC_AMAZON_PARTNER_TAG"
        echo "  ☐ NEXT_PUBLIC_ENVIRONMENT"
        
        echo ""
        echo "📋 Use the deployment checklist for complete verification:"
        echo "   deploy/deployment-checklist.md"
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
echo "📚 Additional Resources:"
echo ""
echo "• Complete deployment guide: deploy/PRODUCTION_SETUP.md"
echo "• Deployment checklist: deploy/deployment-checklist.md" 
echo "• Environment template: deploy/environment-template.env"
echo ""
echo "🎉 Good luck with your deployment!"