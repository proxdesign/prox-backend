# Prox Autonomous Data Collection System

Complete automation system for collecting and analyzing product data from social media platforms.

## 🚀 Quick Start

### Option 1: Web Dashboard (Recommended)
```bash
cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery
./start_dashboard.sh
```
**Open:** http://localhost:5555

### Option 2: Command Line
```bash
# Run collection
./scripts/run_collection.py

# Update trends  
./scripts/run_trend_scoring.py

# Check health
./scripts/health_monitor.py
```

### Option 3: Full Automation Setup
```bash
# Local automation (macOS)
./setup_local_automation.sh

# Production deployment
./deploy.sh
```

## 📊 System Components

### Data Collection
- **Reddit** - Subreddit posts and comments
- **YouTube** - Video metadata and descriptions  
- **Pinterest** - Pins and board data (limited)
- **Instagram** - Future integration planned

### Analysis Engine
- **Trend Scoring** - AI-powered product trend analysis
- **Product Matching** - Link products to trending problems
- **Market Intelligence** - Identify emerging opportunities

### Automation Infrastructure
- **Scheduler** - 6-hour collection cycles
- **Health Monitoring** - System health and alerting
- **Local/Production** - Multiple deployment options

## 📚 Documentation

| Guide | Purpose | Use When |
|-------|---------|----------|
| **[DASHBOARD-GUIDE.md](DASHBOARD-GUIDE.md)** | Web dashboard usage | You want a visual interface |
| **[LOCAL-AUTOMATION-GUIDE.md](LOCAL-AUTOMATION-GUIDE.md)** | Local setup | Setting up development automation |
| **[PRODUCTION-DEPLOYMENT.md](PRODUCTION-DEPLOYMENT.md)** | Production deployment | Deploying to Railway/Docker/K8s |
| **[MONITORING-SETUP.md](MONITORING-SETUP.md)** | Monitoring & alerts | Setting up health checks |
| **[AUTOMATION-SETUP.md](AUTOMATION-SETUP.md)** | General automation | Understanding the system |

## 🎯 Current Status

### ✅ Working Features
- **Data Collection**: Reddit, YouTube, Pinterest APIs
- **Trend Analysis**: AI-powered scoring algorithm  
- **Web Dashboard**: Real-time monitoring interface
- **Health Checks**: Comprehensive system monitoring
- **Local Automation**: macOS LaunchDaemon setup
- **Production Ready**: Railway, Docker, Kubernetes configs
- **Alerting**: Email, Slack, webhook notifications

### 📈 System Stats
- **275 products** in trend analysis
- **29 posts** collected in last 2 hours
- **Database size**: 16 MB
- **System status**: ✅ HEALTHY

## 🛠️ Management Commands

### Web Dashboard
```bash
./start_dashboard.sh               # Start dashboard
# Then use web interface at http://localhost:5555
```

### Manual Operations
```bash
# Data collection
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/run_collection.py

# Trend scoring
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/run_trend_scoring.py

# Health check
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/health_monitor.py

# Integrated monitoring
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/monitor_and_alert.py
```

### Automation Management
```bash
# Check service status
sudo launchctl list | grep prox

# Start/stop services
sudo launchctl start com.prox.datacollection
sudo launchctl stop com.prox.datacollection

# View logs
tail -f logs/launchd_*.log
tail -f logs/collection_*.log
```

## 🔧 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Prox Data Collection System               │
├─────────────────────────────────────────────────────────────┤
│  Web Dashboard (Port 5555)                                 │
│  ├── System Health Monitoring                              │
│  ├── Data Collection Controls                              │
│  ├── Trend Analysis Dashboard                              │
│  └── Automation Management                                 │
├─────────────────────────────────────────────────────────────┤
│  Data Collection Engine                                     │
│  ├── Reddit Collector     (API + PRAW)                    │
│  ├── YouTube Collector    (Data API v3)                   │
│  ├── Pinterest Collector  (Limited API)                   │
│  └── Collection Scheduler (6-hour intervals)              │
├─────────────────────────────────────────────────────────────┤
│  Analysis Engine                                           │
│  ├── Trend Scorer        (AI-powered analysis)            │
│  ├── Product Matcher     (Problem → Product linking)      │
│  └── Market Intelligence (Emerging trend detection)       │
├─────────────────────────────────────────────────────────────┤
│  Monitoring & Alerting                                     │
│  ├── Health Monitor      (Database, APIs, Resources)      │
│  ├── Alert Manager       (Email, Slack, Webhooks)        │
│  └── Activity Logging    (Comprehensive audit trail)      │
├─────────────────────────────────────────────────────────────┤
│  Automation Infrastructure                                  │
│  ├── Local Automation    (macOS LaunchDaemon)             │
│  ├── Production Deploy   (Railway, Docker, K8s)           │
│  └── Health Monitoring   (Continuous system checks)       │
├─────────────────────────────────────────────────────────────┤
│  Data Storage                                              │
│  ├── PostgreSQL Database (Posts, Products, Trends)        │
│  ├── Application Logs    (Structured logging)             │
│  └── Health Reports      (JSON exports)                   │
└─────────────────────────────────────────────────────────────┘
```

---

**🎉 Your complete data collection automation system is ready!**

Start with the web dashboard for the best experience: `./start_dashboard.sh`