# Prox Product Discovery - Deployment Guide

## Overview
AI-powered product recommendation platform that analyzes social media trends across Pinterest, Reddit, YouTube, and Google Trends to help users discover trending products.

## Tech Stack
- **Framework**: Next.js 16.1.0 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API
- **Product Data**: Rainforest API (Amazon)
- **Social APIs**: Pinterest, Reddit, YouTube, Google Trends
- **Deployment**: Vercel

## Key Features
- 🤖 AI-powered problem-to-product matching
- 📊 Real-time social media trend analysis
- 🔗 Amazon affiliate link integration
- 📱 Responsive design with modern UI
- ⚡ Optimized performance with caching
- 🛡️ Rate limiting and abuse protection
- 📄 Legal compliance (Privacy Policy, Terms)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone [repo-url]
   cd prox-frontend-v2
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your API keys
   ```

3. **Development**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## API Integrations

### Required APIs
- **Anthropic Claude**: AI chat and recommendations
- **Rainforest API**: Amazon product data

### Optional Social APIs (uses mock data if not configured)
- **Pinterest Business API**: Product trends and saves
- **Reddit API**: Community discussions
- **YouTube Data API**: Product reviews and videos
- **Serpapi**: Google Trends data

## Deployment to proxdesign.co

### 1. Vercel Deployment
```bash
vercel --prod
```

### 2. Environment Variables
Set these in Vercel dashboard:
```
ANTHROPIC_API_KEY=sk-ant-...
RAINFOREST_API_KEY=...
AMAZON_ASSOCIATE_TAG=yourtag-20
# Additional social media APIs (optional)
```

### 3. Domain Setup
- Point proxdesign.co to Vercel
- Configure SSL (automatic with Vercel)

## Architecture

### Frontend
- **app/page.tsx**: Main product discovery interface
- **components/**: Reusable UI components
- **app/api/**: API routes for chat, products, trending

### Backend
- **lib/productApi.ts**: Product search and affiliate links
- **lib/api/**: Social media API integrations
- **lib/trendScoring.ts**: Trend weight calculations
- **lib/mockData.ts**: Fallback data and problem definitions

### Legal
- **app/privacy-policy/**: GDPR-compliant privacy policy
- **app/terms/**: Terms of service with affiliate disclosure

## Performance
- Static generation for legal pages
- API caching (1hr products, 15min Pinterest)
- Rate limiting per IP
- Image optimization with Next.js

## Monitoring
- API usage tracking
- Rate limit monitoring
- Affiliate conversion tracking
- Error logging

## Support
For deployment issues, contact: support@proxdesign.co

---
**Status**: ✅ Ready for production deployment