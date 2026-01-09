# Prox System Dashboard Guide

Comprehensive web-based dashboard for monitoring and managing your Prox data collection automation system.

## Quick Start

```bash
cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery
./start_dashboard.sh
```

**Dashboard URL:** http://localhost:5555

## Features Overview

### 🏠 Main Dashboard
- **Real-time system health monitoring**
- **Data collection statistics** 
- **Trending products analysis**
- **Automation service status**
- **One-click actions** for all system operations

### 🔄 Interactive Controls
- **Run Collection** - Manually trigger data collection
- **Update Trends** - Recalculate trend scores  
- **Test Health** - Run comprehensive health checks
- **Test Alerts** - Send test notifications
- **Refresh All** - Update all dashboard data
- **Export Report** - Download detailed health report

### 📊 Monitoring Sections

#### System Health
- Overall system status indicator
- Detailed health check results
- Active alerts and warnings
- Database connectivity status

#### Data Collection Stats
- Posts collected in last 24 hours
- Platform-specific breakdowns
- Collection run history
- Total system statistics

#### Trending Products
- Top 10 trending products with scores
- Trend score distribution chart
- Product pricing information
- Last update timestamps

#### Automation Services
- macOS LaunchDaemon status
- Service start/stop status
- Log file information and sizes
- Recent activity monitoring

## Dashboard Sections

### 1. Status Overview (Top Cards)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  System Health  │ Posts (24h)     │ Total Products  │ Automation      │
│  🟢 HEALTHY     │ 1,234 posts     │ 275 products    │ 2/2 services    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### 2. Control Panel
Interactive buttons for system management:
- **🔄 Run Collection** - Execute data collection manually
- **📈 Update Trends** - Recalculate all trend scores
- **🏥 Test Health** - Run health diagnostic
- **📧 Test Alerts** - Send test notification
- **🔄 Refresh All** - Update all dashboard data
- **📄 Export Report** - Download health report

### 3. Health Checks
Real-time system health monitoring:
- ✅ **Database Health** - Connection and data status
- ✅ **Collection Status** - Recent collection activity
- ⚠️ **API Health** - Endpoint availability
- ✅ **Disk Space** - Storage availability
- ✅ **Log Files** - Log health and rotation

### 4. Collection Statistics
Data collection performance metrics:
- Platform-specific post counts
- Collection timing and frequency
- Success/failure rates
- Total system statistics

### 5. Trending Products Analysis
- **Top Trending Products** table with scores and pricing
- **Trend Score Distribution** chart showing score ranges
- Real-time updates when trend scoring runs

### 6. Automation Services
macOS LaunchDaemon management:
- Service status (running/stopped/unknown)
- Process IDs and uptime
- Log file sizes and last modified times
- Service management commands

### 7. Activity Log
Real-time activity stream showing:
- Manual actions triggered from dashboard
- System health check results
- Collection and trend scoring activities
- Error messages and alerts

## API Endpoints

The dashboard provides RESTful API endpoints for integration:

### Health Monitoring
- `GET /api/health` - Current system health status
- `GET /api/export-health-report` - Download detailed report

### Data Collection
- `GET /api/collection-stats` - Collection statistics
- `POST /api/run-collection` - Trigger manual collection
- `POST /api/test-health` - Run health test

### Trending Products  
- `GET /api/trending-products` - Top trending products and scores
- `POST /api/run-trend-scoring` - Update trend scores

### Automation Management
- `GET /api/automation-status` - Service status
- `POST /api/send-test-alert` - Send test alert
- `POST /api/clear-cache` - Clear dashboard cache

### Example API Usage

```bash
# Get system health
curl http://localhost:5555/api/health

# Trigger collection
curl -X POST http://localhost:5555/api/run-collection

# Get trending products
curl http://localhost:5555/api/trending-products
```

## Configuration

### Environment Variables
```bash
# Alert Configuration (optional)
export SMTP_HOST=smtp.gmail.com
export SMTP_USER=your-email@gmail.com
export SMTP_PASSWORD=your-app-password
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Dashboard Configuration
export DASHBOARD_HOST=127.0.0.1  # Default
export DASHBOARD_PORT=5555        # Default
```

