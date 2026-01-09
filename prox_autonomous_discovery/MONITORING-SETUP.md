# Monitoring and Alerting Setup Guide

Complete guide for setting up monitoring and alerting for the Prox data collection system.

## Overview

The monitoring system provides:
- **Health Checks**: Automated system health monitoring
- **Alerting**: Email, Slack, and webhook notifications
- **Logging**: Comprehensive application logging
- **Metrics**: Performance and data collection metrics

## Components

### 1. Health Monitor (`scripts/health_monitor.py`)

Comprehensive health checking script that monitors:
- Database connectivity and performance
- Data collection status and volumes
- API endpoint health
- Disk space usage
- Log file health

### 2. Alert Manager (`scripts/send_alerts.py`)

Alert delivery system supporting:
- Email notifications
- Slack webhooks
- Custom webhook integrations
- Multiple alert levels (info, warning, critical)

### 3. Application Logging

Structured logging throughout the system:
- Collection logs: `logs/collection_*.log`
- Trend scoring logs: `logs/trend_scoring_*.log`
- System logs: `logs/launchd_*.log` (macOS)

## Quick Setup

### 1. Test Health Monitoring

```bash
cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery

# Basic health check
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/health_monitor.py

# Export health report
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/health_monitor.py --export json --output health_report.json

# Export text summary  
PYTHONPATH="/Volumes/Dave's Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/health_monitor.py --export text
```

### 2. Configure Alerting

Create `.env.monitoring` with your alert settings:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_FROM_EMAIL=prox-alerts@yourcompany.com
ALERT_TO_EMAILS=admin@yourcompany.com,devops@yourcompany.com

# Slack Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Custom Webhook (optional)
CUSTOM_WEBHOOK_URL=https://your-monitoring.com/webhook
```

### 3. Test Alerting

```bash
# Test email alerts
python3 scripts/send_alerts.py --test-email

# Test Slack alerts
python3 scripts/send_alerts.py --test-slack

# Send custom alert
python3 scripts/send_alerts.py --message "Test alert from Prox system" --level warning
```

## Automated Monitoring Setup

### Option 1: macOS LaunchDaemon

Create monitoring daemon that runs health checks:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.prox.monitoring</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery/scripts/monitor_and_alert.py</string>
    </array>
    
    <key>StartInterval</key>
    <integer>1800</integer> <!-- 30 minutes -->
    
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### Option 2: Cron Job

```bash
# Edit crontab
crontab -e

# Add monitoring job (every 30 minutes)
*/30 * * * * cd /Volumes/Dave's\ Mac/prox-product-discovery/prox_autonomous_discovery && PYTHONPATH="/Volumes/Dave's\ Mac/prox-product-discovery/prox_trend_discovery" python3 scripts/monitor_and_alert.py >> logs/monitoring.log 2>&1
```

### Option 3: Docker/Kubernetes

For containerized deployments, add monitoring sidecar:

```yaml
# Docker Compose
monitoring:
  build: .
  command: python3 scripts/monitor_and_alert.py --daemon
  environment:
    - MONITORING_INTERVAL=1800  # 30 minutes
  volumes:
    - ./logs:/app/logs
  restart: unless-stopped
```

```yaml
# Kubernetes CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: prox-monitoring
spec:
  schedule: "*/30 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: monitor
            image: prox/data-collector:latest
            command:
            - python3
            - scripts/health_monitor.py
            - --alert-email
```

## Alert Configuration

### Email Setup

#### Gmail Configuration
```bash
# Use App Password (not regular password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

#### Custom SMTP
```bash
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_USER=alerts@yourcompany.com
SMTP_PASSWORD=your-smtp-password
```

### Slack Setup

1. **Create Slack Webhook:**
   - Go to https://api.slack.com/apps
   - Create new app → Incoming Webhooks
   - Add webhook to workspace
   - Copy webhook URL

2. **Configure Webhook:**
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_CHANNEL_ID/YOUR_WEBHOOK_TOKEN
   ```

### Custom Webhooks

For integration with other monitoring systems:

```bash
# Send to custom monitoring endpoint
CUSTOM_WEBHOOK_URL=https://your-monitoring-system.com/api/alerts

# Webhook will receive JSON payload:
{
  "timestamp": "2026-01-09T10:45:00Z",
  "level": "warning",
  "message": "Alert message",
  "system": "prox-data-collection"
}
```

## Monitoring Metrics

### Key Health Indicators

1. **Data Collection Volume**
   - Posts collected per hour
   - Collection success rate
   - API response times

2. **System Health**
   - Database connectivity
   - Disk space usage
   - Memory utilization
   - Log file growth

3. **Data Quality**
   - Duplicate detection rate
   - Trend score distribution
   - Collection coverage by platform

### Custom Metrics

Add custom metrics to your monitoring:

```python
# In your collection scripts
import time
start_time = time.time()

