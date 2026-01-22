# Prox Product Discovery - Claude Code Context

## Project Overview
Prox is an AI-powered furniture discovery platform that helps users find furniture solutions through conversational AI. It collects trend data from social media, analyzes it with Claude AI, and provides personalized product recommendations.

**Live Site:** https://proxdesign.co
**API:** https://prox-autonomous-discovery.fly.dev
**GitHub:** https://github.com/proxdesign/prox-backend

## Development Workflow

### Directory Structure
```
~/projects/prox-product-discovery/     # LOCAL - Fast development (SSD)
~/cloud-projects/prox-product-discovery/  # BACKUP - iCloud sync (slow for dev)
```

### Git Workflow
1. **Work locally** in `~/projects/prox-product-discovery/` for fast file I/O
2. **Commit and push** regularly to GitHub for backup
3. **iCloud copy** syncs automatically but is too slow for Next.js development

```bash
# Start work
cd ~/projects/prox-product-discovery

# After making changes
git add -A
git commit -m "Description of changes"
git push origin main

# Pull latest if working from another machine
git pull origin main
```

## Project Structure

```
~/projects/prox-product-discovery/
├── prox_autonomous_discovery/    # Python backend (FastAPI)
│   ├── api/                      # FastAPI endpoints
│   ├── collectors/               # Data collection (YouTube, Blogs, Pinterest)
│   ├── analysis/                 # Claude AI analysis pipeline
│   ├── database/                 # PostgreSQL connection & queries
│   ├── config/                   # Settings and configuration
│   ├── scripts/                  # Utility scripts
│   ├── dashboard/                # Health monitoring dashboard (localhost:5555)
│   └── .env                      # Backend environment variables
│
├── prox-frontend-v2/             # Next.js frontend (ACTIVE)
│   ├── app/                      # Next.js app router pages
│   ├── components/               # React components
│   ├── public/                   # Static assets
│   └── .env.local                # Frontend environment variables
│
├── CLAUDE.md                     # This context file
├── prox-setup.sh                 # Development environment setup script
└── changelog.json                # Version history (in prox_autonomous_discovery/)
```

## Tech Stack

### Frontend
- **Framework:** Next.js 16.1.0 (Turbopack)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

### Backend
- **Framework:** FastAPI (Python)
- **Server:** uvicorn
- **Deployment:** Fly.dev

### Database
- **Primary:** PostgreSQL (Fly.dev managed)
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
2. **Blog/RSS** - 16 feeds from major home/design magazines:
   - IKEA Hackers, Apartment Therapy, Architectural Digest, House Beautiful
   - Elle Decor, Dezeen, Bob Vila, Family Handyman, Young House Love
   - Curbly, Homedit, Design Milk, Hunker, Curbed, Remodelista, Country Living
3. **Pinterest** - Limited scope (user's own pins/boards only)

**Disabled:** Reddit (ToS), Instagram (ToS), TikTok (ToS)

## Key Files to Know

| File | Purpose |
|------|---------|
| `prox_autonomous_discovery/api/main.py` | FastAPI app entry point |
| `prox_autonomous_discovery/api/chat.py` | Chat endpoint with Claude |
| `prox_autonomous_discovery/collectors/scheduler.py` | Data collection orchestration |
| `prox_autonomous_discovery/collectors/blog_collector.py` | RSS feed collection (16 sources) |
| `prox_autonomous_discovery/dashboard/app.py` | Health dashboard at localhost:5555 |
| `prox-frontend-v2/app/page.tsx` | Homepage |
| `prox-frontend-v2/components/ChatInterface.tsx` | Main chat UI |
| `prox_autonomous_discovery/CHANGELOG.json` | Version history |

## Common Commands

```bash
# Navigate to project
cd ~/projects/prox-product-discovery

# Frontend development (fast on local SSD)
cd prox-frontend-v2
npm run dev                    # Starts at localhost:3000

# Backend development
cd prox_autonomous_discovery
source venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Health dashboard
cd prox_autonomous_discovery
./start_dashboard.sh           # Starts at localhost:5555

# Run data collection manually
cd prox_autonomous_discovery
python -m scripts.run_collection --platform youtube
python -m scripts.run_collection --platform blog

# Git workflow
git status
git add -A
git commit -m "Description"
git push origin main
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
- `collection_runs` - Data collection history

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

1. **Work in local directory:** `~/projects/prox-product-discovery/` (fast SSD)
2. **NOT iCloud:** `~/cloud-projects/...` is too slow for Next.js development
3. **Active frontend is `prox-frontend-v2`** (not `prox-frontend`)
4. **Changelog is at:** `prox_autonomous_discovery/CHANGELOG.json` - update it for significant changes
5. **Don't commit .env files** - they contain real API keys
6. **Reddit collector is disabled** - don't re-enable without ToS review
7. **Production API is on Fly.dev**, not Railway
8. **Always push changes** to GitHub after significant work sessions
