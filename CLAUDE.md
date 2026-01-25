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
| `prox-frontend-v2/lib/productApi.ts` | Product search & affiliate API logic |
| `prox-frontend-v2/lib/auth.ts` | JWT authentication (requires JWT_SECRET env var) |
| `prox-frontend-v2/app/api/warmup/route.ts` | Category warmup endpoint |
| `prox-frontend-v2/components/QuickFixView.tsx` | Quick Fix categories (under $30) |
| `prox-frontend-v2/playwright.config.ts` | E2E test configuration |
| `prox-frontend-v2/e2e/` | Playwright E2E tests (30 tests across 5 spec files) |

## Affiliate API System

### Current Architecture
Products are fetched from affiliate APIs and cached for 1 hour. The system is designed to support multiple affiliate sources.

**Current Sources:**
- **Amazon (via Canopy API)** - Primary source, searches Amazon product catalog

**Planned Sources:**
- CJ Affiliates
- ShareASale
- Other affiliate networks

### Key Files for Affiliate Integration

| File | Purpose |
|------|---------|
| `lib/productApi.ts` | Main product search logic, affiliate source routing |
| `app/api/products/route.ts` | Product API endpoint |
| `app/api/warmup/route.ts` | Cache warmup for all categories |

### How Product Search Works

1. Search term comes in (e.g., "cable clips cord management")
2. `lib/productApi.ts` checks if it's a "generic category" term
3. If generic → goes directly to Canopy API (Amazon search)
4. If specific → tries backend first, falls back to Canopy
5. Results are cached for 1 hour

**Important:** The `GENERIC_CATEGORY_TERMS` array in `lib/productApi.ts` determines which searches go directly to Canopy. Quick Fix categories are included here to ensure correct product matching.

### Adding a New Affiliate API

When a new affiliate source (e.g., CJ Affiliates) is ready to implement:

#### Step 1: Create the API client
```typescript
// lib/cjApi.ts
export async function searchCJProducts(searchTerm: string, limit: number = 12): Promise<Product[]> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) return [];

  // Implement CJ API search
  // Return products in standard Product format
}
```

#### Step 2: Add to productApi.ts
```typescript
// In lib/productApi.ts, add import and integrate into search flow
import { searchCJProducts } from './cjApi';

// Option A: Search all sources and merge results
export async function searchProductsByKeyword(searchTerm: string): Promise<Product[]> {
  const [amazonProducts, cjProducts] = await Promise.all([
    searchProductsViaCanopy(searchTerm),
    searchCJProducts(searchTerm),
  ]);
  return mergeAndDedupeProducts([...amazonProducts, ...cjProducts]);
}

// Option B: Use CJ for specific categories only
// Add logic to route certain categories to CJ
```

#### Step 3: Enable in warmup system
```typescript
// In app/api/warmup/route.ts, uncomment and configure:
const AFFILIATE_SOURCES: AffiliateSource[] = [
  {
    name: 'amazon',
    enabled: true,
    warmupFn: async (searchTerm) => {
      const products = await searchProductsByKeyword(searchTerm);
      return products.length;
    },
  },
  {
    name: 'cj',
    enabled: true,  // Enable this
    warmupFn: async (searchTerm) => {
      const products = await searchCJProducts(searchTerm);
      return products.length;
    },
  },
];
```

#### Step 4: Add environment variable
```bash
# .env.local
CJ_API_KEY=your_cj_api_key
CJ_WEBSITE_ID=your_website_id
```

#### Step 5: Run warmup to populate cache
```bash
npm run warmup:local   # Test locally first
npm run warmup         # Production
```

### Category Warmup System

The warmup system pre-fetches products for all categories to ensure fast user experience.

**Endpoint:** `/api/warmup`

**Parameters:**
- `?type=quickfix` - Quick Fix categories only (12 categories, under $30)
- `?type=general` - General browse categories (8 categories)
- `?type=all` - All categories (default)
- `?source=amazon` - Specific affiliate source only

**Automation:**
- Vercel cron job runs every 6 hours (`vercel.json`)
- Manual trigger: `npm run warmup` or `npm run warmup:local`

**Quick Fix Categories** (defined in `QuickFixView.tsx` and `warmup/route.ts`):
- Lazy Susans, Spice Racks, Under Cabinet Hooks, Utensil Holders
- Wall Hooks, Coat Racks, Storage Bins, Under Sink
- Shelf Risers, Cable Clips, Drawer Organizers, Sink Caddies

### Warmup Commands

```bash
# Warmup all categories (production)
npm run warmup

# Warmup all categories (local dev)
npm run warmup:local

# Warmup Quick Fix only (production)
npm run warmup:quickfix

# Warmup Quick Fix only (local)
npm run warmup:quickfix:local

# Direct API call with curl
curl "https://proxdesign.co/api/warmup?type=quickfix"
```

## Common Commands

```bash
# Navigate to project
cd ~/projects/prox-product-discovery

# Frontend development (fast on local SSD)
cd prox-frontend-v2
npm run dev                    # Starts at localhost:3000

# E2E Testing (Playwright)
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Run with Playwright UI
npm run test:e2e:headed        # Run in headed browser mode

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
JWT_SECRET=<required, generate with: openssl rand -base64 32>
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

### Security Notes

9. **JWT_SECRET is required** - `lib/auth.ts` throws error if not set (no fallback)
10. **Dev-only pages:** `/test-solutions` and `/analytics` return 404 in production
11. **E2E tests verify affiliate compliance** - Run `npm run test:e2e` before deploying changes to legal pages or footer

### Affiliate API Guidelines

9. **Quick Fix searches use Canopy API directly** - Terms in `GENERIC_CATEGORY_TERMS` bypass backend
10. **When adding new affiliate APIs:**
    - Create API client in `lib/` (e.g., `lib/cjApi.ts`)
    - Integrate into `lib/productApi.ts` search flow
    - Enable in `app/api/warmup/route.ts` for cache warmup
    - Add API keys to `.env.local`
    - Run `npm run warmup` after setup
11. **Keep Quick Fix categories in sync** - Update in both:
    - `components/QuickFixView.tsx` (user-facing tiles)
    - `app/api/warmup/route.ts` (cache warmup)
12. **Test affiliate changes locally first** - Use `npm run warmup:local` before deploying
