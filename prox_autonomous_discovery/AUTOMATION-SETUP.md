# Automated Data Collection Setup Guide

This guide covers setting up automated data collection for the Prox platform on both local development and production environments.

## 📁 Files Created

### Core Scripts
- `scripts/start_scheduler.py` - Long-running scheduler (Option A)
- `scripts/run_collection.py` - Single collection run (Option B)  
- `scripts/run_trend_scoring.py` - Trend score updates

### Features
- ✅ Error handling and graceful shutdown
- ✅ Comprehensive logging with rotation
- ✅ Database tracking of collection runs
- ✅ API rate limiting respect
- ✅ Configurable collection frequency
- ✅ Platform-specific collection options

---

## 🖥️ Local Development Setup (macOS)

### Option A: Long-Running Scheduler

**Best for:** Development environments where you want continuous collection

```bash
# Navigate to project directory
cd /Volumes/Dave's\ Mac/prox-product-discovery/prox_autonomous_discovery

# Test the scheduler first
python3 scripts/start_scheduler.py --test

# Start the scheduler (runs forever)
python3 scripts/start_scheduler.py

# Or run single collection cycle for testing
python3 scripts/start_scheduler.py --once
```

### Option B: Scheduled Jobs with launchd (macOS)

**Best for:** Production-like automation on macOS

1. **Create launchd plist file:**

```bash
# Create the plist file
sudo nano /Library/LaunchDaemons/com.prox.datacollection.plist
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.prox.datacollection</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery/scripts/run_collection.py</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>/Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery</string>
    
    <key>StartInterval</key>
    <integer>21600</integer> <!-- 6 hours in seconds -->
    
    <key>StandardOutPath</key>
    <string>/tmp/prox_collection.log</string>
    
    <key>StandardErrorPath</key>
    <string>/tmp/prox_collection_error.log</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
```

2. **Load and start the service:**

```bash
# Load the service
sudo launchctl load /Library/LaunchDaemons/com.prox.datacollection.plist

# Start immediately (optional)
sudo launchctl start com.prox.datacollection

# Check status
sudo launchctl list | grep prox

# View logs
tail -f /tmp/prox_collection.log
```

3. **Manage the service:**

```bash
# Stop the service
sudo launchctl stop com.prox.datacollection

# Unload the service
sudo launchctl unload /Library/LaunchDaemons/com.prox.datacollection.plist

# Restart the service
sudo launchctl unload /Library/LaunchDaemons/com.prox.datacollection.plist
sudo launchctl load /Library/LaunchDaemons/com.prox.datacollection.plist
```

### Option C: Traditional Cron (Alternative)

```bash
# Edit crontab
crontab -e

# Add this line for collection every 6 hours
0 */6 * * * cd /Volumes/Dave\'s\ Mac/prox-product-discovery/prox_autonomous_discovery && /usr/bin/python3 scripts/run_collection.py

# Add trend scoring 30 minutes after collection
30 */6 * * * cd /Volumes/Dave\'s\ Mac/prox-product-discovery/prox_autonomous_discovery && /usr/bin/python3 scripts/run_trend_scoring.py

# View current crontab
crontab -l
```

---

## 🚀 Production Deployment

### Railway Scheduled Jobs

Railway supports cron-based scheduled jobs. Add to your `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "uvicorn api.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "on-failure",
    "restartPolicyMaxRetries": 10
  },
  "cron": {
    "datacollection": {
      "schedule": "0 */6 * * *",
      "command": "python3 scripts/run_collection.py"
    },
    "trendscoring": {
      "schedule": "30 */6 * * *", 
      "command": "python3 scripts/run_trend_scoring.py"
    }
  }
}
```

### Vercel (Frontend) + Railway (Backend)

Since Vercel doesn't support long-running processes, use Railway for automation:

1. **Deploy backend to Railway** with cron jobs (see above)
2. **Deploy frontend to Vercel** (no automation needed)
3. **Configure environment variables** on both platforms

### Docker Compose (Self-Hosted)

Add scheduler service to `docker-compose.yml`:

```yaml
version: '3.8'
services:
  # ... existing services ...
  
  scheduler:
    build:
      context: .
      dockerfile: Dockerfile.api
    environment:
      - PROX_ENV=production
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=prox_discovery
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID}
      - REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET}
      - YOUTUBE_DATA_API_KEY=${YOUTUBE_DATA_API_KEY}
    depends_on:
      - postgres
    command: python3 scripts/start_scheduler.py
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### Kubernetes CronJobs

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: prox-data-collection
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: collection
            image: prox-api:latest
            command: ["python3", "scripts/run_collection.py"]
            env:
            - name: DATABASE_HOST
              value: "postgres-service"
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: prox-secrets
                  key: anthropic-api-key
          restartPolicy: OnFailure
```

