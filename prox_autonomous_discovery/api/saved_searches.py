#!/usr/bin/env python3
"""Saved searches and advanced filter combinations."""

import logging
from typing import List, Dict, Optional
from datetime import datetime
import json
from pydantic import BaseModel
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SavedSearch(BaseModel):
    """Saved search model."""
    id: Optional[int] = None
    name: str
    query: Optional[str] = None
    filters: Dict
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    created_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    use_count: Optional[int] = 0
    is_public: Optional[bool] = False

class FilterPreset(BaseModel):
    """Predefined filter combinations."""
    name: str
    description: str
    filters: Dict
    category: str
    popularity_score: Optional[float] = 0.0

class SavedSearchManager:
    """Manages saved searches and filter presets."""
    
    def __init__(self):
        self.popular_presets = self._initialize_popular_presets()
    
    def _initialize_popular_presets(self) -> List[FilterPreset]:
        """Initialize popular filter presets."""
        return [
            FilterPreset(
                name="Budget Office Setup",
                description="Affordable office furniture under $150",
                category="office",
                filters={
                    "room_types": ["office"],
                    "max_price": 150.0,
                    "sort_by": "price_asc",
                    "min_rating": 4.0
                }
            ),
            FilterPreset(
                name="Small Space Storage",
                description="Compact storage solutions for tight spaces",
                category="storage",
                filters={
                    "categories": ["Storage & Organization"],
                    "features": ["compact", "space-saving"],
                    "sort_by": "trending"
                }
            ),
            FilterPreset(
                name="Modern Living Room",
                description="Contemporary furniture for living spaces",
                category="living_room",
                filters={
                    "room_types": ["living_room"],
                    "styles": ["Modern", "Contemporary"],
                    "sort_by": "rating",
                    "min_rating": 4.2
                }
            ),
            FilterPreset(
                name="Premium Home Office",
                description="High-quality office furniture for professionals",
                category="office", 
                filters={
                    "room_types": ["office"],
                    "min_price": 200.0,
                    "styles": ["Modern", "Executive"],
                    "sort_by": "rating"
                }
            ),
            FilterPreset(
                name="Bedroom Organization",
                description="Storage and organization for bedrooms",
                category="bedroom",
                filters={
                    "room_types": ["bedroom"],
                    "categories": ["Bedroom Furniture", "Storage & Organization"],
                    "max_price": 200.0,
                    "sort_by": "trending"
                }
            ),
            FilterPreset(
                name="Kitchen Efficiency",
                description="Smart storage for kitchen organization",
                category="kitchen",
                filters={
                    "room_types": ["kitchen"],
                    "categories": ["Kitchen & Dining"],
                    "features": ["storage", "organization"],
                    "sort_by": "rating"
                }
            )
        ]
    
    def create_saved_searches_table(self):
        """Create saved searches table if it doesn't exist."""
        
        create_table_sql = """
            CREATE TABLE IF NOT EXISTS saved_searches (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                query TEXT,
                filters JSONB NOT NULL,
                user_id VARCHAR(255),
                session_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                last_used TIMESTAMP DEFAULT NOW(),
                use_count INT DEFAULT 0,
                is_public BOOLEAN DEFAULT FALSE
            );
        """
        
        create_indexes_sql = """
            CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
            CREATE INDEX IF NOT EXISTS idx_saved_searches_session ON saved_searches(session_id);
            CREATE INDEX IF NOT EXISTS idx_saved_searches_public ON saved_searches(is_public);
            CREATE INDEX IF NOT EXISTS idx_saved_searches_created ON saved_searches(created_at DESC);
        """
        
        try:
            db.execute(create_table_sql)
            db.execute(create_indexes_sql)
            logger.info("Saved searches table created successfully")
        except Exception as e:
            logger.error(f"Failed to create saved searches table: {e}")
    
    def save_search(self, saved_search: SavedSearch) -> int:
        """Save a search configuration."""
        
        try:
            query = """
                INSERT INTO saved_searches 
                (name, query, filters, user_id, session_id, is_public)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """
            
            result = db.fetch_one(query, [
                saved_search.name,
                saved_search.query,
                json.dumps(saved_search.filters),
                saved_search.user_id,
                saved_search.session_id,
                saved_search.is_public or False
            ])
            
            search_id = result[0]
            logger.info(f"Saved search '{saved_search.name}' with ID {search_id}")
            return search_id
            
        except Exception as e:
            logger.error(f"Failed to save search: {e}")
            raise
    
    def get_saved_searches(self, user_id: str = None, session_id: str = None, include_public: bool = True) -> List[SavedSearch]:
        """Get saved searches for a user/session."""
        
        try:
            conditions = []
            params = []
            
            if user_id:
                conditions.append("user_id = %s")
                params.append(user_id)
            elif session_id:
                conditions.append("session_id = %s")
                params.append(session_id)
            
            if include_public:
                if conditions:
                    conditions.append("OR is_public = TRUE")
                else:
                    conditions.append("is_public = TRUE")
            
            where_clause = "WHERE " + " ".join(conditions) if conditions else ""
            
            query = f"""
                SELECT id, name, query, filters, user_id, session_id, 
                       created_at, last_used, use_count, is_public
                FROM saved_searches
                {where_clause}
                ORDER BY last_used DESC, created_at DESC
                LIMIT 50
            """
            
            results = db.fetch_all(query, params)
            
            searches = []
            for row in results:
                searches.append(SavedSearch(
                    id=row[0],
                    name=row[1],
                    query=row[2],
                    filters=json.loads(row[3]) if row[3] else {},
                    user_id=row[4],
                    session_id=row[5],
                    created_at=row[6],
                    last_used=row[7],
                    use_count=row[8],
                    is_public=row[9]
                ))
            
            return searches
            
        except Exception as e:
            logger.error(f"Failed to get saved searches: {e}")
            return []
    
    def use_saved_search(self, search_id: int) -> Optional[SavedSearch]:
        """Use a saved search and update its usage statistics."""
        
        try:
            # Get the search
            query = """
                SELECT id, name, query, filters, user_id, session_id, 
                       created_at, last_used, use_count, is_public
                FROM saved_searches
                WHERE id = %s
            """
            
            result = db.fetch_one(query, [search_id])
            if not result:
                return None
            
            # Update usage statistics
            update_query = """
                UPDATE saved_searches 
                SET last_used = NOW(), use_count = use_count + 1
                WHERE id = %s
            """
            db.execute(update_query, [search_id])
            
            # Return the search object
            return SavedSearch(
                id=result[0],
                name=result[1],
                query=result[2],
                filters=json.loads(result[3]) if result[3] else {},
                user_id=result[4],
                session_id=result[5],
                created_at=result[6],
                last_used=datetime.now(),  # Updated
                use_count=result[8] + 1,   # Updated
                is_public=result[9]
            )
            
        except Exception as e:
            logger.error(f"Failed to use saved search {search_id}: {e}")
            return None
    
    def delete_saved_search(self, search_id: int, user_id: str = None, session_id: str = None) -> bool:
        """Delete a saved search."""
        
        try:
            # Build query with ownership check
            conditions = ["id = %s"]
            params = [search_id]
            
            if user_id:
                conditions.append("user_id = %s")
                params.append(user_id)
            elif session_id:
                conditions.append("session_id = %s")
                params.append(session_id)
            
            where_clause = " AND ".join(conditions)
            
            query = f"DELETE FROM saved_searches WHERE {where_clause}"
            rows_affected = db.execute(query, params)
            
            success = rows_affected > 0
            if success:
                logger.info(f"Deleted saved search {search_id}")
            else:
                logger.warning(f"No saved search {search_id} found for deletion")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete saved search {search_id}: {e}")
            return False
    
    def get_popular_presets(self) -> List[FilterPreset]:
        """Get popular filter presets."""
        return self.popular_presets
    
    def get_preset_by_name(self, name: str) -> Optional[FilterPreset]:
        """Get a specific preset by name."""
        for preset in self.popular_presets:
            if preset.name.lower() == name.lower():
                return preset
        return None
    
    def suggest_filters_based_on_query(self, query: str) -> List[Dict]:
        """Suggest filter combinations based on search query."""
        
        suggestions = []
        query_lower = query.lower()
        
        # Room-based suggestions
        room_keywords = {
            'office': ['office', 'work', 'desk', 'computer'],
            'bedroom': ['bedroom', 'bed', 'sleep', 'nightstand'],
            'kitchen': ['kitchen', 'cook', 'dining', 'cabinet'],
            'living_room': ['living', 'couch', 'tv', 'entertainment'],
            'bathroom': ['bathroom', 'bath', 'toilet', 'shower']
        }
        
        for room, keywords in room_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                suggestions.append({
                    'type': 'room_filter',
                    'suggestion': f'Filter by {room.replace("_", " ").title()}',
                    'filters': {'room_types': [room]},
                    'confidence': 0.8
                })
        
        # Price-based suggestions
        budget_keywords = ['cheap', 'affordable', 'budget', 'under']
        premium_keywords = ['premium', 'high-quality', 'expensive', 'luxury']
        
        if any(keyword in query_lower for keyword in budget_keywords):
            suggestions.append({
                'type': 'price_filter',
                'suggestion': 'Show budget-friendly options under $100',
                'filters': {'max_price': 100.0, 'sort_by': 'price_asc'},
                'confidence': 0.7
            })
        elif any(keyword in query_lower for keyword in premium_keywords):
            suggestions.append({
                'type': 'price_filter',
                'suggestion': 'Show premium options over $200',
                'filters': {'min_price': 200.0, 'sort_by': 'rating'},
                'confidence': 0.7
            })
        
        # Style-based suggestions
        if 'modern' in query_lower or 'contemporary' in query_lower:
            suggestions.append({
                'type': 'style_filter',
                'suggestion': 'Filter by Modern style',
                'filters': {'styles': ['Modern']},
                'confidence': 0.9
            })
        elif 'traditional' in query_lower or 'classic' in query_lower:
            suggestions.append({
                'type': 'style_filter',
                'suggestion': 'Filter by Traditional style',
                'filters': {'styles': ['Traditional']},
                'confidence': 0.9
            })
        
        # Size-based suggestions
        if 'small' in query_lower or 'compact' in query_lower or 'tiny' in query_lower:
            suggestions.append({
                'type': 'feature_filter',
                'suggestion': 'Show compact/space-saving options',
                'filters': {'features': ['compact', 'space-saving']},
                'confidence': 0.8
            })
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def get_search_analytics(self) -> Dict:
        """Get analytics about saved searches."""
        
        try:
            # Most popular searches
            popular_query = """
                SELECT name, use_count, COUNT(*) as saves
                FROM saved_searches
                WHERE use_count > 0
                GROUP BY name, use_count
                ORDER BY use_count DESC, saves DESC
                LIMIT 5
            """
            popular_searches = db.fetch_all(popular_query)
            
            # Most common filter combinations
            filters_query = """
                SELECT filters, COUNT(*) as frequency
                FROM saved_searches
                GROUP BY filters
                ORDER BY frequency DESC
                LIMIT 10
            """
            filter_combinations = db.fetch_all(filters_query)
            
            # Usage statistics
            stats_query = """
                SELECT 
                    COUNT(*) as total_searches,
                    COUNT(CASE WHEN use_count > 0 THEN 1 END) as used_searches,
                    AVG(use_count) as avg_uses,
                    COUNT(CASE WHEN is_public THEN 1 END) as public_searches
                FROM saved_searches
            """
            stats = db.fetch_one(stats_query)
            
            return {
                'popular_searches': [
                    {'name': row[0], 'use_count': row[1], 'saves': row[2]}
                    for row in popular_searches
                ],
                'common_filter_combinations': [
                    {'filters': json.loads(row[0]), 'frequency': row[1]}
                    for row in filter_combinations
                ],
                'usage_stats': {
                    'total_searches': stats[0],
                    'used_searches': stats[1],
                    'avg_uses_per_search': float(stats[2]) if stats[2] else 0,
                    'public_searches': stats[3]
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get search analytics: {e}")
            return {'error': str(e)}

# Global instance
saved_search_manager = SavedSearchManager()