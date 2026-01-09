#!/bin/bash
# Quick Start - Prox Data Collection Automation
# Run this script to get started with automated data collection

set -e  # Exit on error

echo "🚀 Prox Autonomous Data Collection - Quick Start"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "scripts/run_collection.py" ]; then
    echo "❌ Error: Run this script from the prox_autonomous_discovery directory"
    echo "   cd /path/to/prox_autonomous_discovery && ./quick_start_automation.sh"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python
echo "🔍 Checking Python installation..."
if command_exists python3; then
    echo "✅ Python 3 found: $(python3 --version)"
else
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Check pip
if command_exists pip3; then
    echo "✅ pip3 found"
else
    echo "❌ pip3 not found. Please install pip3"
    exit 1
fi

# Install requirements if needed
echo ""
echo "📦 Installing/checking requirements..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
    echo "✅ Requirements installed"
else
    echo "⚠️  No requirements.txt found - proceeding anyway"
fi

# Test the system
echo ""
echo "🧪 Testing data collection system..."
echo "-----------------------------------"

echo "Testing collection script..."
if python3 scripts/run_collection.py --test; then
    echo "✅ Collection system test passed"
else
    echo "❌ Collection system test failed"
    echo "   Check your environment variables and database connection"
    exit 1
fi

echo ""
echo "Testing trend scoring script..."
if python3 scripts/run_trend_scoring.py --test; then
    echo "✅ Trend scoring system test passed"
else
    echo "❌ Trend scoring system test failed"
    echo "   Check your environment variables and database connection"
    exit 1
fi

echo ""
echo "Testing scheduler..."
if python3 scripts/start_scheduler.py --test; then
    echo "✅ Scheduler test passed"
else
    echo "❌ Scheduler test failed"
    exit 1
fi

# Show menu
echo ""
echo "🎯 System tests completed successfully!"
echo "======================================"
echo ""
echo "Choose how to run automation:"
echo ""
echo "1) Run single collection now (test)"
echo "2) Start continuous scheduler (runs forever)"
echo "3) Set up macOS automation (launchd)"
echo "4) Show production deployment options"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
    1)
        echo ""
        echo "🔄 Running single data collection..."
        echo "=================================="
        python3 scripts/run_collection.py
        
        echo ""
        echo "🎯 Running trend scoring update..."
        echo "================================"
        python3 scripts/run_trend_scoring.py
        
        echo ""
        echo "✅ Single collection complete!"
        echo "   Check the logs/ directory for detailed output"
        ;;
        
    2)
        echo ""
        echo "🔄 Starting continuous scheduler..."
        echo "================================="
        echo "   • Collections run every 6 hours"
        echo "   • Press Ctrl+C to stop"
        echo "   • Logs saved to logs/ directory"
        echo ""
        read -p "Start scheduler? [y/N]: " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            python3 scripts/start_scheduler.py
        else
            echo "Cancelled."
        fi
        ;;
        
    3)
        echo ""
        echo "🖥️  Setting up macOS automation..."
        echo "================================"
        echo "This will:"
        echo "  • Create launchd plist file"
        echo "  • Generate installation script"
        echo "  • Set up 6-hour collection schedule"
        echo ""
        read -p "Continue? [y/N]: " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            python3 scripts/deploy_automation.py
            echo ""
            echo "✅ Automation files created!"
            echo "   Run: ./install_automation.sh (requires sudo)"
        else
            echo "Cancelled."
        fi
        ;;
        
    4)
        echo ""
        echo "🚀 Production Deployment Options"
        echo "==============================="
        echo ""
        echo "Railway (Recommended):"
        echo "  • Automated cron jobs included"
        echo "  • Easy deployment with railway.json"
        echo "  • Built-in database hosting"
        echo ""
        echo "Docker Compose:"
        echo "  • Self-hosted option"
        echo "  • Scheduler service included"
        echo "  • Full control over infrastructure"
        echo ""
        echo "Kubernetes:"
        echo "  • Enterprise deployment"
        echo "  • CronJob resources for automation"
        echo "  • High availability setup"
        echo ""
        echo "Run: python3 scripts/deploy_automation.py"
        echo "   for detailed setup files and instructions"
        ;;
        
    5)
        echo "Goodbye! 👋"
        ;;
        
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "📖 For detailed documentation, see:"
echo "   • AUTOMATION-SETUP.md - Complete setup guide"
echo "   • logs/ directory - Collection and error logs"
echo "   • /analytics endpoint - View collection statistics"
echo ""
echo "🎉 Happy collecting! Your data pipeline is ready to go."