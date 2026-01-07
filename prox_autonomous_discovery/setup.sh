#!/bin/bash
# Prox Autonomous Discovery - Automated Setup
# Run this on your local machine

set -e  # Exit on any error

echo "=================================="
echo "Prox Setup - Automated Installation"
echo "=================================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

# Step 1: Create database
echo "Step 1: Creating PostgreSQL database..."
psql -U thepollees -c "DROP DATABASE IF EXISTS prox_trends;" 2>/dev/null || true
psql -U thepollees -c "CREATE DATABASE prox_trends;"
echo "✓ Database created"
echo ""

# Step 2: Create .env file
echo "Step 2: Creating .env file with your API keys..."
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://thepollees@localhost:5432/prox_trends

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USER_AGENT=ProxDiscovery/1.0

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Apify
APIFY_API_TOKEN=your_apify_api_token_here

# Amazon (add after approval)
AMAZON_ACCESS_KEY=your_amazon_access_key
AMAZON_SECRET_KEY=your_amazon_secret_key
AMAZON_PARTNER_TAG=your_amazon_associate_tag

# CJ Affiliate (add after approval)
CJ_API_KEY=your_cj_api_key

# App Configuration
ENVIRONMENT=development
DEBUG=True
LOG_LEVEL=INFO

# Agent Settings
LINK_CHECK_FREQUENCY_HOURS=6
DAILY_BUDGET_USD=15
COST_ALERT_THRESHOLD=1.2

# Frontend
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000
EOF
echo "✓ .env file created"
echo ""

# Step 3: Create virtual environment
echo "Step 3: Creating virtual environment..."
python3 -m venv venv
echo "✓ Virtual environment created"
echo ""

# Step 4: Activate and install dependencies
echo "Step 4: Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Step 5: Setup database schema
echo "Step 5: Setting up database schema..."
python scripts/setup_database.py
echo ""

# Step 6: Run system tests
echo "Step 6: Running system tests..."
python scripts/test_system.py
echo ""

# Step 7: Test Reddit collector
echo "Step 7: Testing Reddit collector..."
python collectors/reddit_collector.py
echo ""

# Step 8: Verify data
echo "Step 8: Verifying data in database..."
psql -U thepollees prox_trends -c "SELECT COUNT(*) as total_posts FROM platform_posts;"
psql -U thepollees prox_trends -c "SELECT platform, title FROM platform_posts LIMIT 3;"
echo ""

echo "=================================="
echo "✓ SETUP COMPLETE!"
echo "=================================="
echo ""
echo "Your system is ready to use."
echo ""
echo "To start collecting data:"
echo "  source venv/bin/activate"
echo "  python collectors/reddit_collector.py"
echo ""
echo "To check database:"
echo "  psql -U thepollees prox_trends"
echo ""
