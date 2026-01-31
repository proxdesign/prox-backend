# Prox Product Discovery

## Quick Reference

| Resource | URL |
|----------|-----|
| Live Site | https://proxdesign.co |
| API | https://prox-autonomous-discovery.fly.dev |
| GitHub | https://github.com/proxdesign/prox-backend |

**What is Prox?** AI-powered furniture discovery platform. Conversational AI helps users find products. Collects trend data from social media, analyzes with Claude, provides personalized recommendations.

---

## Lessons Learned

> Update this section when you learn something important. Consolidate periodically.

### Conversational AI (2026-01-30)

- **Progressive disclosure > interrogation pattern** — Show products alongside questions, not after all questions answered
- **6 turns = 47-61% abandonment** — Each turn adds 10-15% abandonment (Baymard Institute)
- **1 turn with products = 94% test pass rate** — Down from 6 turns (85% pass rate)
- **Direct product detection matters** — When user types "spice rack", show products immediately, don't ask clarifying questions
- **Test scripts must check `.products` AND `.solutions`** — Progressive disclosure puts products in `.products` array

### Category Curation (2026-01)

- **Exclusion terms matter more than inclusion terms** — "hooks" contaminated closet results until excluded
- **Test with real searches** — Category config looks right but may return wrong products
- **Backend CategoryConfig > frontend filtering** — Do filtering at API level, not client

### Development Workflow

- **iCloud is too slow for Next.js** — Work in `~/projects/`, not `~/cloud-projects/`
- **Always copy files both directions** — Local edits need to sync to iCloud for git
- **Dev server caches aggressively** — Restart after route.ts changes if behavior seems stale

---

## Known Issues / Tech Debt

> Track issues here. Check off when resolved.

- [ ] LLM-INF-03 test flaky — Claude sometimes mentions "budget" in natural response, causing false fail
- [ ] Gift flow products not category-aware — Shows generic gifts, not refined by recipient interests
- [ ] No A/B testing infrastructure — Can't measure actual abandonment rates
- [ ] Product allocation incomplete — 270 products vs 2,552 target

---

## Current State

### What's Working Well
- Progressive disclosure in Solve/Gift flows (94% test pass rate)
- Direct product name detection ("spice rack" → products)
- Mid-conversation category refinement
- Churn test automation

### Active Priorities
1. Monitor production for progressive disclosure issues
2. Add more affiliate sources (CJ, ShareASale)
3. Improve gift flow category awareness

---

## Project Structure

```
~/projects/prox-product-discovery/          # LOCAL - Fast development
├── prox_autonomous_discovery/              # Python backend (FastAPI)
│   ├── api/                                # Endpoints
│   ├── collectors/                         # YouTube, Blogs, Pinterest
│   ├── CHANGELOG.json                      # Version history
│   └── .env                                # Backend secrets
├── prox-frontend-v2/                       # Next.js frontend (ACTIVE)
│   ├── app/api/chat/route.ts               # Chat API (progressive disclosure here)
│   ├── components/ChatInterface.tsx        # Main chat UI
│   ├── lib/productApi.ts                   # Affiliate API logic
│   └── .env.local                          # Frontend secrets
├── website-tests/                          # Test framework
│   ├── scripts/run-churn-tests.sh          # Automated churn tests
│   ├── plans/                              # Test plans
│   └── results/YYYY-MM-DD/                 # Results by date
└── prox.md                                 # This file
```

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | Next.js 16.1.0, Tailwind | Deployed on Vercel |
| Backend | FastAPI, Python | Deployed on Fly.dev |
| Database | PostgreSQL | Fly.dev managed |
| AI | Claude claude-3-5-haiku | Chat, analysis |
| Products | Canopy API (Amazon) | 1hr cache |

---

## Key Files

| File | What it does |
|------|--------------|
| `prox-frontend-v2/app/api/chat/route.ts` | Chat API, progressive disclosure, product detection |
| `prox-frontend-v2/lib/productApi.ts` | Affiliate search, Canopy integration |
| `prox-frontend-v2/components/ChatInterface.tsx` | Chat UI |
| `prox_autonomous_discovery/api/category_config.py` | 28 category definitions |
| `website-tests/scripts/run-churn-tests.sh` | Churn test automation |

---

## Common Commands

```bash
# Development
cd ~/projects/prox-product-discovery/prox-frontend-v2
npm run dev                              # localhost:3000

# Testing
./website-tests/scripts/run-churn-tests.sh   # Churn analysis
npm run test:e2e                             # Playwright E2E

# Backend
cd prox_autonomous_discovery
source venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Deploy
git push origin main                     # Auto-deploys frontend to Vercel
cd prox_autonomous_discovery && fly deploy   # Backend to Fly.dev
```

---

## Churn Analysis Framework

### Test Categories

| Code | Tests |
|------|-------|
| `FLOW-*` | Time-to-value, turns to products |
| `LLM-*` | Question quality, inference, escape hatches |
| `DATA-*` | Context retention |
| `UI-*` | Loading states, error handling |

### Current Results (2026-01-30)

| Test | Status | Notes |
|------|--------|-------|
| FLOW-TTV-01 (Solve) | PASS | 1 turn (was 6) |
| FLOW-TTV-03 (Gift) | PASS | 1 turn (was 6) |
| LLM-ESC-03 (Direct search) | PASS | "spice rack" works |
| Overall | 94% | 16 pass, 1 fail |

### References
- Baymard Institute: 10-15% abandonment per turn
- Google Conversation Design: Progressive disclosure
- Voiceflow: ≤3 turns for simple tasks

---

## Affiliate System

### Current: Amazon via Canopy API

Products cached 1 hour. `GENERIC_CATEGORY_TERMS` in `lib/productApi.ts` routes directly to Canopy.

### Adding New Affiliate

1. Create `lib/{partner}Api.ts`
2. Add to `lib/productApi.ts` search flow
3. Enable in `app/api/warmup/route.ts`
4. Add env vars
5. Run `npm run warmup`

---

## Environment Variables

### Frontend (.env.local)
```
ANTHROPIC_API_KEY=sk-ant-...
CANOPY_API_KEY=...
AMAZON_ASSOCIATE_TAG=proxdesign20-20
JWT_SECRET=<generate: openssl rand -base64 32>
```

### Backend (.env)
```
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
YOUTUBE_API_KEY=AIza...
```

---

## Rules for Claude Code

1. **Work locally** — `~/projects/prox-product-discovery/` not iCloud
2. **Active frontend** — `prox-frontend-v2` (not `prox-frontend`)
3. **Update CHANGELOG.json** — For significant changes
4. **Don't commit .env** — Contains real keys
5. **Push after work sessions** — Backup to GitHub
6. **Run tests before deploy** — `npm run test:e2e`
7. **Update this file** — Add lessons learned, check off resolved issues

---

## Data Collection

Active collectors (every 6 hours):
- **YouTube** — 14 search queries
- **Blog/RSS** — 16 feeds (IKEA Hackers, Apartment Therapy, etc.)
- **Pinterest** — Limited (user's own pins only)

Disabled: Reddit, Instagram, TikTok (ToS issues)

---

## Database Quick Reference

```sql
-- Check product allocation
SELECT * FROM product_allocation_summary;

-- Products by source
SELECT * FROM products_by_source;

-- Affiliate partners
SELECT partner_name, status FROM affiliate_partners;
```

Key tables: `users`, `products`, `problems`, `solutions`, `platform_posts`

---

*Last updated: 2026-01-30 — Progressive disclosure implementation*
