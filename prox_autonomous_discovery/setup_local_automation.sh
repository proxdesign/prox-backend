#!/bin/bash
# Complete Local Automation Setup for Prox Data Collection
# This script sets up both data collection and trend scoring automation

set -e

echo "🚀 Prox Local Automation Setup"
echo "=============================="

PROJECT_DIR="/Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery"
COLLECTION_PLIST="$PROJECT_DIR/com.prox.datacollection.plist"
TREND_PLIST="$PROJECT_DIR/com.prox.trendscoring.plist"
COLLECTION_TARGET="/Library/LaunchDaemons/com.prox.datacollection.plist"
TREND_TARGET="/Library/LaunchDaemons/com.prox.trendscoring.plist"

echo ""
echo "📋 Setup Overview:"
echo "  • Data Collection: Every 6 hours"
echo "  • Trend Scoring: Every 6 hours (30min offset)"
echo "  • Logs: $PROJECT_DIR/logs/"
echo "  • Services: com.prox.datacollection, com.prox.trendscoring"
echo ""

# Check if files exist
if [ ! -f "$COLLECTION_PLIST" ]; then
    echo "❌ Error: $COLLECTION_PLIST not found"
    exit 1
fi

if [ ! -f "$TREND_PLIST" ]; then
    echo "❌ Error: $TREND_PLIST not found"
    exit 1
fi

# Test scripts first
echo "🧪 Testing automation scripts..."
cd "$PROJECT_DIR"

echo "  Testing collection script..."
if PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/run_collection.py --test; then
    echo "  ✅ Collection script test passed"
else
    echo "  ❌ Collection script test failed - please fix before installing"
    exit 1
fi

echo "  Testing trend scoring script..."
if PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/run_trend_scoring.py --test; then
    echo "  ✅ Trend scoring script test passed"
else
    echo "  ❌ Trend scoring script test failed - please fix before installing"
    exit 1
fi

echo ""
read -p "📥 Ready to install automation services. Continue? [y/N]: " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

echo ""
echo "📦 Installing automation services..."

# Install data collection service
echo "  Installing data collection service..."
sudo cp "$COLLECTION_PLIST" "$COLLECTION_TARGET"
sudo chown root:wheel "$COLLECTION_TARGET"
sudo chmod 644 "$COLLECTION_TARGET"
sudo launchctl load "$COLLECTION_TARGET"
echo "  ✅ Data collection service installed"

# Install trend scoring service  
echo "  Installing trend scoring service..."
sudo cp "$TREND_PLIST" "$TREND_TARGET"
sudo chown root:wheel "$TREND_TARGET"
sudo chmod 644 "$TREND_TARGET"
sudo launchctl load "$TREND_TARGET"
echo "  ✅ Trend scoring service installed"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

echo ""
echo "🎉 Local automation setup complete!"
echo "=================================="
echo ""
echo "📊 Service Status:"
sudo launchctl list | grep prox || echo "  (Services may take a moment to appear)"
echo ""
echo "📁 Log Files:"
echo "  Collection:"
echo "    • Output: $PROJECT_DIR/logs/launchd_out.log"
echo "    • Errors: $PROJECT_DIR/logs/launchd_error.log" 
echo "  Trend Scoring:"
echo "    • Output: $PROJECT_DIR/logs/launchd_trend_out.log"
echo "    • Errors: $PROJECT_DIR/logs/launchd_trend_error.log"
echo ""
echo "🛠️  Management Commands:"
echo "  Status: sudo launchctl list | grep prox"
echo "  Stop Collection: sudo launchctl stop com.prox.datacollection"
echo "  Start Collection: sudo launchctl start com.prox.datacollection"
echo "  Stop Trends: sudo launchctl stop com.prox.trendscoring"  
echo "  Start Trends: sudo launchctl start com.prox.trendscoring"
echo ""
echo "  Manual collection: cd '$PROJECT_DIR' && PYTHONPATH='/Volumes/Dave'"'"'s Mac/prox-product-discovery/prox_trend_discovery'"'"' python3 scripts/run_collection.py"
echo ""
echo "🔄 First collection will run automatically within 6 hours"
echo "💡 To trigger immediate collection: sudo launchctl start com.prox.datacollection"
echo ""
echo "📖 Monitor progress with: tail -f $PROJECT_DIR/logs/launchd_*.log"