# ... collection logic ...

duration = time.time() - start_time
logger.info(f"METRIC: collection_duration={duration:.2f}")
logger.info(f"METRIC: posts_collected={post_count}")
logger.info(f"METRIC: success_rate={success_rate:.2f}")
```

## Integration with External Monitoring

### Prometheus Integration

```python
# Add to health_monitor.py
from prometheus_client import CollectorRegistry, Gauge, push_to_gateway

registry = CollectorRegistry()
health_gauge = Gauge('prox_health_status', 'System health status', registry=registry)

# Update metrics
health_gauge.set(1 if status == 'healthy' else 0)
push_to_gateway('prometheus-pushgateway:9091', job='prox-health', registry=registry)
```

### Datadog Integration

```python
from datadog import initialize, statsd

initialize(api_key='your-api-key', app_key='your-app-key')

# Send metrics
statsd.gauge('prox.posts_collected', post_count, tags=['platform:reddit'])
statsd.increment('prox.collection_success', tags=['platform:youtube'])
```

### New Relic Integration

```python
import newrelic.agent

@newrelic.agent.background_task()
def collect_data():
    # Collection logic
    newrelic.agent.record_custom_metric('Custom/Prox/PostsCollected', post_count)
```

## Troubleshooting

### Common Issues

1. **Email Alerts Not Sending**
   ```bash
   # Test email configuration
   python3 scripts/send_alerts.py --test-email
   
   # Check logs for SMTP errors
   tail -f logs/monitoring.log
   ```

2. **Slack Alerts Not Working**
   ```bash
   # Verify webhook URL
   curl -X POST -H 'Content-type: application/json' \
     --data '{"text":"Test message"}' \
     $SLACK_WEBHOOK_URL
   ```

3. **Health Checks Failing**
   ```bash
   # Run health check manually with debug output
   python3 scripts/health_monitor.py --export text
   
   # Check database connectivity
   psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -c "SELECT 1"
   ```

### Log Analysis

```bash
# Monitor real-time logs
tail -f logs/*.log

# Search for errors in collection
grep -i error logs/collection_*.log

# Check alert delivery status
grep -i "alert sent" logs/monitoring.log

# Analyze collection patterns
grep "posts collected" logs/collection_*.log | tail -20
```

## Performance Optimization

### Monitoring Performance Impact

- Health checks run in ~2-5 seconds
- Memory usage: ~50-100MB during checks
- Network: Minimal (database queries only)
- Disk: Log files grow ~1MB/day

### Optimization Tips

1. **Adjust Check Frequency**
   - Critical systems: Every 15 minutes
   - Development: Every hour
   - Production: Every 30 minutes

2. **Optimize Database Queries**
   - Use indexed columns for time-based queries
   - Limit result sets in health checks
   - Cache non-critical metrics

3. **Log Rotation**
   ```bash
   # Setup logrotate for monitoring logs
   echo "/path/to/logs/*.log {
     daily
     missingok
     rotate 30
     compress
     notifempty
     copytruncate
   }" | sudo tee /etc/logrotate.d/prox-monitoring
   ```

## Advanced Monitoring

### Dashboard Creation

Create monitoring dashboard showing:
- Collection volume over time
- System health status
- Alert frequency
- API response times

### Predictive Monitoring

Set up alerts for trends:
- Decreasing collection volumes
- Increasing error rates
- Unusual data patterns
- Resource usage trends

### Automated Recovery

```bash
# Auto-restart failed services
if ! python3 scripts/health_monitor.py > /dev/null 2>&1; then
    echo "Health check failed, restarting services..."
    sudo launchctl stop com.prox.datacollection
    sudo launchctl start com.prox.datacollection
fi
```

## Security Considerations

1. **Secure Alert Channels**
   - Use encrypted SMTP connections
   - Protect webhook URLs
   - Implement rate limiting

2. **Sensitive Data in Logs**
   - Don't log API keys or passwords
   - Mask sensitive database queries
   - Sanitize error messages

3. **Access Control**
   - Restrict monitoring script permissions
   - Secure monitoring endpoints
   - Use service accounts for alerts

## Next Steps

1. **Test monitoring setup** with your alert channels
2. **Set up automated monitoring** using preferred method
3. **Create monitoring dashboard** for visibility
4. **Establish alert response procedures** for your team
5. **Document escalation procedures** for critical alerts