#!/usr/bin/env python3
"""Advanced search and filtering API endpoints."""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from fastapi import HTTPException, Query
from pydantic import BaseModel
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SearchFilters(BaseModel):
    """Search and filter parameters."""
    query: Optional[str] = None
    categories: Optional[List[str]] = None
    brands: Optional[List[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    room_types: Optional[List[str]] = None
    styles: Optional[List[str]] = None
    materials: Optional[List[str]] = None
    features: Optional[List[str]] = None
    sort_by: Optional[str] = "relevance"  # relevance, price_asc, price_desc, rating, trending
    limit: Optional[int] = 20
    offset: Optional[int] = 0

class SearchResult(BaseModel):
    """Search result with metadata."""
    total_count: int
    filtered_count: int
    page_count: int
    current_page: int
    filters_applied: Dict
    products: List[Dict]
    search_suggestions: Optional[List[str]] = None
    related_categories: Optional[List[str]] = None

class AdvancedSearchEngine:
    """Advanced product search with multiple filtering options."""
    
    def __init__(self):
        self.sort_options = {
            'relevance': 'p.trend_score DESC, p.rating DESC',
            'price_asc': 'p.price ASC',
            'price_desc': 'p.price DESC', 
            'rating': 'p.rating DESC, p.review_count DESC',
            'trending': 'p.trend_score DESC',
            'alphabetical': 'p.product_name ASC',
            'newest': 'p.created_at DESC'
        }
        
        self.room_category_mapping = {
            'bedroom': ['Bedroom Furniture', 'Storage & Organization'],
            'living_room': ['Living Room', 'Storage & Organization'],
            'office': ['Home Office', 'Storage & Organization'],
            'kitchen': ['Kitchen & Dining', 'Storage & Organization'],
            'bathroom': ['Bathroom', 'Storage & Organization'],
            'dining_room': ['Kitchen & Dining', 'Living Room'],
            'studio_apartment': ['Storage & Organization', 'Living Room', 'Bedroom Furniture'],
            'outdoor': ['Outdoor & Patio']
        }
    
    def search_products(self, filters: SearchFilters) -> SearchResult:
        """Execute advanced product search with filters."""
        
        # Build the base query
        base_query, base_params = self._build_base_query(filters)
        
        # Get total count (before filtering)
        total_count = self._get_total_count()
        
        # Get filtered count
        count_query = base_query.replace('SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price, p.affiliate_url, p.image_url, p.rating, p.review_count, p.trend_score, ap.partner_name', 'SELECT COUNT(DISTINCT p.id)')
        count_query = count_query.split('ORDER BY')[0]  # Remove ORDER BY for count
        filtered_count = db.fetch_one(count_query, base_params)[0]
        
        # Add sorting and pagination
        sort_clause = self.sort_options.get(filters.sort_by, self.sort_options['relevance'])
        paginated_query = f"{base_query} ORDER BY {sort_clause} LIMIT %s OFFSET %s"
        final_params = base_params + [filters.limit, filters.offset]
        
        # Execute search
        results = db.fetch_all(paginated_query, final_params)
        
        # Format products
        products = []
        for row in results:
            products.append({
                'id': row[0],
                'solution_id': row[1],
                'product_name': row[2],
                'brand': row[3],
                'price': float(row[4]) if row[4] else None,
                'affiliate_url': row[5],
                'image_url': row[6],
                'rating': float(row[7]) if row[7] else None,
                'review_count': row[8],
                'trend_score': float(row[9]),
                'partner_name': row[10]
            })
        
        # Calculate pagination
        page_count = (filtered_count + filters.limit - 1) // filters.limit
        current_page = (filters.offset // filters.limit) + 1
        
        # Generate suggestions and related categories
        suggestions = self._generate_search_suggestions(filters)
        related_categories = self._get_related_categories(filters)
        
        return SearchResult(
            total_count=total_count,
            filtered_count=filtered_count,
            page_count=page_count,
            current_page=current_page,
            filters_applied=self._get_applied_filters(filters),
            products=products,
            search_suggestions=suggestions,
            related_categories=related_categories
        )
    
    def _build_base_query(self, filters: SearchFilters) -> Tuple[str, List]:
        """Build the base SQL query with all filters."""
        
        # Start with base query
        query = """
            SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN product_attributes pa_style ON p.id = pa_style.product_id AND pa_style.attribute_type = 'style'
            LEFT JOIN product_attributes pa_material ON p.id = pa_material.product_id AND pa_material.attribute_type = 'material'
            WHERE p.active = TRUE
        """
        
        params = []
        
        # Text search filter
        if filters.query:
            query += " AND (p.product_name ILIKE %s OR p.brand ILIKE %s OR c.name ILIKE %s)"
            search_term = f"%{filters.query}%"
            params.extend([search_term, search_term, search_term])
        
        # Category filters
        if filters.categories:
            placeholders = ','.join(['%s'] * len(filters.categories))
            query += f" AND c.name IN ({placeholders})"
            params.extend(filters.categories)
        
        # Room type filters (convert to categories)
        if filters.room_types:
            room_categories = []
            for room in filters.room_types:
                room_categories.extend(self.room_category_mapping.get(room, []))
            
            if room_categories:
                # Remove duplicates
                room_categories = list(set(room_categories))
                placeholders = ','.join(['%s'] * len(room_categories))
                query += f" AND c.name IN ({placeholders})"
                params.extend(room_categories)
        
        # Brand filters
        if filters.brands:
            placeholders = ','.join(['%s'] * len(filters.brands))
            query += f" AND p.brand IN ({placeholders})"
            params.extend(filters.brands)
        
        # Price range filters
        if filters.min_price is not None:
            query += " AND p.price >= %s"
            params.append(filters.min_price)
        
        if filters.max_price is not None:
            query += " AND p.price <= %s"
            params.append(filters.max_price)
        
        # Rating filter
        if filters.min_rating is not None:
            query += " AND p.rating >= %s"
            params.append(filters.min_rating)
        
        # Style filters
        if filters.styles:
            placeholders = ','.join(['%s'] * len(filters.styles))
            query += f" AND pa_style.attribute_value IN ({placeholders})"
            params.extend(filters.styles)
        
        # Material filters
        if filters.materials:
            placeholders = ','.join(['%s'] * len(filters.materials))
            query += f" AND pa_material.attribute_value IN ({placeholders})"
            params.extend(filters.materials)
        
        # Feature filters (search in product name)
        if filters.features:
            for feature in filters.features:
                query += " AND p.product_name ILIKE %s"
                params.append(f"%{feature}%")
        
        return query, params
    
    def _get_total_count(self) -> int:
        """Get total number of active products."""
        return db.fetch_one("SELECT COUNT(*) FROM products WHERE active = TRUE")[0]
    
    def _generate_search_suggestions(self, filters: SearchFilters) -> List[str]:
        """Generate search suggestions based on current filters."""
        
        suggestions = []
        
        # If no query, suggest popular search terms
        if not filters.query:
            popular_terms = ['desk', 'chair', 'storage', 'shelf', 'table', 'organizer']
            suggestions.extend(popular_terms)
        else:
            # Suggest related terms based on current query
            related_query = """
                SELECT DISTINCT p.product_name
                FROM products p
                WHERE p.active = TRUE 
                AND p.product_name ILIKE %s
                LIMIT 5
            """
            results = db.fetch_all(related_query, [f"%{filters.query}%"])
            suggestions.extend([row[0] for row in results])
        
        return suggestions[:5]  # Limit to 5 suggestions
    
    def _get_related_categories(self, filters: SearchFilters) -> List[str]:
        """Get related categories based on current search."""
        
        if not filters.query:
            return []
        
        query = """
            SELECT DISTINCT c.name, COUNT(p.id) as product_count
            FROM categories c
            JOIN product_categories pc ON c.id = pc.category_id
            JOIN products p ON pc.product_id = p.id
            WHERE p.active = TRUE 
            AND p.product_name ILIKE %s
            GROUP BY c.name
            ORDER BY product_count DESC
            LIMIT 5
        """
        
        results = db.fetch_all(query, [f"%{filters.query}%"])
        return [row[0] for row in results]
    
    def _get_applied_filters(self, filters: SearchFilters) -> Dict:
        """Get a summary of applied filters."""
        
        applied = {}
        
        if filters.query:
            applied['search_query'] = filters.query
        if filters.categories:
            applied['categories'] = filters.categories
        if filters.brands:
            applied['brands'] = filters.brands
        if filters.min_price is not None or filters.max_price is not None:
            applied['price_range'] = {
                'min': filters.min_price,
                'max': filters.max_price
            }
        if filters.min_rating:
            applied['min_rating'] = filters.min_rating
        if filters.room_types:
            applied['room_types'] = filters.room_types
        if filters.styles:
            applied['styles'] = filters.styles
        if filters.materials:
            applied['materials'] = filters.materials
        if filters.features:
            applied['features'] = filters.features
        if filters.sort_by != 'relevance':
            applied['sort_by'] = filters.sort_by
        
        return applied
    
    def get_filter_options(self) -> Dict:
        """Get available filter options for the UI."""
        
        # Get available brands
        brands_query = """
            SELECT DISTINCT brand, COUNT(*) as count
            FROM products 
            WHERE active = TRUE AND brand IS NOT NULL
            GROUP BY brand
            ORDER BY count DESC, brand ASC
            LIMIT 20
        """
        brands = [{'name': row[0], 'count': row[1]} for row in db.fetch_all(brands_query)]
        
        # Get available categories
        categories_query = """
            SELECT c.name, COUNT(pc.product_id) as count
            FROM categories c
            LEFT JOIN product_categories pc ON c.id = pc.category_id
            WHERE c.parent_id IS NULL
            GROUP BY c.id, c.name
            ORDER BY count DESC
        """
        categories = [{'name': row[0], 'count': row[1]} for row in db.fetch_all(categories_query)]
        
        # Get price ranges
        price_query = """
            SELECT MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price
            FROM products 
            WHERE active = TRUE AND price IS NOT NULL
        """
        price_stats = db.fetch_one(price_query)
        
        # Get available styles
        styles_query = """
            SELECT attribute_value, COUNT(*) as count
            FROM product_attributes
            WHERE attribute_type = 'style'
            GROUP BY attribute_value
            ORDER BY count DESC
            LIMIT 10
        """
        styles = [{'name': row[0], 'count': row[1]} for row in db.fetch_all(styles_query)]
        
        # Get available materials
        materials_query = """
            SELECT attribute_value, COUNT(*) as count
            FROM product_attributes
            WHERE attribute_type = 'material'
            GROUP BY attribute_value
            ORDER BY count DESC
            LIMIT 10
        """
        materials = [{'name': row[0], 'count': row[1]} for row in db.fetch_all(materials_query)]
        
        return {
            'brands': brands,
            'categories': categories,
            'price_range': {
                'min': float(price_stats[0]) if price_stats[0] else 0,
                'max': float(price_stats[1]) if price_stats[1] else 1000,
                'avg': float(price_stats[2]) if price_stats[2] else 100
            },
            'styles': styles,
            'materials': materials,
            'room_types': list(self.room_category_mapping.keys()),
            'sort_options': list(self.sort_options.keys())
        }

# Global instance
search_engine = AdvancedSearchEngine()