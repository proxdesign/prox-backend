# Prox Product Discovery - Claude Code Context

## Project Overview
Prox is an AI-powered furniture discovery platform that helps users find furniture solutions through conversational AI. It collects trend data from social media, analyzes it with Claude AI, and provides personalized product recommendations.

**Live Site:** https://proxdesign.co
**API:** https://prox-autonomous-discovery.fly.dev

## Project Structure

```
~/cloud-projects/prox-product-discovery/
├── prox_autonomous_discovery/    # Python backend (FastAPI)
│   ├── api/                      # FastAPI endpoints
│   ├── collectors/               # Data collection (YouTube, Blogs, Pinterest)
│   ├── analysis/                 # Claude AI analysis pipeline
│   ├── database/                 # PostgreSQL connection & queries
│   ├── config/                   # Settings and configuration
│   ├── scripts/                  # Utility scripts
│   └── .env                      # Backend environment variables
│
├── prox-frontend-v2/             # Next.js frontend (ACTIVE)
│   ├── src/app/                  # Next.js app router pages
│   ├── src/components/           # React components
│   ├── public/                   # Static assets
│   └── .env.local                # Frontend environment variables
│
├── prox-frontend/                # Legacy frontend (deprecated)
├── 00_archive/                   # Archived/old code
├── changelog.json                # Version history (in prox_autonomous_discovery/)
└── prox-setup.sh                 # Development environment setup script
```

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (React)
- **Styling:** CSS modules
- **Deployment:** Vercel

### Backend
- **Framework:** FastAPI (Python)
- **Server:** uvicorn
- **Deployment:** Fly.dev

### Database
- **Primary:** PostgreSQL (local dev + Fly.dev managed)
- **Caching:** Redis (optional, for rate limiting)

### AI/ML
- **Provider:** Anthropic Claude (claude-3-5-sonnet)
- **Uses:** Chat responses, semantic search, problem extraction from social posts

### External APIs
| Service | Purpose | Env Variable |
|---------|---------|--------------|
| Anthropic Claude | AI chat & analysis | `ANTHROPIC_API_KEY` |
| YouTube Data API | Video trend collection | `YOUTUBE_API_KEY` |
| Pinterest API v5 | Pin collection (limited) | `PINTEREST_*` |
| Canopy API | Amazon product search | `CANOPY_API_KEY` |
| Rainforest API | Amazon product data | `RAINFOREST_API_KEY` |
| Resend | Magic link emails | (in production) |
| Google Analytics | Usage tracking | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |

## Data Collection Pipeline

Active collectors (runs every 6 hours):
1. **YouTube** - Primary source, 14 search queries for furniture/organization content
2. **Blog/RSS** - 6 feeds: Apartment Therapy, The Spruce, Better Homes & Gardens, Real Simple, IKEA Hackers, Container Store Blog
3. **Pinterest** - Limited scope (user's own pins/boards only)

**Disabled:** Reddit (ToS), Instagram (ToS), TikTok (ToS)

## Key Files to Know

| File | Purpose |
|------|---------|
| `prox_autonomous_discovery/api/main.py` | FastAPI app entry point |
| `prox_autonomous_discovery/api/chat.py` | Chat endpoint with Claude |
| `prox_autonomous_discovery/collectors/scheduler.py` | Data collection orchestration |
| `prox-frontend-v2/src/app/page.tsx` | Homepage |
| `prox-frontend-v2/src/components/ChatInterface.tsx` | Main chat UI |
| `prox_autonomous_discovery/changelog.json` | Version history |

## Common Commands

```bash
# Setup/check environment
./prox-setup.sh check

# Start local development
./prox-setup.sh start

# Stop local servers
./prox-setup.sh stop

# Test API connections
./prox-setup.sh test-apis

# Backend only (from prox_autonomous_discovery/)
source venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Frontend only (from prox-frontend-v2/)
npm run dev

# Run data collection manually
cd prox_autonomous_discovery
python -m scripts.run_collection --platform youtube
```

## Database Schema (Key Tables)

- `users` - User accounts with magic link auth
- `platform_posts` - Collected social media content
- `problems` - Extracted furniture problems from posts
- `solutions` - AI-generated solution mappings
- `products` - 500+ Amazon affiliate products
- `saved_products` - User's saved items
- `product_feedback` - User feedback on recommendations
- `magic_links` - Passwordless auth tokens

## Environment Variables Needed

### Backend (.env)
```
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
YOUTUBE_API_KEY=AIza...
PINTEREST_APP_ID=...
PINTEREST_APP_SECRET=...
PINTEREST_ACCESS_TOKEN=pina_...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://prox-autonomous-discovery.fly.dev
ANTHROPIC_API_KEY=sk-ant-...
CANOPY_API_KEY=...
RAINFOREST_API_KEY=...
AMAZON_ASSOCIATE_TAG=proxdesign20-20
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
```

## Deployment

- **Frontend:** Auto-deploys to Vercel on push to main
- **Backend:** Deploy to Fly.dev with `fly deploy` from `prox_autonomous_discovery/`

## Notes for Claude Code

1. **Always use the iCloud path:** `~/cloud-projects/prox-product-discovery/`
2. **Active frontend is `prox-frontend-v2`** (not `prox-frontend`)
3. **Changelog is at:** `prox_autonomous_discovery/changelog.json` - update it for significant changes
4. **Don't commit .env files** - they contain real API keys
5. **Reddit collector is disabled** - don't re-enable without ToS review
6. **Production API is on Fly.dev**, not Railway (changelog may reference Railway - it's outdated)
