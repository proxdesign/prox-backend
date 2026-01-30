"""Category-based product retrieval with semantic search term mapping.

Uses CategoryConfig for precise matching with:
- primary_terms: At least one MUST match (required)
- secondary_terms: Boost relevance score
- exclusion_terms: Filter out unwanted products
"""

import logging
from typing import List, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from database.connection import db
from api.category_config import CATEGORY_CONFIGS, CategoryConfig, get_category_config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


def search_with_config(config: CategoryConfig, limit: int, max_price: Optional[float]) -> List[Dict]:
    """
    Search products using CategoryConfig with proper filtering.

    Algorithm:
    1. Product must match at least ONE primary_term (required)
    2. Product is excluded if it matches ANY exclusion_term
    3. Products are ranked by: secondary_term matches + rating
    """
    try:
        # Build params in the same order as they appear in the query
        # ORDER: relevance (SELECT) -> primary (WHERE) -> exclusion (WHERE) -> price -> limit

        # Build RELEVANCE scoring based on secondary terms (goes in SELECT clause FIRST)
        relevance_params = []
        relevance_cases = []
        for term in config.secondary_terms:
            relevance_cases.append(f"CASE WHEN LOWER(p.product_name) LIKE %s THEN 1 ELSE 0 END")
            relevance_params.append(f"%{term.lower()}%")

        relevance_score = " + ".join(relevance_cases) if relevance_cases else "0"

        # Build PRIMARY term conditions (at least one must match)
        primary_params = []
        primary_conditions = []
        for term in config.primary_terms:
            primary_conditions.append("LOWER(p.product_name) LIKE %s")
            primary_params.append(f"%{term.lower()}%")

        primary_clause = " OR ".join(primary_conditions)

        # Build EXCLUSION conditions (none should match)
        exclusion_params = []
        exclusion_conditions = []
        for term in config.exclusion_terms:
            exclusion_conditions.append("LOWER(p.product_name) NOT LIKE %s")
            exclusion_params.append(f"%{term.lower()}%")

        exclusion_clause = " AND ".join(exclusion_conditions) if exclusion_conditions else "TRUE"

        # Combine params in query order: relevance -> primary -> exclusion
        params = relevance_params + primary_params + exclusion_params

        # Build the query
        query = f"""
            SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name,
                   ({relevance_score}) as relevance_score,
                   CASE WHEN p.image_url LIKE '%%media-amazon%%' THEN 1 ELSE 2 END AS image_priority
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.active = TRUE
              AND ({primary_clause})
              AND ({exclusion_clause})
        """

        # Add price filter
        if max_price is not None:
            query += " AND p.price <= %s AND p.price > 0"
            params.append(max_price)

        # Order by relevance, then rating, then image quality
        query += " ORDER BY relevance_score DESC, p.rating DESC NULLS LAST, image_priority, p.trend_score DESC LIMIT %s"
        params.append(limit)

        results = db.execute_query(query, params)

        products = []
        for row in results:
            products.append({
                'id': row['id'],
                'solution_id': row['solution_id'],
                'product_name': row['product_name'],
                'brand': row['brand'],
                'price': float(row['price']) if row['price'] else None,
                'affiliate_url': row['affiliate_url'],
                'image_url': row['image_url'],
                'rating': float(row['rating']) if row['rating'] else None,
                'review_count': row['review_count'],
                'trend_score': float(row['trend_score']) if row['trend_score'] else 0,
                'partner_name': row['partner_name'],
                'relevance_score': row['relevance_score'] if 'relevance_score' in row else 0
            })

        return products

    except Exception as e:
        logger.error(f"Error searching with config: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.get("/category-products/{slug}")
async def get_category_products(
    slug: str,
    limit: int = Query(50, description="Maximum number of products to return"),
    max_price: Optional[float] = Query(None, description="Maximum price filter")
):
    """
    Get products for a specific category using CategoryConfig matching.

    Uses primary_terms for required matching, exclusion_terms for filtering,
    and secondary_terms for relevance boosting.
    """

    config = get_category_config(slug)

    if config is None:
        # Try to find a partial match
        matching_slugs = [s for s in CATEGORY_CONFIGS.keys() if slug in s or s in slug]
        if matching_slugs:
            config = CATEGORY_CONFIGS[matching_slugs[0]]
            slug = config.slug
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Category '{slug}' not found. Available categories: {list(CATEGORY_CONFIGS.keys())}"
            )

    logger.info(f"Searching for category '{slug}' with config: primary={config.primary_terms[:2]}, exclusions={len(config.exclusion_terms)}")

    # Search using the new config-based approach
    products = search_with_config(config, limit, max_price)

    logger.info(f"Found {len(products)} products for category '{slug}'")

    # Deduplicate by product ID
    seen = set()
    unique_products = []
    for p in products:
        if p.get('id') not in seen:
            seen.add(p.get('id'))
            unique_products.append(p)

    return {
        "category": slug,
        "display_name": config.display_name,
        "primary_terms": config.primary_terms,
        "product_count": len(unique_products),
        "products": unique_products[:limit]
    }


@router.get("/category-products")
async def list_available_categories():
    """List all available category slugs and their configurations."""

    categories = []
    for slug, config in CATEGORY_CONFIGS.items():
        categories.append({
            "slug": slug,
            "display_name": config.display_name,
            "primary_terms": config.primary_terms,
            "secondary_terms": config.secondary_terms,
            "exclusion_count": len(config.exclusion_terms)
        })

    return {
        "total_categories": len(categories),
        "categories": categories
    }
