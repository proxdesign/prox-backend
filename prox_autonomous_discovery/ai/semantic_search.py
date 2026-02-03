#!/usr/bin/env python3
"""Semantic search using AI to understand user intent and find relevant products."""

import logging
from typing import List, Dict, Optional, Tuple
import anthropic
from config.settings import settings
from database.connection import db
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SemanticSearchEngine:
    """AI-powered semantic search for intelligent product discovery."""
    
    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-haiku-20241022"
        
        # Semantic mapping categories
        self.semantic_categories = {
            'space_optimization': ['storage', 'compact', 'small space', 'multi-functional', 'space-saving'],
            'comfort_seating': ['ergonomic', 'comfortable', 'lumbar support', 'padded', 'adjustable'],
            'work_productivity': ['desk', 'office', 'workspace', 'computer', 'standing'],
            'organization_solutions': ['organizer', 'bins', 'shelving', 'cabinet', 'drawer'],
            'aesthetic_appeal': ['modern', 'stylish', 'decorative', 'beautiful', 'elegant'],
            'durability_quality': ['sturdy', 'solid', 'heavy-duty', 'premium', 'quality'],
            'budget_friendly': ['affordable', 'cheap', 'budget', 'value', 'economical'],
            'easy_assembly': ['easy', 'tool-free', 'quick', 'simple', 'hassle-free']
        }
    
    def semantic_search(self, query: str, limit: int = 20) -> Dict:
        """Perform semantic search using AI understanding."""
        
        try:
            # Step 1: Analyze query semantically
            intent_analysis = self._analyze_search_intent(query)
            
            # Step 2: Generate search strategies
            search_strategies = self._generate_search_strategies(intent_analysis)
            
            # Step 3: Execute searches and combine results
            products = []
            for strategy in search_strategies:
                strategy_products = self._execute_search_strategy(strategy, limit // len(search_strategies))
                products.extend(strategy_products)
            
            # Step 4: Remove duplicates and rank by relevance
            unique_products = self._deduplicate_and_rank(products, intent_analysis)
            
            # Step 5: Generate explanations for recommendations
            explanations = self._generate_explanations(unique_products[:limit], intent_analysis)
            
            return {
                'query': query,
                'intent_analysis': intent_analysis,
                'total_found': len(unique_products),
                'products': unique_products[:limit],
                'explanations': explanations,
                'search_strategies_used': [s['name'] for s in search_strategies],
                'semantic_insights': self._get_semantic_insights(intent_analysis)
            }
            
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            # Fallback to basic search
            return self._fallback_search(query, limit)
    
    def _analyze_search_intent(self, query: str) -> Dict:
        """Use AI to analyze the semantic intent of the search query."""
        
        analysis_prompt = f"""
        Analyze this furniture/home organization search query for semantic intent and context.

        Query: "{query}"

        Provide a detailed analysis in JSON format:
        {{
            "primary_intent": "what is the user primarily looking for",
            "problem_solving": {{
                "problems_mentioned": ["specific problems or challenges mentioned"],
                "pain_points": ["underlying frustrations or needs"]
            }},
            "context_clues": {{
                "room_hints": ["any room/space indicators"],
                "style_hints": ["any aesthetic preferences"],
                "size_constraints": ["any size or space limitations mentioned"],
                "budget_indicators": ["any cost/value concerns"],
                "urgency_level": "low|medium|high"
            }},
            "functional_requirements": {{
                "must_have_features": ["essential functionality needed"],
                "nice_to_have": ["optional but desired features"],
                "use_case": "how they plan to use the furniture"
            }},
            "emotional_context": {{
                "sentiment": "positive|negative|neutral|frustrated|excited",
                "motivation": "what's driving this search"
            }},
            "semantic_keywords": {{
                "explicit": ["directly mentioned keywords"],
                "implied": ["concepts implied but not directly stated"],
                "synonyms": ["related terms that might help find products"]
            }},
            "search_complexity": "simple|moderate|complex",
            "confidence_score": 0.1-1.0
        }}

        Be thorough in extracting meaning, including subtle implications.
        """
        
        try:
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": analysis_prompt}]
            )
            
            analysis = json.loads(response.content[0].text)
            logger.info(f"Semantic intent analyzed for: '{query}'")
            return analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze search intent: {e}")
            return {
                "primary_intent": query,
                "semantic_keywords": {"explicit": [query], "implied": [], "synonyms": []},
                "confidence_score": 0.5
            }
    
    def _generate_search_strategies(self, intent_analysis: Dict) -> List[Dict]:
        """Generate multiple search strategies based on intent analysis."""
        
        strategies = []
        
        # Strategy 1: Explicit keyword search
        explicit_keywords = intent_analysis.get('semantic_keywords', {}).get('explicit', [])
        if explicit_keywords:
            strategies.append({
                'name': 'explicit_keywords',
                'type': 'keyword_search',
                'keywords': explicit_keywords,
                'weight': 1.0
            })
        
        # Strategy 2: Implied concept search  
        implied_keywords = intent_analysis.get('semantic_keywords', {}).get('implied', [])
        if implied_keywords:
            strategies.append({
                'name': 'implied_concepts',
                'type': 'keyword_search',
                'keywords': implied_keywords,
                'weight': 0.8
            })
        
        # Strategy 3: Problem-solution matching
        problems = intent_analysis.get('problem_solving', {}).get('problems_mentioned', [])
        if problems:
            strategies.append({
                'name': 'problem_solving',
                'type': 'problem_search',
                'problems': problems,
                'weight': 0.9
            })
        
        # Strategy 4: Context-based search (room, style, etc.)
        room_hints = intent_analysis.get('context_clues', {}).get('room_hints', [])
        if room_hints:
            strategies.append({
                'name': 'context_matching',
                'type': 'context_search',
                'context': intent_analysis.get('context_clues', {}),
                'weight': 0.7
            })
        
        # Strategy 5: Feature-based search
        features = intent_analysis.get('functional_requirements', {}).get('must_have_features', [])
        if features:
            strategies.append({
                'name': 'feature_matching',
                'type': 'feature_search',
                'features': features,
                'weight': 0.8
            })
        
        # If no specific strategies, use synonym expansion
        if not strategies:
            synonyms = intent_analysis.get('semantic_keywords', {}).get('synonyms', [])
            strategies.append({
                'name': 'synonym_expansion',
                'type': 'keyword_search',
                'keywords': synonyms or [intent_analysis.get('primary_intent', '')],
                'weight': 0.6
            })
        
        return strategies
    
    def _execute_search_strategy(self, strategy: Dict, limit: int) -> List[Dict]:
        """Execute a specific search strategy."""
        
        try:
            if strategy['type'] == 'keyword_search':
                return self._keyword_search(strategy['keywords'], limit)
            elif strategy['type'] == 'problem_search':
                return self._problem_based_search(strategy['problems'], limit)
            elif strategy['type'] == 'context_search':
                return self._context_based_search(strategy['context'], limit)
            elif strategy['type'] == 'feature_search':
                return self._feature_based_search(strategy['features'], limit)
            else:
                return []
                
        except Exception as e:
            logger.error(f"Failed to execute search strategy {strategy['name']}: {e}")
            return []
    
    def _keyword_search(self, keywords: List[str], limit: int) -> List[Dict]:
        """Search by keywords in product names and descriptions."""
        
        if not keywords:
            return []
        
        # Build dynamic query with OR conditions for keywords
        keyword_conditions = []
        params = []
        
        for keyword in keywords:
            keyword_conditions.append("(p.product_name ILIKE %s OR p.brand ILIKE %s)")
            params.extend([f"%{keyword}%", f"%{keyword}%"])
        
        query = f"""
            SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.active = TRUE 
            AND ({' OR '.join(keyword_conditions)})
            ORDER BY p.rating DESC NULLS LAST, p.review_count DESC NULLS LAST
            LIMIT %s
        """
        
        params.append(limit)
        results = db.fetch_all(query, params)
        
        return self._format_products(results)
    
    def _problem_based_search(self, problems: List[str], limit: int) -> List[Dict]:
        """Search for products that solve specific problems."""
        
        if not problems:
            return []
        
        # Search in solutions and problems tables
        problem_conditions = []
        params = []
        
        for problem in problems:
            problem_conditions.append("(pr.problem_text ILIKE %s OR s.solution_description ILIKE %s)")
            params.extend([f"%{problem}%", f"%{problem}%"])
        
        query = f"""
            SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN solutions s ON p.solution_id = s.id
            JOIN problems pr ON s.problem_id = pr.id
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.active = TRUE 
            AND ({' OR '.join(problem_conditions)})
            ORDER BY p.rating DESC NULLS LAST, p.review_count DESC NULLS LAST
            LIMIT %s
        """
        
        params.append(limit)
        results = db.fetch_all(query, params)
        
        return self._format_products(results)
    
    def _context_based_search(self, context: Dict, limit: int) -> List[Dict]:
        """Search based on contextual clues like room type, style, etc."""
        
        room_hints = context.get('room_hints', [])
        style_hints = context.get('style_hints', [])
        
        conditions = []
        params = []
        
        # Room-based category search
        if room_hints:
            room_categories = []
            room_mapping = {
                'bedroom': ['Bedroom Furniture', 'Storage & Organization'],
                'living_room': ['Living Room', 'Storage & Organization'],
                'office': ['Home Office', 'Storage & Organization'],
                'kitchen': ['Kitchen & Dining', 'Storage & Organization'],
                'bathroom': ['Bathroom', 'Storage & Organization']
            }
            
            for hint in room_hints:
                room_categories.extend(room_mapping.get(hint.lower().replace(' ', '_'), []))
            
            if room_categories:
                placeholders = ','.join(['%s'] * len(room_categories))
                conditions.append(f"c.name IN ({placeholders})")
                params.extend(room_categories)
        
        # Style-based search
        if style_hints:
            style_conditions = []
            for style in style_hints:
                style_conditions.append("pa.attribute_value ILIKE %s")
                params.append(f"%{style}%")
            
            if style_conditions:
                conditions.append(f"({' OR '.join(style_conditions)})")
        
        if not conditions:
            return []
        
        query = f"""
            SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN product_attributes pa ON p.id = pa.product_id AND pa.attribute_type = 'style'
            WHERE p.active = TRUE 
            AND ({' AND '.join(conditions)})
            ORDER BY p.rating DESC NULLS LAST, p.review_count DESC NULLS LAST
            LIMIT %s
        """
        
        params.append(limit)
        results = db.fetch_all(query, params)
        
        return self._format_products(results)
    
    def _feature_based_search(self, features: List[str], limit: int) -> List[Dict]:
        """Search for products with specific features."""
        
        if not features:
            return []
        
        feature_conditions = []
        params = []
        
        for feature in features:
            feature_conditions.append("p.product_name ILIKE %s")
            params.append(f"%{feature}%")
        
        query = f"""
            SELECT DISTINCT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.active = TRUE 
            AND ({' AND '.join(feature_conditions)})
            ORDER BY p.rating DESC NULLS LAST, p.review_count DESC NULLS LAST
            LIMIT %s
        """
        
        params.append(limit)
        results = db.fetch_all(query, params)
        
        return self._format_products(results)
    
    def _format_products(self, results: List[Tuple]) -> List[Dict]:
        """Format database results into product dictionaries."""
        
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
        
        return products
    
    def _deduplicate_and_rank(self, products: List[Dict], intent_analysis: Dict) -> List[Dict]:
        """Remove duplicates and rank by semantic relevance."""
        
        # Remove duplicates by product ID
        seen_ids = set()
        unique_products = []
        
        for product in products:
            if product['id'] not in seen_ids:
                unique_products.append(product)
                seen_ids.add(product['id'])
        
        # Rank by semantic relevance
        ranked_products = []
        for product in unique_products:
            relevance_score = self._calculate_semantic_relevance(product, intent_analysis)
            product['semantic_relevance'] = relevance_score
            ranked_products.append(product)
        
        # Sort by relevance score
        ranked_products.sort(key=lambda x: x['semantic_relevance'], reverse=True)
        
        return ranked_products
    
    def _calculate_semantic_relevance(self, product: Dict, intent_analysis: Dict) -> float:
        """Calculate semantic relevance score for ranking."""
        
        score = 0.0
        
        # Base score from product metrics
        score += (product.get('trend_score', 0) / 10.0) * 0.3
        score += (product.get('rating', 0) / 5.0) * 0.2
        
        # Keyword matching score
        product_text = f"{product['product_name']} {product['brand']}".lower()
        
        explicit_keywords = intent_analysis.get('semantic_keywords', {}).get('explicit', [])
        for keyword in explicit_keywords:
            if keyword.lower() in product_text:
                score += 0.3
        
        implied_keywords = intent_analysis.get('semantic_keywords', {}).get('implied', [])
        for keyword in implied_keywords:
            if keyword.lower() in product_text:
                score += 0.2
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _generate_explanations(self, products: List[Dict], intent_analysis: Dict) -> List[str]:
        """Generate explanations for why products were recommended."""
        
        explanations = []
        
        for product in products[:5]:  # Explain top 5
            try:
                explanation_prompt = f"""
                Explain why this product is a good match for the user's search in 1 sentence.

                User's search intent: {intent_analysis.get('primary_intent', '')}
                User's problems: {intent_analysis.get('problem_solving', {}).get('problems_mentioned', [])}
                User's context: {intent_analysis.get('context_clues', {})}

                Product: {product['product_name']} by {product['brand']}
                Price: ${product['price']}
                Rating: {product['rating']}/5

                Generate a helpful explanation that connects the product to their needs.
                """
                
                response = self.claude.messages.create(
                    model=self.model,
                    max_tokens=150,
                    messages=[{"role": "user", "content": explanation_prompt}]
                )
                
                explanations.append(response.content[0].text)
                
            except Exception as e:
                explanations.append(f"This {product['product_name']} matches your search criteria.")
        
        return explanations
    
    def _get_semantic_insights(self, intent_analysis: Dict) -> List[str]:
        """Generate insights about the semantic analysis."""
        
        insights = []
        
        confidence = intent_analysis.get('confidence_score', 0.5)
        if confidence > 0.8:
            insights.append("High confidence in understanding your needs")
        elif confidence < 0.4:
            insights.append("Could use more specific details to better help you")
        
        complexity = intent_analysis.get('search_complexity', 'moderate')
        if complexity == 'complex':
            insights.append("Detected complex requirements - showing diverse options")
        
        sentiment = intent_analysis.get('emotional_context', {}).get('sentiment', 'neutral')
        if sentiment == 'frustrated':
            insights.append("Focused on solutions to address your concerns")
        
        return insights
    
    def _fallback_search(self, query: str, limit: int) -> Dict:
        """Fallback to basic search if semantic search fails."""
        
        query_sql = """
            SELECT p.id, p.solution_id, p.product_name, p.brand, p.price,
                   p.affiliate_url, p.image_url, p.rating, p.review_count,
                   p.trend_score, ap.partner_name
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.active = TRUE AND p.product_name ILIKE %s
            ORDER BY p.rating DESC NULLS LAST, p.review_count DESC NULLS LAST
            LIMIT %s
        """
        
        results = db.fetch_all(query_sql, [f"%{query}%", limit])
        products = self._format_products(results)
        
        return {
            'query': query,
            'total_found': len(products),
            'products': products,
            'fallback': True
        }

# Global instance
semantic_search_engine = SemanticSearchEngine()