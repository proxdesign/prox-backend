# Category Product Curation System

This document describes how the category-product matching system works in Prox, enabling precise product filtering with relevance scoring.

## Overview

The category curation system uses a `CategoryConfig` dataclass to define search criteria for each product category. This replaces the previous simple keyword-based matching with a more sophisticated approach that:

1. **Requires** products to match at least one primary term
2. **Excludes** products containing unwanted terms
3. **Boosts** relevance for products matching secondary terms

## Architecture

```
Category Slug ──▶ CategoryConfig ──▶ Enhanced Search Engine
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
    primary_terms  secondary_terms  exclusion_terms
    (REQUIRED)      (BOOST)         (FILTER OUT)
           │           │           │
           └───────────┴───────────┘
                       ▼
              Relevance-Scored Results
```

## Key Files

| File | Purpose |
|------|---------|
| `api/category_config.py` | CategoryConfig dataclass and all 28 category definitions |
| `api/category_products.py` | Search engine using CategoryConfig with SQL filtering |
| `scripts/backfill_categories.py` | Script to add curated products to categories |
| `tests/test_category_products.py` | E2E tests for category accuracy |

## CategoryConfig Structure

```python
@dataclass
class CategoryConfig:
    slug: str                    # URL-friendly identifier
    display_name: str            # Human-readable name
    primary_terms: List[str]     # At least one MUST match
    secondary_terms: List[str]   # Boost score if matched
    exclusion_terms: List[str]   # Filter out products containing these
```

### Example Configuration

```python
PICTURE_HANGER = CategoryConfig(
    slug="picture-hanger",
    display_name="Picture Hanging Accessories",
    primary_terms=["picture hanging", "picture hanger", "frame hanger", "art hanging",
                   "picture hanging kit", "frame hanging", "picture hook"],
    secondary_terms=["hardware", "kit", "wire", "hook", "nail"],
    exclusion_terms=["picture frame", "photo frame", "wall art", "canvas", "poster", "print",
                     "coat rack", "coat stand", "desk", "monitor", "shelf", "display frame",
                     "gallery frame", "collage frame"]
)
```

## Search Algorithm

The search algorithm in `api/category_products.py` works as follows:

1. **Primary Term Matching** (Required)
   ```sql
   WHERE (LOWER(product_name) LIKE '%picture hanging%'
      OR LOWER(product_name) LIKE '%picture hanger%'
      OR ...)
   ```

2. **Exclusion Filtering** (All must pass)
   ```sql
   AND LOWER(product_name) NOT LIKE '%picture frame%'
   AND LOWER(product_name) NOT LIKE '%coat rack%'
   AND ...
   ```

3. **Relevance Scoring** (Secondary terms)
   ```sql
   SELECT ...,
     (CASE WHEN LOWER(product_name) LIKE '%hardware%' THEN 1 ELSE 0 END +
      CASE WHEN LOWER(product_name) LIKE '%kit%' THEN 1 ELSE 0 END + ...)
     as relevance_score
   ORDER BY relevance_score DESC, rating DESC
   ```

## All 28 Categories

### Kitchen & Pantry
- `lazy-susan` - Lazy Susans
- `spice-rack` - Spice Racks
- `drawer-organizer-kitchen` - Drawer Organizers (Kitchen)
- `shelf-riser` - Shelf Risers
- `under-sink-kitchen` - Under-Sink Storage
- `container` - Can Organizers

### Closet & Storage
- `hanger` - Hangers
- `hanging-shelves` - Hanging Shelves
- `storage-bin` - Storage Bins
- `drawer-divider` - Drawer Dividers
- `over-door` - Over-Door Organizers
- `shelf-divider` - Shelf Dividers

### Bathroom
- `under-sink-bathroom` - Under-Sink Organizers
- `shower-caddy` - Shower Caddies
- `toothbrush-holder` - Toothbrush Holders
- `hair-tool` - Hair Tool Organizers

### Desk & Office
- `desk-organizer` - Desk Organizers
- `cable-management` - Cable Management
- `monitor-riser` - Monitor Risers
- `drawer-organizer-office` - Drawer Organizers (Office)

### Entryway & Hooks
- `key-hook` - Key Hooks
- `wall-hook` - Wall Hooks
- `shoe-rack` - Shoe Racks
- `coat-rack` - Coat Racks

### Hanging & Mounting
- `picture-hanger` - Picture Hanging Accessories
- `command-strip` - Command Strips
- `wall-hook-mounting` - Wall Hooks (Heavy Duty)
- `picture-frame` - Picture Frames

## Adding a New Category

1. **Define the CategoryConfig** in `api/category_config.py`:

```python
NEW_CATEGORY = CategoryConfig(
    slug="new-category",
    display_name="New Category Name",
    primary_terms=["required term 1", "required term 2"],
    secondary_terms=["boost term 1", "boost term 2"],
    exclusion_terms=["exclude this", "exclude that"]
)
```

2. **Register it** in the `CATEGORY_CONFIGS` dictionary:

