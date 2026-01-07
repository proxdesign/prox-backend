#!/usr/bin/env python3
"""Enhanced AI chat functionality with better product matching and context awareness."""

import logging
import json
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import anthropic
from config.settings import settings
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedChatAgent:
    """Enhanced conversational agent for furniture problem discovery and recommendations."""
    
    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-haiku-20241022"
        
        # Import conversation memory and recommendation flow
        from .conversation_memory import conversation_memory
        from .recommendation_flow import recommendation_flow
        self.memory = conversation_memory
        self.flow = recommendation_flow
        
        # Room type mappings to categories
        self.room_category_mapping = {
            'bedroom': ['Bedroom Furniture', 'Storage & Organization'],
            'living_room': ['Living Room', 'Storage & Organization'],  
            'office': ['Home Office', 'Storage & Organization'],
            'kitchen': ['Kitchen & Dining', 'Storage & Organization'],
            'bathroom': ['Bathroom', 'Storage & Organization'],
            'dining_room': ['Kitchen & Dining', 'Living Room'],
            'home_office': ['Home Office', 'Storage & Organization'],
            'studio_apartment': ['Storage & Organization', 'Living Room', 'Bedroom Furniture'],
            'small_apartment': ['Storage & Organization', 'Living Room', 'Bedroom Furniture']
        }
    
    def analyze_user_intent(self, message: str, context: Optional[Dict] = None) -> Dict:
        """Enhanced analysis of user intent with better context understanding."""
        
        enhanced_prompt = f"""
        You are a furniture and home organization expert. Analyze this user message to understand their specific needs and context.

        User message: "{message}"
        Previous context: {json.dumps(context) if context else "None"}

        Provide a detailed analysis in JSON format:
        {{
            "problems_identified": ["specific furniture/organization problems mentioned"],
            "room_types": ["bedroom", "living_room", "kitchen", "office", "bathroom", "dining_room", "studio_apartment", "small_apartment"],
            "space_constraints": {{
                "size_mentioned": "small|medium|large|not_specified",
                "specific_dimensions": "extract any measurements mentioned",
                "storage_challenges": "lack_of_storage|too_much_clutter|awkward_space|etc"
            }},
            "style_preferences": ["modern", "traditional", "minimalist", "rustic", "industrial", "scandinavian", "bohemian"],
            "budget_signals": {{
                "range": "budget|mid_range|premium|luxury|not_specified",
                "specific_amount": "extract any dollar amounts mentioned",
                "value_focused": true/false
            }},
            "urgency_level": "low|medium|high",
            "furniture_types_needed": ["desk", "chair", "storage", "table", "shelf", "organizer", "etc"],
            "pain_points": ["specific problems causing frustration"],
            "success_criteria": ["what would make them happy/solve their problem"],
            "follow_up_questions": ["questions to ask for better recommendations"]
        }}

        Be thorough but accurate - only include what's actually mentioned or clearly implied.
        """
        
        try:
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": enhanced_prompt}]
            )
            
            # Extract JSON from the response text
            response_text = response.content[0].text.strip()
            
            # Try to find JSON in the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end]
                analysis = json.loads(json_text)
                logger.info(f"User intent analyzed: {len(analysis.get('problems_identified', []))} problems identified")
                return analysis
            else:
                logger.warning("No JSON found in Claude response, using fallback")
                raise ValueError("No valid JSON found in response")
            
        except Exception as e:
            logger.error(f"Failed to analyze user intent: {e}")
            # Return a more helpful fallback analysis
            return {
                "problems_identified": ["closet organization"] if "closet" in message.lower() else ["general organization"],
                "room_types": ["bedroom"],
                "space_constraints": {"size_mentioned": "not_specified", "storage_challenges": "lack_of_storage"},
                "style_preferences": [],
                "budget_signals": {"range": "not_specified", "value_focused": False},
                "urgency_level": "medium",
                "furniture_types_needed": ["storage", "organizer"],
                "pain_points": [message.lower()],
                "success_criteria": ["better organization"],
                "follow_up_questions": ["What type of items do you need to organize?"]
            }
    
    def find_relevant_products(self, analysis: Dict, limit: int = 8) -> List[Dict]:
        """Find products using enhanced matching with new categorization system."""
        
        products = []
        
        # Get categories based on room types
        relevant_categories = []
        for room_type in analysis.get('room_types', []):
            if room_type in self.room_category_mapping:
                relevant_categories.extend(self.room_category_mapping[room_type])
        
        # Remove duplicates
        relevant_categories = list(set(relevant_categories))
        
        if relevant_categories:
            # Search by category first
            category_query = """
                SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                       p.affiliate_url, p.image_url, p.rating, p.review_count,
                       p.trend_score, ap.partner_name, c.name as category_name
                FROM products p
                JOIN product_categories pc ON p.id = pc.product_id
                JOIN categories c ON pc.category_id = c.id
                JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
                WHERE p.active = TRUE AND c.name = ANY(%s)
                ORDER BY p.trend_score DESC, p.rating DESC
                LIMIT %s
            """
            
            results = db.fetch_all(category_query, [relevant_categories, limit])
            
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
                    'match_reason': f"Great for {row[11].lower()}"
                })
        
        # If we don't have enough products, search by keywords
        if len(products) < limit:
            remaining_limit = limit - len(products)
            
            # Extract keywords from problems and furniture types
            search_keywords = []
            search_keywords.extend(analysis.get('problems_identified', []))
            search_keywords.extend(analysis.get('furniture_types_needed', []))
            
            for keyword in search_keywords[:3]:  # Limit to top 3 keywords
                keyword_query = """
                    SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                           p.affiliate_url, p.image_url, p.rating, p.review_count,
                           p.trend_score, ap.partner_name
                    FROM products p
                    JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
                    WHERE p.active = TRUE 
                    AND (p.product_name ILIKE %s OR p.brand ILIKE %s)
                    AND p.id NOT IN (SELECT UNNEST(%s::int[]))
                    ORDER BY p.trend_score DESC
                    LIMIT %s
                """
                
                existing_ids = [p['id'] for p in products]
                search_term = f"%{keyword}%"
                
                results = db.fetch_all(keyword_query, [
                    search_term, search_term, existing_ids or [0], remaining_limit
                ])
                
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
                        'match_reason': f"Matches your need for {keyword}"
                    })
                
                remaining_limit = limit - len(products)
                if remaining_limit <= 0:
                    break
        
        logger.info(f"Found {len(products)} relevant products")
        return products[:limit]
    
    def generate_personalized_response(self, message: str, analysis: Dict, products: List[Dict]) -> str:
        """Generate a personalized conversational response with context awareness."""
        
        # Prepare product summary for context
        product_summary = []
        for i, product in enumerate(products[:3]):  # Include top 3 in context
            product_summary.append(f"- {product['product_name']} by {product['brand']} (${product['price']}, {product.get('match_reason', 'Good match')})")
        
        enhanced_response_prompt = f"""
        You are a knowledgeable, friendly furniture and home organization consultant. The user is seeking help with their space.

        User's message: "{message}"

        Analysis of their needs:
        - Problems identified: {analysis.get('problems_identified', [])}
        - Room types: {analysis.get('room_types', [])}
        - Space constraints: {analysis.get('space_constraints', {})}
        - Style preferences: {analysis.get('style_preferences', [])}
        - Budget signals: {analysis.get('budget_signals', {})}
        - Pain points: {analysis.get('pain_points', [])}

        Found {len(products)} relevant products including:
        {chr(10).join(product_summary) if product_summary else "Various solutions"}

        Generate a helpful response that:
        1. Acknowledges their specific situation empathetically
        2. Validates their pain points if any were identified
        3. Offers 1-2 practical tips or insights
        4. Mentions you've found some solutions to show them
        5. If appropriate, asks a thoughtful follow-up question to better help them
        6. Keeps a warm, consultative tone (not salesy)
        7. Is 3-4 sentences maximum

        Focus on being genuinely helpful and understanding their needs.
        """
        
        try:
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[{"role": "user", "content": enhanced_response_prompt}]
            )
            
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            return "I understand you're looking for furniture solutions. Let me show you some options that might help with your space!"
    
    def chat(self, message: str, context: Optional[Dict] = None, session_id: Optional[str] = None) -> Dict:
        """Main chat interface with enhanced functionality and memory."""
        
        try:
            # Step 1: Get or create session
            session_id = self.memory.get_or_create_session(session_id)
            session_context = self.memory.get_session_context(session_id)
            
            # Step 2: Analyze user intent with full conversation context
            analysis = self.analyze_user_intent(message, session_context)
            
            # Step 3: Find relevant products using contextual recommendations
            products = self.memory.get_contextual_recommendations(session_id, analysis, limit=8)
            
            # If no contextual products found, fall back to basic matching
            if not products:
                products = self.find_relevant_products(analysis, limit=8)
            
            # Step 4: Generate personalized response with conversation awareness
            response_text = self.generate_contextual_response(
                message, analysis, products, session_context
            )
            
            # Step 5: Update session memory
            product_ids = [p['id'] for p in products]
            self.memory.update_session_context(session_id, message, analysis, product_ids)
            
            # Step 6: Prepare updated context
            new_context = {
                'session_id': session_id,
                'last_analysis': analysis,
                'products_shown': product_ids,
                'conversation_turn': session_context.get('conversation_length', 0) + 1,
                'timestamp': datetime.now().isoformat()
            }
            
            return {
                'response': response_text,
                'recommendations': products,
                'problems_identified': analysis.get('problems_identified', []),
                'analysis': analysis,
                'context': new_context,
                'follow_up_questions': analysis.get('follow_up_questions', []),
                'session_id': session_id
            }
            
        except Exception as e:
            logger.error(f"Enhanced chat failed: {e}")
            return {
                'response': "I'm here to help you find the perfect furniture solutions! Could you tell me more about what space you're working with?",
                'recommendations': [],
                'problems_identified': [],
                'analysis': {},
                'context': context or {},
                'session_id': session_id
            }
    
    def generate_contextual_response(self, message: str, analysis: Dict, products: List[Dict], session_context: Dict) -> str:
        """Generate response with full conversation context awareness and guided flow."""
        
        conversation_length = session_context.get('conversation_length', 0)
        preferences = session_context.get('preferences', {})
        
        # Determine conversation stage and flow guidance
        current_stage = self.flow.analyze_conversation_stage(session_context, analysis)
        stage_guidance = self.flow.get_stage_guidance(current_stage, session_context)
        clarifying_question = self.flow.generate_clarifying_question(current_stage, session_context, analysis)
        flow_summary = self.flow.get_flow_summary(session_context)
        
        # Prepare context summary
        context_summary = ""
        if conversation_length > 0:
            known_rooms = preferences.get('room_types', [])
            known_styles = preferences.get('style_preferences', [])
            known_furniture = preferences.get('furniture_types_needed', [])
            
            if known_rooms or known_styles or known_furniture:
                context_summary = f"""
                Previous conversation context:
                - Rooms mentioned: {', '.join(known_rooms) if known_rooms else 'None'}
                - Style preferences: {', '.join(known_styles) if known_styles else 'None'}
                - Furniture interests: {', '.join(known_furniture) if known_furniture else 'None'}
                - This is message #{conversation_length + 1} in our conversation
                - Discovery progress: {flow_summary['completion_status']['progress_percentage']}%
                """
        
        # Prepare product summary
        product_summary = []
        for i, product in enumerate(products[:3]):
            product_summary.append(f"- {product['product_name']} by {product['brand']} (${product['price']}, {product.get('match_reason', 'Good match')})")
        
        # Enhanced prompt with flow awareness
        contextual_prompt = f"""
        You are a furniture consultant guiding a customer through a discovery process. Be natural and help them find exactly what they need.

        Current message: "{message}"
        
        {context_summary}
        
        Discovery stage: {current_stage.value}
        Progress: {flow_summary['completion_status']['progress_percentage']}% complete

        Current analysis:
        - Problems identified: {analysis.get('problems_identified', [])}
        - Room types: {analysis.get('room_types', [])}
        - Style preferences: {analysis.get('style_preferences', [])}
        - Pain points: {analysis.get('pain_points', [])}

        Available products to recommend:
        {chr(10).join(product_summary) if product_summary else "Various solutions available"}

        Flow guidance:
        - Should ask clarifying question: {stage_guidance['should_ask_clarifying_question']}
        - Suggested clarifying question: {clarifying_question or "None"}
        - Ready for final recommendations: {flow_summary['completion_status']['ready_for_recommendations']}

        Generate a response that:
        1. Acknowledges their message naturally
        2. Shows you remember their previous preferences/needs
        3. Addresses their current message helpfully
        4. If we have good products, mention them enthusiastically
        5. If we need more info, ask the suggested clarifying question naturally
        6. If ready for recommendations, present them confidently
        7. Keeps a warm, consultative tone
        8. Is 3-4 sentences maximum

        Be conversational and guide them toward their perfect furniture solution.
        """
        
        try:
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[{"role": "user", "content": contextual_prompt}]
            )
            
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Failed to generate contextual response: {e}")
            # Fallback to basic response
            return self.generate_personalized_response(message, analysis, products)

# Global instance
enhanced_chat_agent = EnhancedChatAgent()