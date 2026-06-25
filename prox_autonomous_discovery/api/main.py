"""FastAPI backend for Prox Autonomous Discovery."""
import logging
from datetime import datetime
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import anthropic
import voyageai
import os
from config.settings import settings
from database.connection import db
from services.auth_service import auth_service
from api.category_products import router as category_products_router

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Prox Autonomous Discovery API",
    description="AI-powered furniture and organization problem discovery API",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.proxdesign.co",
        "https://proxdesign.co", 
        settings.FRONTEND_URL, 
        "http://localhost:3000", 
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Claude client
claude = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

# Register category products router
app.include_router(category_products_router, prefix="/api", tags=["category-products"])

# Auth dependency
def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Extract user from JWT token in Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        token = authorization.split(" ")[1]
        return auth_service.verify_jwt_token(token)
    except Exception:
        return None

# Pydantic models for API responses
class Problem(BaseModel):
    id: int
    problem_text: str
    problem_category: str
    platform_mentions: int
    trend_score: float
    first_seen: datetime
    active: bool

class Solution(BaseModel):
    id: int
    problem_id: int
    solution_description: str
    solution_type: str
    effectiveness_score: float
    mention_count: int

class Product(BaseModel):
    id: int
    solution_id: int
    product_name: str
    brand: Optional[str]
    price: Optional[float]
    affiliate_url: str
    image_url: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    trend_score: float
    partner_name: str

class ContentSnippet(BaseModel):
    id: int
    product_id: int
    problem_id: int
    editorial_content: str
    why_trending: str
    user_quote: Optional[str]
    quality_score: Optional[float]

class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    recommendations: Optional[List[Product]] = None
    problems_identified: Optional[List[str]] = None
    session_id: Optional[str] = None

# Auth models
class MagicLinkRequest(BaseModel):
    email: str
    name: Optional[str] = None

class TokenVerifyRequest(BaseModel):
    token: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[Dict[str, Any]] = None
    token: Optional[str] = None

class UserModel(BaseModel):
    id: int
    email: str
    name: str
    created_at: Optional[str] = None
    preferences: Dict[str, Any] = {}


@app.get("/")
async def root():
    """API health check."""
    return {
        "message": "Prox Autonomous Discovery API",
        "status": "operational", 
        "version": "1.0.1-auth-enabled",
        "timestamp": datetime.now(),
        "auth_routes_count": len([r for r in app.routes if hasattr(r, 'path') and 'auth' in str(r.path)]),
        "total_routes_count": len([r for r in app.routes if hasattr(r, 'path')])
    }

@app.get("/health")
async def health_check():
    """Railway health check endpoint."""
    return {
        "status": "operational",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }


@app.get("/problems", response_model=List[Problem])
async def get_problems(
    category: Optional[str] = None,
    limit: int = 20,
    min_trend_score: float = 0.0
):
    """Get furniture and organization problems."""
    try:
        query = """
            SELECT id, problem_text, problem_category, platform_mentions, 
                   trend_score, first_seen, active
            FROM problems 
            WHERE active = TRUE AND trend_score >= %s
        """
        params = [min_trend_score]
        
        if category:
            query += " AND problem_category = %s"
            params.append(category)
        
        query += " ORDER BY trend_score DESC LIMIT %s"
        params.append(limit)
        
        results = db.execute_query(query, params)
        
        problems = []
        for row in results:
            problems.append(Problem(
                id=row['id'],
                problem_text=row['problem_text'],
                problem_category=row['problem_category'],
                platform_mentions=row['platform_mentions'],
                trend_score=float(row['trend_score']),
                first_seen=row['first_seen'],
                active=row['active']
            ))
        
        return problems
        
    except Exception as e:
        logger.error(f"Error fetching problems: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch problems")