```python
CATEGORY_CONFIGS = {
    # ... existing categories ...
    NEW_CATEGORY.slug: NEW_CATEGORY,
}
```

3. **Add test expectations** in `tests/test_category_products.py`:

```python
POSITIVE_EXPECTATIONS = {
    # ... existing ...
    "new-category": ["expected term 1", "expected term 2"],
}

NEGATIVE_EXPECTATIONS = {
    # ... existing ...
    "new-category": ["should not appear 1", "should not appear 2"],
}
```

4. **Run tests** to verify:

```bash
cd prox_autonomous_discovery
pytest tests/test_category_products.py -v
```

## Troubleshooting Contamination

If wrong products appear in a category:

### 1. Identify the Problem

```bash
curl "https://prox-autonomous-discovery.fly.dev/api/category-products/SLUG?limit=20" | jq '.products[].product_name'
```

### 2. Add Exclusion Terms

Edit the CategoryConfig in `api/category_config.py`:

```python
PROBLEM_CATEGORY = CategoryConfig(
    # ...
    exclusion_terms=[
        # Add specific terms that match the wrong products
        "wrong product type",
        "another wrong type",
    ]
)
```

### 3. Deploy and Verify

```bash
cd prox_autonomous_discovery
fly deploy
curl "https://prox-autonomous-discovery.fly.dev/api/category-products/SLUG?limit=20"
```

### 4. Update Tests

Add the new exclusion to `NEGATIVE_EXPECTATIONS` in the test file.

## Running E2E Tests

```bash
cd prox_autonomous_discovery
source venv/bin/activate
pytest tests/test_category_products.py -v
```

### Test Coverage

- `test_picture_hanger_excludes_wrong_products` - Verifies no coat racks or picture frames
- `test_under_sink_excludes_wrong_products` - Verifies no spice racks or sponge holders
- `test_category_returns_relevant_products` - Checks 30%+ products match expected terms
- `test_price_filter_works` - Verifies max_price parameter
- `test_all_categories_exist` - Confirms all 28 categories are recognized
- `test_invalid_category_returns_404` - Tests error handling
- `test_response_structure` - Validates API response format
- `test_minimum_product_counts` - Checks categories have enough products
- `test_picture_frame_excludes_hangers` - Verifies picture frames exclude hanging hardware
- `test_lazy_susan_excludes_electronics` - Verifies lazy susans exclude TV stands

## Backfilling Products

If a category needs more products:

### 1. Edit `scripts/backfill_categories.py`

Add products to the `PRODUCTS_BY_CATEGORY` dictionary:

```python
PRODUCTS_BY_CATEGORY = {
    "category-slug": [
        {
            "product_name": "Product Name",
            "brand": "Brand",
            "price": 19.99,
            "affiliate_url": "https://amazon.com/dp/...",
            "image_url": "https://...",
        },
        # ... more products
    ],
}
```

### 2. Run Locally or on Fly.dev

**Local:**
```bash
cd prox_autonomous_discovery
source venv/bin/activate
python scripts/backfill_categories.py
```

**Fly.dev:**
```bash
fly ssh console -C "/bin/sh -c 'cd /app && .venv/bin/python scripts/backfill_categories.py'"
```

### 3. Verify Product Counts

```bash
curl "https://prox-autonomous-discovery.fly.dev/api/category-products/SLUG" | jq '.product_count'
```

## Common Issues

### Over-Aggressive Exclusions

**Problem:** Valid products being excluded

**Example:** "Electric Toothbrush Holder" excluded by term "electric toothbrush"

**Solution:** Make exclusions more specific:
```python
# Bad - too broad
exclusion_terms=["electric toothbrush"]

# Good - target specific products
exclusion_terms=["oral-b", "philips sonicare", "replacement head"]
```

### SQL Parameter Ordering

The search query builds parameters in a specific order:
1. Relevance params (SELECT clause)
2. Primary params (WHERE clause)
3. Exclusion params (WHERE clause)
4. Price param (if provided)
5. Limit param

If parameters are out of order, queries will return wrong results or errors.

## API Endpoints

### Get Category Products
```
GET /api/category-products/{slug}?limit=50&max_price=30
```

Response:
```json
{
  "category": "lazy-susan",
  "display_name": "Lazy Susans",
  "primary_terms": ["lazy susan", "turntable organizer", ...],
  "product_count": 25,
  "products": [
    {
      "id": 123,
      "product_name": "Bamboo Lazy Susan",
      "price": 24.99,
      "image_url": "https://...",
      "affiliate_url": "https://...",
      "rating": 4.5,
      "relevance_score": 3
    }
  ]
}
```

### List All Categories
```
GET /api/category-products
```

Response:
```json
{
  "total_categories": 28,
  "categories": [
    {
      "slug": "lazy-susan",
      "display_name": "Lazy Susans",
      "primary_terms": [...],
      "secondary_terms": [...],
      "exclusion_count": 5
    }
  ]
}
```
