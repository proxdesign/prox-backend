# Production Deployment Guide

Comprehensive guide for deploying Prox data collection automation to production environments.

## Deployment Options

### 1. Railway (Recommended)

Railway provides the easiest deployment with built-in cron job support.

#### Setup Steps

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy to Railway:**
   ```bash
   cd /Volumes/Dave's Mac/prox-product-discovery/prox_autonomous_discovery
   railway up
   ```

3. **Configure Environment Variables:**
   In Railway dashboard, set:
   - `DATABASE_HOST` - Your PostgreSQL host
   - `DATABASE_NAME` - Database name (e.g., prox_discovery)
   - `DATABASE_USER` - Database username
   - `DATABASE_PASSWORD` - Database password
   - `DATABASE_PORT` - Database port (default: 5432)
   - `ANTHROPIC_API_KEY` - Your Claude API key
   - Note: Reddit API removed due to ToS restrictions
   - `YOUTUBE_DATA_API_KEY` - YouTube Data API key
   - `PINTEREST_API_KEY` - Pinterest API key (if available)

#### Automated Jobs

The `railway.json` configures:
- **Data Collection**: Every 6 hours (`0 */6 * * *`)
- **Trend Scoring**: 30 minutes after collection (`30 */6 * * *`)
- **Health Checks**: Every 30 minutes (`*/30 * * * *`)

#### Monitoring Railway Deployment

```bash
# View service logs
railway logs

# View cron job logs
railway logs --deployment cron

# Force manual collection
railway run python3 scripts/run_collection.py --force

# Check service status
railway status
```

### 2. Docker Compose (Self-Hosted)

For self-hosted deployments with full control.

#### Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Main API service
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "8000:8000"
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
      - PINTEREST_API_KEY=${PINTEREST_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # Data collection scheduler
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
      - PINTEREST_API_KEY=${PINTEREST_API_KEY}
      - COLLECTION_FREQUENCY_HOURS=6
    depends_on:
      postgres:
        condition: service_healthy
    command: python3 scripts/start_scheduler.py
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  # PostgreSQL database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: prox_discovery
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis for caching (optional)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Deployment Commands

```bash
# Create environment file
cp .env.example .env.prod
# Edit .env.prod with your production values

# Deploy with production config
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f scheduler
docker-compose -f docker-compose.prod.yml logs -f api

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale scheduler=2

# Manual collection
docker-compose -f docker-compose.prod.yml exec scheduler python3 scripts/run_collection.py
```

### 3. Kubernetes (Enterprise)

For high-availability enterprise deployments.

#### CronJob Resources

Create `k8s/cronjobs.yaml`:

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
          - name: collector
            image: prox/data-collector:latest
            command:
            - python3
            - scripts/run_collection.py
            env:
            - name: DATABASE_HOST
              valueFrom:
                secretKeyRef:
                  name: prox-secrets
                  key: database-host
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: prox-secrets
                  key: database-password
            # Add other environment variables
          restartPolicy: OnFailure
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: prox-trend-scoring
spec:
  schedule: "30 */6 * * *"  # 30 minutes after collection
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: scorer
            image: prox/data-collector:latest
            command:
            - python3
            - scripts/run_trend_scoring.py
            env:
            - name: DATABASE_HOST
              valueFrom:
                secretKeyRef:
                  name: prox-secrets
                  key: database-host
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: prox-secrets
                  key: database-password
          restartPolicy: OnFailure
```

#### Deployment

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/deployments.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/cronjobs.yaml

# Monitor
kubectl get cronjobs
kubectl get jobs
kubectl logs -l job-name=prox-data-collection-xxxxx
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | `localhost` or `postgres.railway.app` |
| `DATABASE_NAME` | Database name | `prox_discovery` |
| `DATABASE_USER` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `your-secure-password` |
| `DATABASE_PORT` | Database port | `5432` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-api03-...` |

### API Keys

| Variable | Description | Required |
|----------|-------------|----------|
| `REDDIT_CLIENT_ID` | Reddit API client ID | Yes |
| `REDDIT_CLIENT_SECRET` | Reddit API client secret | Yes |
| `YOUTUBE_DATA_API_KEY` | YouTube Data API key | Yes |
| `PINTEREST_API_KEY` | Pinterest API key | Optional |

### Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PROX_ENV` | Environment | `development` |
| `COLLECTION_FREQUENCY_HOURS` | Collection interval | `6` |
| `LOG_LEVEL` | Logging level | `INFO` |

## Security Considerations

### API Keys Management

1. **Never commit API keys to version control**
2. **Use environment variables or secret management**
3. **Rotate keys regularly**
4. **Use least-privilege access**

### Database Security

1. **Use strong passwords**
2. **Enable SSL/TLS connections**
3. **Restrict network access**
4. **Regular security updates**

### Network Security

1. **Use HTTPS for all external communications**
2. **Implement rate limiting**
3. **Monitor for unusual traffic patterns**
4. **Use VPC/private networks when possible**

## Monitoring & Alerting

### Health Checks

The system includes built-in health checks:
- **API Health**: `/health` endpoint
- **Collection Test**: `--test` flag on scripts
- **Database Connectivity**: Connection pool monitoring

### Metrics to Monitor

1. **Collection Success Rate**: % of successful collection runs
2. **Data Volume**: Number of posts collected per run
3. **API Response Times**: Time to complete collection
4. **Error Rates**: Failed collections and trend scoring
5. **Database Performance**: Query times and connection counts

### Logging

All services log to:
- **Application Logs**: Structured JSON logs with timestamps
- **System Logs**: Platform-specific logging (Railway, Docker, K8s)
- **Database Logs**: Query performance and errors

### Sample Monitoring Setup

```bash
# Check collection health (run every 5 minutes)
#!/bin/bash
if ! python3 scripts/run_collection.py --test; then
    echo "Collection test failed" | mail -s "Prox Collection Alert" admin@yourcompany.com
fi

# Check recent data (run hourly)
#!/bin/bash
RECENT_COUNT=$(psql -t -c "SELECT COUNT(*) FROM platform_posts WHERE created_at > NOW() - INTERVAL '2 hours'")
if [ "$RECENT_COUNT" -lt 10 ]; then
    echo "Low data collection: only $RECENT_COUNT posts in last 2 hours" | mail -s "Prox Data Alert" admin@yourcompany.com
fi
```

## Scaling Considerations

### Horizontal Scaling

- **Multiple Collectors**: Run multiple collection instances for different platforms
- **Database Read Replicas**: Separate read/write workloads
- **Caching Layer**: Redis for frequently accessed data
- **Load Balancing**: Distribute API requests

### Vertical Scaling

- **CPU**: Increase for faster data processing
- **Memory**: Increase for larger collection batches
- **Storage**: Monitor log and database growth
- **Network**: Ensure sufficient bandwidth for API calls

## Backup Strategy

### Database Backups

```bash
# Daily backups
pg_dump prox_discovery | gzip > backup_$(date +%Y%m%d).sql.gz

# Upload to cloud storage
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://prox-backups/
```

### Configuration Backups

- Environment variable configurations
- Kubernetes manifests
- Docker Compose files
- API key inventory

## Disaster Recovery

1. **Database Restoration**: Test restore procedures regularly
2. **Configuration Recovery**: Version control all config files
3. **API Key Recovery**: Secure backup of all credentials
4. **Monitoring Restoration**: Automated alerting setup

## Cost Optimization

### Railway
- Monitor usage through Railway dashboard
- Optimize collection frequency based on data needs
- Use staging environment for testing

### Self-Hosted
- Right-size compute resources
- Use spot/preemptible instances where appropriate
- Monitor API usage and costs
- Implement efficient data retention policies

## Next Steps

1. **Choose deployment platform** (Railway recommended for simplicity)
2. **Set up monitoring** before going live
3. **Test with staging environment** first
4. **Implement backup procedures**
5. **Set up alerting** for critical failures
6. **Document runbook** for operations team