@app.get("/problems/{problem_id}/solutions", response_model=List[Solution])
async def get_solutions(problem_id: int):
    """Get solutions for a specific problem."""
    try:
        query = """
            SELECT id, problem_id, solution_description, solution_type,
                   effectiveness_score, mention_count
            FROM solutions 
            WHERE problem_id = %s
            ORDER BY effectiveness_score DESC
        """
        
        results = db.execute_query(query, [problem_id])
        
        solutions = []
        for row in results:
            solutions.append(Solution(
                id=row['id'],
                problem_id=row['problem_id'],
                solution_description=row['solution_description'],
                solution_type=row['solution_type'],
                effectiveness_score=float(row['effectiveness_score']),
                mention_count=row['mention_count']
            ))
        
        return solutions
        
    except Exception as e:
        logger.error(f"Error fetching solutions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch solutions")


@app.get("/solutions/{solution_id}/products", response_model=List[Product])
async def get_products(solution_id: int):
    """Get products for a specific solution."""
    try:
        query = """
            SELECT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.solution_id = %s AND p.active = TRUE
            ORDER BY (CASE WHEN p.image_url LIKE '%%media-amazon%%' THEN 1 ELSE 2 END), p.rating DESC NULLS LAST, p.review_count DESC NULLS LAST
        """

        results = db.execute_query(query, [solution_id])
        
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
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")




@app.get("/categories/{category_id}/products", response_model=List[Product])
async def get_products_by_category(
    category_id: int,
    limit: int = 20,
    min_trend_score: float = 0.0
):
    """Get products in a specific category."""
    try:
        query = """
            SELECT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN product_categories pc ON p.id = pc.product_id
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE pc.category_id = %s AND p.active = TRUE AND p.trend_score >= %s
            ORDER BY (CASE WHEN p.image_url LIKE '%%media-amazon%%' THEN 1 ELSE 2 END), p.trend_score DESC
            LIMIT %s
        """
        
        results = db.execute_query(query, [category_id, min_trend_score, limit])
        
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
                trend_score=row['trend_score'],
                partner_name=row['partner_name']
            ))
        
        return products
        
    except Exception as e:
        logger.error(f"Error fetching products by category: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch products")


