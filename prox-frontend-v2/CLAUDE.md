# Prox Frontend - Claude Code Guidelines

⚠️ Before modifying any frontend components, API routes, page layouts, or search logic, read PROTECTED_LAYOUT.md for mandatory rules that must not be changed.

## Project Overview
This is a Next.js 16 application for AI-powered product discovery and recommendations.

## Key Technologies
- Next.js 16 with Turbopack
- React 19
- TypeScript
- Tailwind CSS
- Deployed on Vercel

## Backend API
- Primary: https://prox-autonomous-discovery.fly.dev
- Fallback: Canopy API (paid, use sparingly)

## Important Files
- `app/api/chat/route.ts` - Main AI chat endpoint
- `components/ProductCard.tsx` - Product display component
- `components/SolveProblemPage.tsx` - /solve page layout
- `PROTECTED_LAYOUT.md` - **READ THIS BEFORE MODIFYING LAYOUTS**

## Search Architecture
- Products have vector embeddings (pgvector + Voyage AI) for semantic search
- Database: Neon PostgreSQL (supports pgvector)
- When adding new products to the database, always generate embeddings using `scripts/generate_embeddings.py`
- VOYAGE_API_KEY is required in Fly.dev secrets for embedding generation
- Embedding model: voyage-3-lite (512 dimensions)
