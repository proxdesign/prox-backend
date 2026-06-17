# Deprecated / archived API endpoints

**Removed from the live API on 2026-06-17.**

These three handlers were dead **discovery-pipeline-era** endpoints. They queried tables/columns that were dropped when the catalog moved to a products-only model (`solutions`, `problems`, `content_snippets`, `platform_posts`, `categories.display_order`), so each returned **HTTP 500** in production.

They were **not consumed by the Prox frontend**: the chat "what's trending" path calls `/search?sort_by=rating`, `/api/trending` uses the social trend aggregator (Pinterest etc.), and product retrieval uses `/search` + `/search/vector`. Removed rather than fixed. Preserved here for reference only.

## `GET /trending-products`

```python
@app.get("/trending-products", response_model=List[Product])
async def get_trending_products(
    category: Optional[str] = None,
    limit: int = 12,
    min_trend_score: float = 5.0
):
    """Get trending products across all categories."""
    try:
        # Check if category filtering by new category system
        if category and not category.lower() in ['living room', 'bedroom', 'kitchen', 'office', 'storage']:
            # Use new category system
            query = """
                SELECT p.id, p.solution_id, p.product_name, p.brand, p.price,
                       p.affiliate_url, p.image_url, p.rating, p.review_count,
                       p.trend_score, ap.partner_name
                FROM products p
                JOIN product_categories pc ON p.id = pc.product_id
                JOIN categories c ON pc.category_id = c.id
                JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
                WHERE p.active = TRUE AND p.trend_score >= %s 
                AND (c.name ILIKE %s OR c.name ILIKE %s)
            """
            params = [min_trend_score, f"%{category}%", f"%{category}%"]
        else:
            # Use legacy category system
            query = """
                SELECT p.id, p.solution_id, p.product_name, p.brand, p.price,
                       p.affiliate_url, p.image_url, p.rating, p.review_count,
                       p.trend_score, ap.partner_name
                FROM products p
                JOIN solutions s ON p.solution_id = s.id
                JOIN problems pr ON s.problem_id = pr.id
                JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
                WHERE p.active = TRUE AND pr.active = TRUE 
                AND p.trend_score >= %s
            """
            params = [min_trend_score]
            
            if category:
                query += " AND pr.problem_category = %s"
                params.append(category)
        
        query += " ORDER BY (CASE WHEN p.image_url LIKE '%%media-amazon%%' THEN 1 ELSE 2 END), p.rating DESC NULLS LAST, p.review_count DESC NULLS LAST LIMIT %s"
        params.append(limit)
        
        results = db.execute_query(query, params)
        
        products = []
        for row in results:
            products.append(Product(
                id=row['id'],
                solution_id=row['solution_id'],
                product_name=row['product_name'],
                brand=row['brand'],
                price=float(row['price']) if row['price'] else None,
                affiliate_url=row['affiliate_url'],
                image_url=row['image_url'],
                rating=float(row['rating']) if row['rating'] else None,
                review_count=row['review_count'],
                trend_score=float(row['trend_score']),
                partner_name=row['partner_name']
            ))
        
        return products
        
    except Exception as e:
        logger.error(f"Error fetching trending products: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending products")
```

## `GET /categories`

```python
@app.get("/categories")
async def get_categories():
    """Get available product categories with counts."""
    try:
        # Get main categories with product counts
        main_query = """
            SELECT c.id, c.name, c.description, COUNT(pc.product_id) as product_count
            FROM categories c
            LEFT JOIN product_categories pc ON c.id = pc.category_id
            WHERE c.parent_id IS NULL
            GROUP BY c.id, c.name, c.description
            ORDER BY c.display_order DESC
        """
        
        main_results = db.execute_query(main_query)
        
        categories = []
        for row in main_results:
            cat_id = row['id']
            name = row['name']
            description = row['description']
            count = row['product_count']
            
            # Get subcategories for this main category
            sub_query = """
                SELECT c.id, c.name, COUNT(pc.product_id) as product_count
                FROM categories c
                LEFT JOIN product_categories pc ON c.id = pc.category_id
                WHERE c.parent_id = %s
                GROUP BY c.id, c.name
                HAVING COUNT(pc.product_id) > 0
                ORDER BY c.display_order
            """
            
            sub_results = db.execute_query(sub_query, [cat_id])
            subcategories = [
                {
                    "id": sub_row['id'],
                    "name": sub_row['name'], 
                    "product_count": sub_row['product_count']
                } 
                for sub_row in sub_results
            ]
            
            categories.append({
                "id": cat_id,
                "name": name,
                "description": description,
                "product_count": count,
                "subcategories": subcategories
            })
        
        # Also include legacy problem categories for backward compatibility
        legacy_query = """
            SELECT problem_category, COUNT(DISTINCT p.id) as count, AVG(p.trend_score) as avg_score
            FROM problems pr
            JOIN solutions s ON pr.id = s.problem_id
            JOIN products p ON s.id = p.solution_id
            WHERE pr.active = TRUE AND p.active = TRUE
            GROUP BY problem_category
            ORDER BY avg_score DESC
        """
        
        legacy_results = db.execute_query(legacy_query)
        legacy_categories = [
            {
                "category": row['problem_category'],
                "count": row['count'],
                "avg_score": float(row['avg_score']) if row['avg_score'] else 0
            }
            for row in legacy_results
        ]
        
        return {
            "categories": categories,
            "legacy_categories": legacy_categories
        }
        
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch categories")
```

## `GET /stats`

```python
@app.get("/stats")
async def get_stats():
    """Get system statistics."""
    try:
        stats_query = """
            SELECT 
                (SELECT COUNT(*) FROM problems WHERE active = TRUE) as total_problems,
                (SELECT COUNT(*) FROM solutions) as total_solutions,
                (SELECT COUNT(*) FROM products WHERE active = TRUE) as total_products,
                (SELECT COUNT(*) FROM content_snippets WHERE approved = TRUE) as approved_content,
                (SELECT COUNT(*) FROM platform_posts) as total_posts
        """
        
        result = db.execute_query(stats_query)
        
        if result and len(result) > 0:
            stats = result[0]
            return {
                "total_problems": stats['total_problems'],
                "total_solutions": stats['total_solutions'],
                "total_products": stats['total_products'],
                "approved_content": stats['approved_content'],
                "total_posts": stats['total_posts'],
                "last_updated": datetime.now()
            }
        else:
            return {
                "total_problems": 0,
                "total_solutions": 0,
                "total_products": 0,
                "approved_content": 0,
                "total_posts": 0,
                "last_updated": datetime.now()
            }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")
```