@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Enhanced conversational AI endpoint with improved product matching."""
    try:
        from ai.enhanced_chat import enhanced_chat_agent
        
        # Use enhanced chat agent with context and session
        result = enhanced_chat_agent.chat(
            message=message.message,
            context=message.context,
            session_id=message.session_id
        )
        
        # Convert product dictionaries to Product models and deduplicate
        recommendations = []
        seen_ids = set()
        for product_dict in result.get('recommendations', []):
            product_id = product_dict['id']
            if product_id not in seen_ids:
                seen_ids.add(product_id)
                recommendations.append(Product(
                    id=product_dict['id'],
                    solution_id=product_dict['solution_id'],
                    product_name=product_dict['product_name'],
                    brand=product_dict['brand'],
                    price=product_dict['price'],
                    affiliate_url=product_dict['affiliate_url'],
                    image_url=product_dict['image_url'],
                    rating=product_dict['rating'],
                    review_count=product_dict['review_count'],
                    trend_score=product_dict['trend_score'],
                    partner_name=product_dict['partner_name']
                ))
        
        # Return enhanced response with session ID
        return ChatResponse(
            response=result.get('response', ''),
            recommendations=recommendations,
            problems_identified=result.get('problems_identified', []),
            session_id=result.get('session_id')
        )
        
    except Exception as e:
        logger.error(f"Error in enhanced chat endpoint: {e}")
        # Fallback to basic response
        return ChatResponse(
            response="I'm here to help you find the perfect furniture solutions! Could you tell me more about what space you're working with and what challenges you're facing?",
            recommendations=[],
            problems_identified=[]
        )


@app.get("/search")
async def search_products(
    q: Optional[str] = Query(None, description="Search query"),
    categories: Optional[str] = Query(None, description="Comma-separated category names"),
    brands: Optional[str] = Query(None, description="Comma-separated brand names"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    min_rating: Optional[float] = Query(None, description="Minimum rating"),
    room_types: Optional[str] = Query(None, description="Comma-separated room types"),
    styles: Optional[str] = Query(None, description="Comma-separated style preferences"),
    materials: Optional[str] = Query(None, description="Comma-separated materials"),
    features: Optional[str] = Query(None, description="Comma-separated features"),
    sort_by: Optional[str] = Query("relevance", description="Sort option"),
    limit: Optional[int] = Query(20, description="Results per page"),
    offset: Optional[int] = Query(0, description="Results offset")
):
    """Advanced product search with multiple filters."""
    try:
        from api.search import search_engine, SearchFilters
        
        # Parse comma-separated lists
        filters = SearchFilters(
            query=q,
            categories=categories.split(',') if categories else None,
            brands=brands.split(',') if brands else None,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            room_types=room_types.split(',') if room_types else None,
            styles=styles.split(',') if styles else None,
            materials=materials.split(',') if materials else None,
            features=features.split(',') if features else None,
            sort_by=sort_by,
            limit=limit,
            offset=offset
        )
        
        result = search_engine.search_products(filters)
        return result
        
    except Exception as e:
        logger.error(f"Error in search endpoint: {e}")
        raise HTTPException(status_code=500, detail="Search failed")


@app.get("/search/filters")
async def get_filter_options():
    """Get available filter options for search UI."""
    try:
        from api.search import search_engine
        return search_engine.get_filter_options()
        
    except Exception as e:
        logger.error(f"Error fetching filter options: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch filter options")


@app.get("/search/suggestions")
async def get_search_suggestions(query: str = Query(..., description="Partial search query")):
    """Get search suggestions for autocomplete."""
    try:
        # Get product name suggestions
        suggestion_query = """
            SELECT DISTINCT p.product_name
            FROM products p
            WHERE p.active = TRUE AND p.product_name ILIKE %s
            ORDER BY p.trend_score DESC
            LIMIT 10
        """
        
        results = db.execute_query(suggestion_query, [f"%{query}%"])
        suggestions = [row['product_name'] for row in results]
        
        # Also get brand suggestions
        brand_query = """
            SELECT DISTINCT p.brand
            FROM products p
            WHERE p.active = TRUE AND p.brand ILIKE %s
            ORDER BY p.brand ASC
            LIMIT 5
        """
        
        brand_results = db.execute_query(brand_query, [f"%{query}%"])
        brand_suggestions = [f"Brand: {row['brand']}" for row in brand_results]
        
        # Combine suggestions
        all_suggestions = suggestions + brand_suggestions
        
        return {"suggestions": all_suggestions[:10]}
        
    except Exception as e:
        logger.error(f"Error fetching search suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch suggestions")


# Voyage client for embeddings
_voyage_client = None

def get_voyage_client():
    """Get or create Voyage client."""
    global _voyage_client
    if _voyage_client is None:
        api_key = os.getenv("VOYAGE_API_KEY")
        if api_key:
            _voyage_client = voyageai.Client(api_key=api_key)
    return _voyage_client


def get_query_embedding(query: str) -> Optional[List[float]]:
    """Generate embedding for a search query using Voyage."""
    client = get_voyage_client()
    if not client:
        return None
    try:
        result = client.embed([query], model="voyage-3-lite", input_type="query")
        return result.embeddings[0]
    except Exception as e:
        logger.error(f"Error generating query embedding: {e}")
        return None


@app.get("/search/vector")
async def vector_search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Maximum results"),
    threshold: float = Query(0.3, description="Minimum similarity score (0-1)"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price")
):
    """Vector similarity search using pgvector embeddings."""
    try:
        # Generate query embedding
        query_embedding = get_query_embedding(q)

        if not query_embedding:
            # Fallback to text search if embeddings unavailable
            logger.warning("Embeddings unavailable, falling back to text search")
            return await vector_search_fallback(q, limit)

        # Convert to string format for pgvector
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # Price bounds are applied IN the SQL (before the LIMIT) so the nearest
        # IN-BUDGET products are returned — not the nearest overall, which the
        # caller would then have to filter down to (often) zero. Additive: when
        # neither bound is passed the query is byte-identical to before. Products
        # with a NULL price are kept (the caller decides how to treat unpriced
        # rows), matching the frontend filterByPrice contract.
        price_clause = ""
        price_params = []
        if max_price is not None:
            price_clause += " AND (p.price IS NULL OR p.price <= %s)"
            price_params.append(max_price)
        if min_price is not None:
            price_clause += " AND (p.price IS NULL OR p.price >= %s)"
            price_params.append(min_price)

        # Vector similarity search using cosine distance
        # pgvector uses <=> for cosine distance (lower = more similar)
        # Convert to similarity score: 1 - distance
        query = f"""
            SELECT
                p.id, p.product_name, p.brand, p.price,
                p.affiliate_url, p.image_url, p.rating, p.review_count,
                1 - (p.embedding <=> %s::vector) as similarity_score
            FROM products p
            WHERE p.active = TRUE
              AND p.embedding IS NOT NULL
              AND 1 - (p.embedding <=> %s::vector) >= %s
              {price_clause}
            ORDER BY p.embedding <=> %s::vector
            LIMIT %s
        """

        results = db.execute_query(query, [
            embedding_str, embedding_str, threshold, *price_params, embedding_str, limit
        ])

        products = []
        for row in results:
            products.append({
                'id': row['id'],
                'product_name': row['product_name'],
                'brand': row['brand'],
                'price': float(row['price']) if row['price'] else None,
                'affiliate_url': row['affiliate_url'],
                'image_url': row['image_url'],
                'rating': float(row['rating']) if row['rating'] else None,
                'review_count': row['review_count'],
                'similarity_score': float(row['similarity_score'])
            })

        return {
            'query': q,
            'total_found': len(products),
            'products': products,
            'search_type': 'vector'
        }

    except Exception as e:
        logger.error(f"Error in vector search: {e}")
        raise HTTPException(status_code=500, detail="Vector search failed")


async def vector_search_fallback(q: str, limit: int):
    """Fallback text search when vector search is unavailable."""
    query = """
        SELECT
            p.id, p.product_name, p.brand, p.price,
            p.affiliate_url, p.image_url, p.rating, p.review_count
        FROM products p
        WHERE p.active = TRUE AND p.product_name ILIKE %s
        ORDER BY p.rating DESC NULLS LAST
        LIMIT %s
    """

    results = db.execute_query(query, [f"%{q}%", limit])

    products = []
    for row in results:
        products.append({
            'id': row['id'],
            'product_name': row['product_name'],
            'brand': row['brand'],
            'price': float(row['price']) if row['price'] else None,
            'affiliate_url': row['affiliate_url'],
            'image_url': row['image_url'],
            'rating': float(row['rating']) if row['rating'] else None,
            'review_count': row['review_count'],
            'similarity_score': None
        })

    return {
        'query': q,
        'total_found': len(products),
        'products': products,
        'search_type': 'text_fallback'
    }


@app.post("/search/semantic")
async def semantic_search(request: Dict[str, str]):
    """AI-powered semantic search that understands natural language queries."""
    try:
        from ai.semantic_search import semantic_search_engine
        
        query = request.get('query', '')
        limit = request.get('limit', 20)
        
        if not query:
            raise HTTPException(status_code=400, detail="Query is required")
        
        result = semantic_search_engine.semantic_search(query, limit)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail="Semantic search failed")


@app.get("/search/semantic/{query}")
async def semantic_search_get(
    query: str,
    limit: Optional[int] = Query(20, description="Maximum results to return")
):
    """AI-powered semantic search via GET request."""
    try:
        from ai.semantic_search import semantic_search_engine
        
        result = semantic_search_engine.semantic_search(query, limit)
        return result
        
    except Exception as e:
        logger.error(f"Error in semantic search GET: {e}")
        raise HTTPException(status_code=500, detail="Semantic search failed")


@app.post("/search/save")
async def save_search(request: Dict):
    """Save a search configuration for later use."""
    try:
        from api.saved_searches import saved_search_manager, SavedSearch
        
        # Ensure saved searches table exists
        saved_search_manager.create_saved_searches_table()
        
        # Create SavedSearch object
        saved_search = SavedSearch(
            name=request.get('name', 'Untitled Search'),
            query=request.get('query'),
            filters=request.get('filters', {}),
            user_id=request.get('user_id'),
            session_id=request.get('session_id'),
            is_public=request.get('is_public', False)
        )
        
        search_id = saved_search_manager.save_search(saved_search)
        
        return {
            "success": True,
            "search_id": search_id,
            "message": f"Search '{saved_search.name}' saved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error saving search: {e}")
        raise HTTPException(status_code=500, detail="Failed to save search")


@app.get("/search/saved")
async def get_saved_searches(
    user_id: Optional[str] = Query(None, description="User ID"),
    session_id: Optional[str] = Query(None, description="Session ID"),
    include_public: Optional[bool] = Query(True, description="Include public searches")
):
    """Get saved searches for a user or session."""
    try:
        from api.saved_searches import saved_search_manager
        
        searches = saved_search_manager.get_saved_searches(user_id, session_id, include_public)
        return {"saved_searches": searches}
        
    except Exception as e:
        logger.error(f"Error getting saved searches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get saved searches")


@app.get("/search/saved/{search_id}")
async def use_saved_search(search_id: int):
    """Use a saved search and get its filters."""
    try:
        from api.saved_searches import saved_search_manager
        
        saved_search = saved_search_manager.use_saved_search(search_id)
        if not saved_search:
            raise HTTPException(status_code=404, detail="Saved search not found")
        
        return {
            "saved_search": saved_search,
            "message": f"Loaded search '{saved_search.name}'"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error using saved search: {e}")
        raise HTTPException(status_code=500, detail="Failed to load saved search")


@app.delete("/search/saved/{search_id}")
async def delete_saved_search(
    search_id: int,
    user_id: Optional[str] = Query(None, description="User ID for ownership verification"),
    session_id: Optional[str] = Query(None, description="Session ID for ownership verification")
):
    """Delete a saved search."""
    try:
        from api.saved_searches import saved_search_manager
        
        success = saved_search_manager.delete_saved_search(search_id, user_id, session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Saved search not found or access denied")
        
        return {"success": True, "message": "Search deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting saved search: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete search")


@app.get("/search/presets")
async def get_filter_presets():
    """Get popular filter presets and combinations."""
    try:
        from api.saved_searches import saved_search_manager
        
        presets = saved_search_manager.get_popular_presets()
        return {"presets": presets}
        
    except Exception as e:
        logger.error(f"Error getting filter presets: {e}")
        raise HTTPException(status_code=500, detail="Failed to get presets")


@app.get("/search/suggestions/filters")
async def get_filter_suggestions(query: str = Query(..., description="Search query to base suggestions on")):
    """Get filter suggestions based on a search query."""
    try:
        from api.saved_searches import saved_search_manager
        
        suggestions = saved_search_manager.suggest_filters_based_on_query(query)
        return {"suggestions": suggestions}
        
    except Exception as e:
        logger.error(f"Error getting filter suggestions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get suggestions")


@app.get("/search/analytics")
async def get_search_analytics():
    """Get analytics about search patterns and saved searches."""
    try:
        from api.saved_searches import saved_search_manager
        
        analytics = saved_search_manager.get_search_analytics()
        return analytics
        
    except Exception as e:
        logger.error(f"Error getting search analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")




@app.post("/amazon/update-products")
async def update_amazon_products(
    background_tasks: BackgroundTasks,
    max_products: int = Query(50, description="Maximum number of products to update")
):
    """Update products with real Amazon Product Advertising API data."""
    try:
        from services.amazon_data_updater import update_amazon_data
        
        logger.info(f"Starting Amazon product data update for {max_products} products")
        
        # Run the update process
        result = await update_amazon_data(max_products)
        
        return {
            "success": True,
            "message": f"Amazon product update initiated",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error updating Amazon products: {e}")
        raise HTTPException(status_code=500, detail="Failed to update Amazon products")


@app.put("/amazon/update-product/{product_id}")
async def update_single_amazon_product(product_id: int):
    """Update a single product with Amazon data."""
    try:
        from services.amazon_data_updater import update_single_product_amazon_data
        
        logger.info(f"Starting Amazon data update for product {product_id}")
        
        result = await update_single_product_amazon_data(product_id)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update product {product_id}")


@app.get("/amazon/status")
async def get_amazon_update_status():
    """Get status of Amazon data updates."""
    try:
        from services.amazon_data_updater import get_amazon_update_status
        
        status = await get_amazon_update_status()
        
        if not status['success']:
            raise HTTPException(status_code=500, detail=status.get('message', 'Failed to get status'))
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Amazon update status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get Amazon update status")


@app.get("/amazon/credentials")
async def check_amazon_credentials():
    """Check if Amazon API credentials are configured."""
    try:
        from services.amazon_api import amazon_api
        
        has_credentials = bool(amazon_api.access_key and amazon_api.secret_key)
        
        return {
            "credentials_configured": has_credentials,
            "partner_tag": amazon_api.partner_tag,
            "region": amazon_api.region,
            "endpoint": amazon_api.endpoint if has_credentials else None,
            "fallback_mode": not has_credentials
        }
        
    except Exception as e:
        logger.error(f"Error checking Amazon credentials: {e}")
        raise HTTPException(status_code=500, detail="Failed to check credentials")


# Authentication endpoints
@app.post("/auth/request-magic-link", response_model=AuthResponse)
async def request_magic_link(request: MagicLinkRequest):
    """Request a magic link for passwordless authentication."""
    try:
        result = auth_service.create_magic_link(request.email, request.name)
        
        return AuthResponse(
            success=result["success"],
            message=result["message"]
        )
        
    except Exception as e:
        logger.error(f"Error requesting magic link: {e}")
        raise HTTPException(status_code=500, detail="Failed to send magic link")


@app.get("/auth/verify")
async def verify_magic_link(token: str = Query(..., description="Magic link token")):
    """Verify magic link token and redirect to frontend with JWT."""
    try:
        result = auth_service.verify_magic_link(token)
        
        if result["success"]:
            # Redirect to frontend with JWT token
            frontend_url = auth_service.app_url
            redirect_url = f"{frontend_url}?token={result['token']}"
            return RedirectResponse(url=redirect_url)
        else:
            # Redirect to frontend with error
            frontend_url = auth_service.app_url
            redirect_url = f"{frontend_url}?auth_error={result['message']}"
            return RedirectResponse(url=redirect_url)
            
    except Exception as e:
        logger.error(f"Error verifying magic link: {e}")
        frontend_url = auth_service.app_url
        redirect_url = f"{frontend_url}?auth_error=Verification failed"
        return RedirectResponse(url=redirect_url)


@app.post("/auth/verify-token", response_model=AuthResponse)
async def verify_token(request: TokenVerifyRequest):
    """Verify JWT token and return user data."""
    token = request.token
    try:
        user = auth_service.verify_jwt_token(token)
        
        if user:
            return AuthResponse(
                success=True,
                message="Token verified",
                user=user,
                token=token
            )
        else:
            return AuthResponse(
                success=False,
                message="Invalid or expired token"
            )
            
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


@app.post("/auth/me", response_model=UserModel)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user information."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return UserModel(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        preferences=current_user.get("preferences", {})
    )


@app.post("/auth/logout")
async def logout():
    """Logout endpoint (client-side token removal)."""
    return {"success": True, "message": "Logged out successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)