---

## 🔧 Configuration Options

### Environment Variables

```bash
# Collection frequency (hours)
export COLLECTION_FREQUENCY_HOURS=6

# API rate limiting
export YOUTUBE_API_QUOTA_LIMIT=10000
export REDDIT_API_RATE_LIMIT=60

# Logging level
export LOG_LEVEL=INFO

# Environment
export PROX_ENV=production
```

### Script Arguments

```bash
# Collection script options
python3 scripts/run_collection.py --help
python3 scripts/run_collection.py --force          # Ignore recent runs
python3 scripts/run_collection.py --platform reddit # Single platform
python3 scripts/run_collection.py --test           # Test mode

# Trend scoring options  
python3 scripts/run_trend_scoring.py --help
python3 scripts/run_trend_scoring.py --limit 100   # Limit products
python3 scripts/run_trend_scoring.py --threshold 0.5 # Score change threshold

# Scheduler options
python3 scripts/start_scheduler.py --help
python3 scripts/start_scheduler.py --once          # Single run
python3 scripts/start_scheduler.py --test          # Test initialization
```

---

## 📊 Monitoring & Logs

### Log Files
```bash
# Collection logs (dated)
logs/collection_YYYYMMDD_HHMMSS.log

# Scheduler logs
logs/scheduler.log

# Trend scoring logs (daily)
logs/trend_scoring_YYYYMMDD.log
```

### Database Tracking
```sql
-- Collection run history
SELECT * FROM collection_runs ORDER BY start_time DESC LIMIT 10;

-- Trend scoring history
SELECT * FROM scoring_runs ORDER BY run_time DESC LIMIT 10;

-- Recent data collection stats
SELECT 
  platform,
  COUNT(*) as posts,
  MAX(created_at) as latest_post
FROM platform_posts 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY platform;
```

### Health Checks
```bash
# Test system health
curl http://localhost:8001/health/detailed

# Check collection status
python3 scripts/run_collection.py --test

# Check trend scoring
python3 scripts/run_trend_scoring.py --test
```

---

## 🚨 Troubleshooting

### Common Issues

**1. API Rate Limits**
```bash
# Check recent runs to avoid hitting limits
ls -la logs/collection_*
tail logs/collection_$(ls logs/collection_* | tail -1)
```

**2. Database Connection Issues**
```bash
# Test database connectivity
python3 -c "from database.connection import db; print(db.fetch_one('SELECT 1'))"
```

**3. Missing Dependencies**
```bash
# Install requirements
pip3 install -r requirements.txt
```

**4. Permission Issues (macOS launchd)**
```bash
# Fix plist permissions
sudo chown root:wheel /Library/LaunchDaemons/com.prox.datacollection.plist
sudo chmod 644 /Library/LaunchDaemons/com.prox.datacollection.plist
```

### Recovery Procedures

**Restart Collection System:**
```bash
# Option A: Restart scheduler
pkill -f start_scheduler.py
python3 scripts/start_scheduler.py &

# Option B: Reload launchd service
sudo launchctl unload /Library/LaunchDaemons/com.prox.datacollection.plist
sudo launchctl load /Library/LaunchDaemons/com.prox.datacollection.plist
```

**Manual Collection Run:**
```bash
# Force immediate collection
python3 scripts/run_collection.py --force

# Update trend scores
python3 scripts/run_trend_scoring.py
```

---

## 🎯 Recommended Setup

### Development
- **Use Option A** (start_scheduler.py) for active development
- **Use Option B** (launchd) for stable local testing

### Production
- **Railway**: Use cron jobs in railway.json
- **Self-hosted**: Use Docker Compose with scheduler service
- **Cloud**: Use Kubernetes CronJobs or cloud scheduler services

### Collection Schedule
```
Every 6 hours: Data collection
30 min later:  Trend scoring update
Daily:         Log cleanup and health checks
Weekly:        Database optimization
```

---

## ✅ Quick Start Checklist

1. **Test the system:**
   ```bash
   python3 scripts/run_collection.py --test
   python3 scripts/run_trend_scoring.py --test
   ```

2. **Run manual collection:**
   ```bash
   python3 scripts/run_collection.py
   python3 scripts/run_trend_scoring.py
   ```

3. **Set up automation:**
   - Choose Option A (scheduler) or Option B (launchd/cron)
   - Configure environment variables
   - Test automated runs

4. **Monitor results:**
   - Check log files
   - Verify database updates
   - Monitor API usage

**🎉 Your automated data collection system is ready!**