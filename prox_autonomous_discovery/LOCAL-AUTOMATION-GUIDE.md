# Local Automation Setup Guide

Complete guide for setting up automated data collection on your local development machine.

## Quick Start

1. **Test your system first:**
   ```bash
   cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery
   ./quick_start_automation.sh
   ```

2. **Install automation services:**
   ```bash
   ./setup_local_automation.sh
   ```

## What Gets Installed

### Services
- **Data Collection**: Runs every 6 hours, collects from YouTube, Blog RSS feeds, Pinterest
- **Trend Scoring**: Runs every 6 hours, updates product trend scores after collection

### Files Created
- `com.prox.datacollection.plist` - macOS LaunchDaemon for data collection
- `com.prox.trendscoring.plist` - macOS LaunchDaemon for trend scoring
- `install_automation.sh` - Simple installation script (collection only)
- `setup_local_automation.sh` - Complete installation script (both services)

## Management Commands

### Service Status
```bash
# Check if services are running
sudo launchctl list | grep prox

# Expected output:
# -    0    com.prox.datacollection
# -    0    com.prox.trendscoring
```

### Manual Control
```bash
# Start services immediately
sudo launchctl start com.prox.datacollection
sudo launchctl start com.prox.trendscoring

# Stop services
sudo launchctl stop com.prox.datacollection  
sudo launchctl stop com.prox.trendscoring

# Restart services
sudo launchctl stop com.prox.datacollection && sudo launchctl start com.prox.datacollection
```

### Manual Collection
```bash
cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery

# Run collection manually
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/run_collection.py

# Run trend scoring manually
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/run_trend_scoring.py
```

## Log Monitoring

### Log Locations
- Collection Output: `logs/launchd_out.log`
- Collection Errors: `logs/launchd_error.log`
- Trend Scoring Output: `logs/launchd_trend_out.log`
- Trend Scoring Errors: `logs/launchd_trend_error.log`
- Application Logs: `logs/collection_YYYYMMDD_HHMMSS.log`

### Real-time Monitoring
```bash
# Watch all automation logs
tail -f logs/launchd_*.log

# Watch just collection
tail -f logs/launchd_out.log logs/launchd_error.log

# Watch application-level logs
tail -f logs/collection_*.log logs/trend_scoring_*.log
```

## Troubleshooting

### Services Not Starting
```bash
# Check system log for errors
sudo log show --predicate 'subsystem == "com.apple.launchd"' --last 1h | grep prox

# Verify plist files are valid
plutil -lint /Library/LaunchDaemons/com.prox.*.plist
```

### Collection Failures
```bash
# Check error logs
cat logs/launchd_error.log

# Test scripts manually
cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/run_collection.py --test
```

### Database Issues
```bash
# Test database connection
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 -c "
from database.connection import db
try:
    result = db.execute_query('SELECT COUNT(*) FROM platform_posts')
    print(f'✅ Database connected: {result[0][0]} posts')
except Exception as e:
    print(f'❌ Database error: {e}')
"
```

## Uninstallation

To completely remove the automation:

```bash
# Stop and unload services
sudo launchctl stop com.prox.datacollection
sudo launchctl stop com.prox.trendscoring
sudo launchctl unload /Library/LaunchDaemons/com.prox.datacollection.plist
sudo launchctl unload /Library/LaunchDaemons/com.prox.trendscoring.plist

# Remove plist files
sudo rm /Library/LaunchDaemons/com.prox.datacollection.plist
sudo rm /Library/LaunchDaemons/com.prox.trendscoring.plist

# Clean up log files (optional)
rm -rf logs/launchd_*.log
```

## Configuration

### Changing Collection Frequency
Edit the plist files and modify the `StartInterval` value (in seconds):
- 3600 = 1 hour
- 10800 = 3 hours  
- 21600 = 6 hours (default)
- 43200 = 12 hours
- 86400 = 24 hours

After editing, reload the services:
```bash
sudo launchctl unload /Library/LaunchDaemons/com.prox.datacollection.plist
sudo launchctl load /Library/LaunchDaemons/com.prox.datacollection.plist
```

### Environment Variables
The automation uses the system Python and relies on environment variables being available to the system daemons. If you need to add custom environment variables, edit the plist files' `EnvironmentVariables` section.

## Performance Notes

- **CPU Usage**: Collection runs are brief but intensive during execution
- **Memory**: Each collection uses ~200-500MB RAM temporarily
- **Network**: Downloads data from APIs, respect rate limits
- **Storage**: Logs accumulate over time, consider rotating them periodically

## Next Steps

Once local automation is working:
1. Monitor for a few collection cycles
2. Verify data is being collected and scored correctly
3. Consider setting up production deployment using `AUTOMATION-SETUP.md`
4. Set up monitoring and alerting for production use