#!/bin/bash
# Prox Dashboard Startup Script

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$SCRIPT_DIR/dashboard"

echo "🚀 Starting Prox System Dashboard..."
echo "====================================="

# Check if we're in the right directory
if [ ! -d "$DASHBOARD_DIR" ]; then
    echo "❌ Error: Dashboard directory not found at $DASHBOARD_DIR"
    exit 1
fi

# Check Python and Flask
if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📦 Installing Flask..."
    pip3 install flask flask-cors
fi

# Set environment variables
export PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery:$PYTHONPATH"

# Navigate to dashboard directory
cd "$DASHBOARD_DIR"

echo ""
echo "🎯 Dashboard Configuration:"
echo "  • URL: http://localhost:5555"
echo "  • Project: $SCRIPT_DIR"
echo "  • PYTHONPATH: $PYTHONPATH"
echo ""

# Check database connectivity
echo "🔍 Testing system connectivity..."
if PYTHONPATH="$PYTHONPATH" python3 -c "
import sys
sys.path.append('$SCRIPT_DIR')
from database.connection import db
try:
    result = db.fetch_one('SELECT 1')
    print('✅ Database connection successful')
except Exception as e:
    print(f'⚠️  Database connection failed: {e}')
    print('   Dashboard will still start but may have limited functionality')
" 2>/dev/null; then
    echo ""
else
    echo "⚠️  Database test failed - dashboard may have limited functionality"
    echo ""
fi

echo "🌐 Starting dashboard server..."
echo "   Press Ctrl+C to stop the dashboard"
echo ""

# Start the Flask application
PYTHONPATH="$PYTHONPATH" python3 app.py