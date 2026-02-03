# Protected Layout & Component Rules
# DO NOT MODIFY these behaviors without explicit approval

## ProductCard.tsx
- Layout: HORIZONTAL — image on LEFT, product info on RIGHT
- Image field: Use product.image_url (primary) || product.image (fallback)
- NO fallback/placeholder images. If no valid image URL exists, do not render the card.
- No Unsplash URLs anywhere in this component

## ProductPreview.tsx (Context Panel)
- Filter out products without valid image URLs before rendering
- Badge count tracks only successfully loaded images

## SolveProblemPage.tsx (Panel Layout)
- Root container: min-h-screen flex flex-col (natural page flow)
- Panel container: lg:h-[65vh] with mt and mb margins
- Both panels: h-full overflow-y-auto (independent scrolling)
- Footer: ALWAYS visible on ALL pages — contains Affiliate Disclosure required by FTC
- Page header: "Improve a Space" / "Make a room work better for you"

## Field Mapping (API → Component)
- Backend returns: image_url, product_name, affiliate_url
- These are the canonical field names. Do not rename or remap.
- ProductCard accepts both formats for compatibility but image_url takes priority

## Search & Products
- Backend /search endpoint uses parameter: q (not query)
- Sorting: ORDER BY rating DESC, review_count DESC (never trend_score)

## Search Priority Order
1. `/search/vector?q={query}` — semantic vector search via Voyage AI (primary, best relevance)
2. `/search?q={term}` — keyword search with pipe-separated terms (fallback)
3. Canopy API — paid external search (last resort, only if < 4 products from above)

- DO NOT remove or reorder this fallback chain
- Embeddings use Voyage AI voyage-3-lite model (512 dimensions)
- New products must have embeddings generated before they'll appear in vector search
- Embedding generation script: `scripts/generate_embeddings.py`

## What NOT to do
- Do NOT add placeholder/fallback images (especially Unsplash velvet couches)
- Do NOT change horizontal card layout to vertical
- Do NOT remove overflow-y-auto from panels
- Do NOT hide footer on any page
- Do NOT revert field mapping to use product.image as primary
- Do NOT sort by trend_score (decommissioned)
- Do NOT use /api/category-products/{slug} endpoint (does not exist)

Last verified: 2026-02-03 (Canopy fallback implemented in app/api/chat/route.ts)