### Custom Port
To run on a different port:
```bash
# Edit dashboard/app.py, change:
app.run(host='127.0.0.1', port=5555)  # Change port here
```

## Automation Integration

### Auto-refresh
- Dashboard automatically refreshes every 5 minutes
- Manual refresh available via "Refresh All" button
- Individual sections can be refreshed by clicking

### Caching
- Health data cached for 1 minute
- Collection stats cached for 2 minutes  
- Trending products cached for 5 minutes
- Automation status cached for 30 seconds

### Real-time Updates
- Activity log updates in real-time
- Status indicators update immediately after actions
- Progress feedback for all button actions

## Troubleshooting

### Dashboard Won't Start

1. **Check Python and Flask:**
   ```bash
   python3 --version
   python3 -c "import flask; print('Flask installed')"
   ```

2. **Install missing dependencies:**
   ```bash
   pip3 install flask flask-cors
   ```

3. **Check database connection:**
   ```bash
   cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery
   PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 -c "from database.connection import db; print('DB:', db.fetch_one('SELECT 1'))"
   ```

### Dashboard Shows Errors

1. **Database Connection Issues:**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Test database queries manually

2. **Script Execution Failures:**
   - Check script permissions: `chmod +x scripts/*.py`
   - Verify PYTHONPATH environment variable
   - Test scripts individually

3. **Port Already in Use:**
   ```bash
   # Kill existing dashboard
   lsof -ti:5555 | xargs kill -9
   
   # Or change port in dashboard/app.py
   ```

### Performance Issues

1. **Slow Loading:**
   - Clear cache: Click "Refresh All"
   - Check database performance
   - Monitor log files for errors

2. **High Memory Usage:**
   - Restart dashboard periodically
   - Monitor log file sizes
   - Check for database connection leaks

## Advanced Usage

### Production Deployment

For production use, replace Flask development server:

```bash
# Install gunicorn
pip3 install gunicorn

# Run with gunicorn
cd dashboard
gunicorn -w 4 -b 127.0.0.1:5555 app:app
```

### Custom Styling

Edit `dashboard/templates/dashboard.html` CSS section to customize:
- Color schemes
- Layout and spacing  
- Chart configurations
- Table styling

### Adding Custom Metrics

1. **Add API endpoint in `dashboard/app.py`:**
   ```python
   @app.route('/api/my-metric')
   def api_my_metric():
       # Your metric calculation
       return jsonify(data)
   ```

2. **Add frontend code in dashboard template:**
   ```javascript
   async function loadMyMetric() {
       const data = await apiCall('/api/my-metric');
       // Update dashboard
   }
   ```

### Integration with External Systems

The dashboard API can be integrated with:
- **Monitoring systems** (Prometheus, DataDog)
- **Alert managers** (PagerDuty, Slack)
- **CI/CD pipelines** for automated testing
- **Custom scripts** for extended functionality

## Security Considerations

### Development Use
- Dashboard is intended for local development
- No authentication/authorization implemented
- Runs on localhost only by default

### Production Use
- Add authentication middleware
- Use HTTPS with proper certificates
- Implement rate limiting
- Restrict network access
- Use environment variables for sensitive config

## Support

### Log Files
- Dashboard logs: `logs/dashboard.log`
- System logs: `logs/collection_*.log`, `logs/trend_scoring_*.log`
- Automation logs: `logs/launchd_*.log`

### Getting Help
1. Check activity log in dashboard
2. Review system health checks
3. Examine error messages in log files
4. Test individual components manually

### Common Solutions
- **Database issues**: Restart PostgreSQL service
- **Collection failures**: Check API rate limits
- **Trend scoring errors**: Verify product data integrity
- **Automation problems**: Check LaunchDaemon status

The dashboard provides a comprehensive interface for managing your entire Prox data collection system. Use it to monitor system health, trigger operations, and maintain your automation infrastructure.