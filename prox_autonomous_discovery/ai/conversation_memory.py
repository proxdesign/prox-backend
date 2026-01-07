#!/usr/bin/env python3
"""Conversation memory and context awareness for enhanced chat experience."""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConversationMemory:
    """Manages conversation context and memory across chat sessions."""
    
    def __init__(self):
        self.session_timeout = timedelta(hours=2)  # Sessions expire after 2 hours
    
    def get_or_create_session(self, session_id: str = None) -> str:
        """Get existing session or create new one."""
        if not session_id:
            # Generate new session
            session_id = f"sess_{int(datetime.now().timestamp())}"
        
        # Check if session exists and is not expired
        existing = db.fetch_one("""
            SELECT session_id, last_activity 
            FROM user_sessions 
            WHERE session_id = %s 
            AND last_activity > %s
        """, [session_id, datetime.now() - self.session_timeout])
        
        if not existing:
            # Create new session
            self.create_new_session(session_id)
        
        return session_id
    
    def create_new_session(self, session_id: str):
        """Create a new conversation session."""
        try:
            query = """
                INSERT INTO user_sessions 
                (session_id, user_preferences, products_shown, user_messages, started_at, last_activity)
                VALUES (%s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (session_id) DO UPDATE SET
                    last_activity = NOW(),
                    user_preferences = '{}',
                    products_shown = '[]',
                    user_messages = '[]'
            """
            db.execute(query, [session_id, '{}', '[]', '[]'])
            logger.info(f"Created new session: {session_id}")
        except Exception as e:
            logger.error(f"Failed to create session {session_id}: {e}")
    
    def update_session_context(self, session_id: str, message: str, analysis: Dict, products_shown: List[int]):
        """Update session with new conversation context."""
        try:
            # Get current session data
            current = db.fetch_one("""
                SELECT user_preferences, products_shown, user_messages 
                FROM user_sessions 
                WHERE session_id = %s
            """, [session_id])
            
            if current:
                # Parse existing data
                preferences = json.loads(current[0]) if current[0] and isinstance(current[0], str) else (current[0] if current[0] else {})
                shown_products = json.loads(current[1]) if current[1] and isinstance(current[1], str) else (current[1] if current[1] else [])
                messages = json.loads(current[2]) if current[2] and isinstance(current[2], str) else (current[2] if current[2] else [])
                
                # Update preferences with new analysis
                self._merge_preferences(preferences, analysis)
                
                # Add new products shown (avoid duplicates)
                shown_products.extend([pid for pid in products_shown if pid not in shown_products])
                
                # Add new message (keep last 10 messages for context)
                messages.append({
                    'message': message,
                    'timestamp': datetime.now().isoformat(),
                    'analysis': analysis
                })
                messages = messages[-10:]  # Keep only last 10
                
                # Update database
                update_query = """
                    UPDATE user_sessions SET
                        user_preferences = %s,
                        products_shown = %s,
                        user_messages = %s,
                        last_activity = NOW()
                    WHERE session_id = %s
                """
                db.execute(update_query, [
                    json.dumps(preferences),
                    json.dumps(shown_products),
                    json.dumps(messages),
                    session_id
                ])
                
                logger.info(f"Updated session {session_id} context")
            
        except Exception as e:
            logger.error(f"Failed to update session context: {e}")
    
    def _merge_preferences(self, current_prefs: Dict, new_analysis: Dict):
        """Merge new analysis data into existing preferences."""
        
        # Merge room types
        rooms = set(current_prefs.get('room_types', []))
        rooms.update(new_analysis.get('room_types', []))
        current_prefs['room_types'] = list(rooms)
        
        # Merge style preferences  
        styles = set(current_prefs.get('style_preferences', []))
        styles.update(new_analysis.get('style_preferences', []))
        current_prefs['style_preferences'] = list(styles)
        
        # Update budget if specified
        budget = new_analysis.get('budget_signals', {})
        if budget.get('range') and budget['range'] != 'not_specified':
            current_prefs['budget_range'] = budget['range']
        
        # Accumulate furniture types needed
        furniture = set(current_prefs.get('furniture_types_needed', []))
        furniture.update(new_analysis.get('furniture_types_needed', []))
        current_prefs['furniture_types_needed'] = list(furniture)
        
        # Update space constraints
        space = new_analysis.get('space_constraints', {})
        if space:
            current_prefs['space_constraints'] = space
        
        # Track pain points
        pain_points = set(current_prefs.get('pain_points', []))
        pain_points.update(new_analysis.get('pain_points', []))
        current_prefs['pain_points'] = list(pain_points)
    
    def get_session_context(self, session_id: str) -> Dict:
        """Get conversation context for a session."""
        try:
            session = db.fetch_one("""
                SELECT user_preferences, products_shown, user_messages, started_at
                FROM user_sessions 
                WHERE session_id = %s 
                AND last_activity > %s
            """, [session_id, datetime.now() - self.session_timeout])
            
            if session:
                preferences = json.loads(session[0]) if session[0] and isinstance(session[0], str) else (session[0] if session[0] else {})
                products_shown = json.loads(session[1]) if session[1] and isinstance(session[1], str) else (session[1] if session[1] else [])
                messages = json.loads(session[2]) if session[2] and isinstance(session[2], str) else (session[2] if session[2] else [])
                
                return {
                    'preferences': preferences,
                    'products_shown': products_shown,
                    'messages': messages,
                    'started_at': session[3].isoformat() if session[3] else None,
                    'conversation_length': len(messages)
                }
            else:
                return {'preferences': {}, 'products_shown': [], 'messages': [], 'conversation_length': 0}
                
        except Exception as e:
            logger.error(f"Failed to get session context: {e}")
            return {'preferences': {}, 'products_shown': [], 'messages': [], 'conversation_length': 0}
    
    def get_contextual_recommendations(self, session_id: str, current_analysis: Dict, limit: int = 8) -> List[Dict]:
        """Get recommendations considering conversation history."""
        
        context = self.get_session_context(session_id)
        preferences = context.get('preferences', {})
        shown_products = context.get('products_shown', [])
        
        # Combine current analysis with stored preferences
        combined_rooms = list(set(
            current_analysis.get('room_types', []) + 
            preferences.get('room_types', [])
        ))
        
        combined_styles = list(set(
            current_analysis.get('style_preferences', []) + 
            preferences.get('style_preferences', [])
        ))
        
        combined_furniture = list(set(
            current_analysis.get('furniture_types_needed', []) + 
            preferences.get('furniture_types_needed', [])
        ))
        
        # Build query with context awareness
        products = []
        
        # 1. Room-based recommendations (if we know rooms)
        if combined_rooms:
            room_categories = []
            room_mapping = {
                'bedroom': ['Bedroom Furniture', 'Storage & Organization'],
                'living_room': ['Living Room', 'Storage & Organization'],  
                'office': ['Home Office', 'Storage & Organization'],
                'kitchen': ['Kitchen & Dining', 'Storage & Organization'],
                'bathroom': ['Bathroom', 'Storage & Organization']
            }
            
            for room in combined_rooms:
                room_categories.extend(room_mapping.get(room, []))
            
            room_categories = list(set(room_categories))
            
            if room_categories:
                query = """
                    SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                           p.affiliate_url, p.image_url, p.rating, p.review_count,
                           p.trend_score, ap.partner_name, c.name as category_name
                    FROM products p
                    JOIN product_categories pc ON p.id = pc.product_id
                    JOIN categories c ON pc.category_id = c.id
                    JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
                    WHERE p.active = TRUE 
                    AND c.name = ANY(%s)
                    AND p.id != ALL(%s)
                    ORDER BY p.trend_score DESC, p.rating DESC
                    LIMIT %s
                """
                
                results = db.fetch_all(query, [room_categories, shown_products or [0], limit//2])
                
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
                        'partner_name': row[10],
                        'match_reason': f"Perfect for your {row[11].lower()}"
                    })
        
        # 2. Fill remaining slots with keyword matches
        if len(products) < limit and combined_furniture:
            remaining = limit - len(products)
            used_ids = [p['id'] for p in products]
            
            for keyword in combined_furniture[:3]:
                query = """
                    SELECT p.id, p.solution_id, p.product_name, p.brand, p.price,
                           p.affiliate_url, p.image_url, p.rating, p.review_count,
                           p.trend_score, ap.partner_name
                    FROM products p
                    JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
                    WHERE p.active = TRUE 
                    AND p.product_name ILIKE %s
                    AND p.id != ALL(%s)
                    ORDER BY p.trend_score DESC
                    LIMIT %s
                """
                
                all_excluded = used_ids + (shown_products or [])
                results = db.fetch_all(query, [f"%{keyword}%", all_excluded or [0], remaining])
                
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
                        'partner_name': row[10],
                        'match_reason': f"Matches your interest in {keyword}"
                    })
                    used_ids.append(row[0])
                
                remaining = limit - len(products)
                if remaining <= 0:
                    break
        
        logger.info(f"Found {len(products)} contextual recommendations for session {session_id}")
        return products[:limit]
    
    def cleanup_old_sessions(self):
        """Clean up expired sessions."""
        try:
            cutoff = datetime.now() - self.session_timeout
            deleted = db.execute("""
                DELETE FROM user_sessions 
                WHERE last_activity < %s
            """, [cutoff])
            
            if deleted:
                logger.info(f"Cleaned up {deleted} expired sessions")
        except Exception as e:
            logger.error(f"Failed to cleanup sessions: {e}")

# Global instance
conversation_memory = ConversationMemory()