# Prox Autonomous Discovery

AI-powered conversational furniture discovery platform that runs 90% autonomously with 8 specialized agents.

## Overview

**What it does:**
- Discovers furniture buying problems from social media (Reddit, TikTok, Pinterest)
- Matches problems to solutions using AI analysis
- Recommends products via conversational interface
- Earns affiliate commissions on purchases
- Runs autonomously with minimal human oversight

**Tech Stack:**
- Backend: Python + FastAPI
- Database: PostgreSQL
- AI: Claude API (Anthropic)
- Data Collection: Reddit API, YouTube API, Apify scrapers
- Frontend: React (coming in Phase 6)

---

## Phase 1: Foundation Setup (You are here!)

### Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Active API keys (see .env.example)

### Installation Steps

**1. Create virtual environment:**
```bash
cd prox_autonomous_discovery
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**2. Install dependencies:**
```bash
pip install -r requirements.txt
```

**3. Configure environment:**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual API keys
nano .env  # or use your preferred editor
```

Required API keys:
- ✅ REDDIT_CLIENT_ID (you have this)
- ✅ REDDIT_CLIENT_SECRET (you have this)
- ✅ YOUTUBE_API_KEY (you have this)
- ✅ ANTHROPIC_API_KEY (you have this)
- ✅ APIFY_API_TOKEN (you have this)
- ⏳ AMAZON_ACCESS_KEY (get after Amazon Associates approval)
- ⏳ CJ_API_KEY (get after CJ Affiliate approval)

**4. Set up database:**
```bash
# Create PostgreSQL database
createdb prox_autonomous

# Update DATABASE_URL in .env with your credentials
# Example: postgresql://username:password@localhost:5432/prox_autonomous

# Run setup script
python scripts/setup_database.py
```

**5. Test collectors:**
```bash
# Test Reddit collector
python collectors/reddit_collector.py

# Check data was saved
psql prox_autonomous -c "SELECT COUNT(*) FROM platform_posts;"
```

---

## Directory Structure

```
prox_autonomous_discovery/
├── collectors/          # Data collection from social platforms
│   └── reddit_collector.py
├── database/           # Database schema and connection
│   ├── schema.sql
│   └── connection.py
├── agents/             # 8 autonomous agents (Phase 4)
├── analysis/           # AI analysis & trend detection (Phase 3)
├── api/               # FastAPI backend (Phase 5)
├── frontend/          # React app (Phase 6)
├── scripts/           # Setup and utility scripts
│   └── setup_database.py
└── config/            # Configuration settings
    └── settings.py
```

---

## Current Status

**✅ Completed:**
- Directory structure
- Database schema
- Configuration system
- Reddit collector
- Setup scripts

**⏳ Next Steps (Your Manual Work):**
- [ ] Copy API keys to .env
- [ ] Create PostgreSQL database
- [ ] Run setup_database.py
- [ ] Test Reddit collector
- [ ] Verify data in database

**🔜 Coming in Phase 2:**
- YouTube collector
- Apify scrapers (Instagram, TikTok, Pinterest)
- Automated daily collection

---

## Testing

**Test database connection:**
```bash
python -c "from database.connection import db; db.test_connection()"
```

**Test settings:**
```bash
python config/settings.py
```

**Test Reddit collection:**
```bash
python collectors/reddit_collector.py
```

---

## Troubleshooting

**"DATABASE_URL not found"**
- Copy .env.example to .env
- Fill in your PostgreSQL credentials

**"Connection refused"**
- Make sure PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:pass@localhost:5432/dbname`

**"Reddit API error"**
- Verify REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env
- Check credentials at reddit.com/prefs/apps

---

## Timeline

- **Phase 1** (Week 1): Foundation ← YOU ARE HERE
- **Phase 2** (Week 2): Data collection pipeline
- **Phase 3** (Week 3-4): AI analysis layer
- **Phase 4** (Week 4-5): Autonomous agents
- **Phase 5** (Week 5-6): Conversational API
- **Phase 6** (Week 7-8): Frontend web app
- **Phase 7** (Week 9): Testing & integration
- **Phase 8** (Week 10-12): Launch & scale

---

## Cost Estimate

**Monthly recurring:**
- Claude API: $150-250
- Apify: $49
- Hosting: $20
- Monitoring: $10
- **Total: $229-329/month**

**Break-even:** ~40-60 affiliate sales/month

---

## Support

Issues? Check:
1. All API keys in .env
2. PostgreSQL running
3. Database created
4. Virtual environment activated

Questions? Review implementation plan in project docs.
