# Railway Backend Deployment Guide

This guide walks through deploying the FastAPI backend to Railway to serve real Amazon products to proxdesign.co.

## 🚀 Railway Setup

### 1. Create Railway Account and Project
1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" 
3. Choose "Deploy from GitHub repo"
4. Connect your GitHub account and select this repository
5. Choose the `prox_autonomous_discovery` folder as the root

### 2. Add PostgreSQL Database
1. In your Railway project dashboard, click "New Service"
2. Select "PostgreSQL" from the database options
3. Railway will automatically create a PostgreSQL instance
4. The `DATABASE_URL` environment variable will be automatically provided

### 3. Configure Environment Variables
In Railway project settings → Variables, add:

```bash
# Required for production
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO

# API Keys (get from your .env file)
ANTHROPIC_API_KEY=your_claude_api_key
REDDIT_CLIENT_ID=your_reddit_client_id  
REDDIT_CLIENT_SECRET=your_reddit_secret
YOUTUBE_API_KEY=your_youtube_api_key

# Frontend CORS
FRONTEND_URL=https://www.proxdesign.co

# Optional - for trend discovery features
PINTEREST_APP_ID=your_pinterest_app_id
PINTEREST_APP_SECRET=your_pinterest_secret
PINTEREST_ACCESS_TOKEN=your_pinterest_token
```

**Note**: Railway automatically provides `DATABASE_URL` - don't set it manually.

### 4. Deploy
1. Railway will automatically deploy when you push to GitHub
2. Wait for deployment to complete (~2-5 minutes)
3. Note your Railway app URL: `https://YOUR-APP-NAME.up.railway.app`

## 🗄️ Database Initialization

### Option A: Using Railway Web Console
1. Go to your PostgreSQL service in Railway
2. Click "Connect" → "PostgreSQL CLI"
3. Run the database initialization:

```sql
-- Copy and paste the contents of schema.sql first
-- Then copy and paste the contents of data.sql
```

### Option B: Using Local psql
1. Get your DATABASE_URL from Railway environment variables
2. Run locally:

```bash
# Initialize schema
psql $DATABASE_URL -f schema.sql

# Load product data  
psql $DATABASE_URL -f data.sql
```

### Verify Database Setup
Test that data loaded correctly:
```sql
SELECT COUNT(*) FROM products WHERE active = true;
SELECT COUNT(*) FROM solutions;
-- Should show ~270 products and ~50 solutions
```

## 🌐 Frontend Update for Production

### 1. Add Backend URL to Vercel
1. In your Vercel dashboard, go to your prox-frontend-v2 project
2. Go to Settings → Environment Variables
3. Add production variable:
   ```
   Name: BACKEND_API_URL
   Value: https://YOUR-RAILWAY-APP.up.railway.app
   ```

### 2. Redeploy Frontend
```bash
cd prox-frontend-v2
vercel --prod
```

## ✅ Verification Steps

### 1. Test Backend Endpoints
```bash
# Health check
curl https://YOUR-RAILWAY-APP.up.railway.app/

# Test products endpoint
curl https://YOUR-RAILWAY-APP.up.railway.app/solutions/37/products

# Test trending products
curl https://YOUR-RAILWAY-APP.up.railway.app/trending-products?limit=5
```

### 2. Test Frontend Integration  
1. Visit https://www.proxdesign.co
2. Search for "cutting board" or "rolling kitchen cart"
3. Verify you see real Amazon products with:
   - Real product names (not "Product Title Not Available")
   - Real prices (not "Price unavailable") 
   - Amazon image URLs (`media-amazon.com`)
   - Affiliate links with `proxdesign20-20` tag

### 3. Check Production Logs
1. In Railway dashboard, go to your service
2. Click "Logs" to see real-time application logs
3. Look for successful product API calls

## 🔧 Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is automatically set by Railway PostgreSQL service
- Check Railway PostgreSQL service is running (green status)
- Verify database has tables: `\dt` in PostgreSQL CLI

### CORS Issues
- Verify `FRONTEND_URL` environment variable includes https://www.proxdesign.co
- Check Railway logs for CORS-related errors

### No Products Returned
- Verify database has product data: `SELECT COUNT(*) FROM products`
- Check solution mapping in frontend `productApi.ts`
- Test specific solution endpoints: `/solutions/37/products`

### API Performance
- Railway free tier has some limitations
- Monitor response times in Railway logs
- Consider upgrading Railway plan for production workloads

## 📊 Production Monitoring

After deployment, monitor:
- Railway application logs for errors
- Frontend search success rates
- Database query performance  
- API response times

The backend should now serve real Amazon products to your live site at https://www.proxdesign.co!