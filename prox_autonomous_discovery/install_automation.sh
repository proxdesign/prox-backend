#!/bin/bash
# Install Prox Data Collection Automation (macOS)

PLIST_FILE="/Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery/com.prox.datacollection.plist"
TARGET_LOCATION="/Library/LaunchDaemons/com.prox.datacollection.plist"

echo "Installing Prox data collection automation..."

# Copy plist file
sudo cp "$PLIST_FILE" "$TARGET_LOCATION"

# Set correct permissions
sudo chown root:wheel "$TARGET_LOCATION"
sudo chmod 644 "$TARGET_LOCATION"

# Load the service
sudo launchctl load "$TARGET_LOCATION"

echo "✓ Automation installed and started"
echo "  Collection runs every 6 hours"
echo "  Logs: /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery/logs/"
echo ""
echo "Management commands:"
echo "  Stop:   sudo launchctl stop com.prox.datacollection"
echo "  Start:  sudo launchctl start com.prox.datacollection"
echo "  Status: sudo launchctl list | grep prox"
echo "  Remove: sudo launchctl unload '$TARGET_LOCATION' && sudo rm '$TARGET_LOCATION'"