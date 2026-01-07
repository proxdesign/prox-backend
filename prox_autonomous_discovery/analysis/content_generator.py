"""Content Generator - Generate editorial content for products using Claude API."""
import logging
import json
from datetime import datetime
from typing import List, Dict, Optional
import anthropic
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class ContentGenerator:
    """Generate editorial content and user quotes for products using Claude API."""
    
    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-haiku-20241022"
        logger.info("Content generator initialized")
    
    def generate_content_for_product(self, product: Dict, problem: Dict, solution: Dict) -> Optional[Dict]:
        """Generate editorial content for a product."""
        try:
            # Create prompt for Claude
            prompt = self._create_content_prompt(product, problem, solution)
            
            # Get response from Claude
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.4,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse response
            content_data = json.loads(response.content[0].text)
            
            # Process and validate content
            content = self._process_content_data(content_data, product, problem)
            
            logger.debug(f"Generated content for product {product['id']}")
            return content
            
        except Exception as e:
            logger.error(f"Failed to generate content for product {product['id']}: {e}")
            return None
    
    def _create_content_prompt(self, product: Dict, problem: Dict, solution: Dict) -> str:
        """Create prompt for Claude to generate editorial content."""
        product_name = product.get('product_name', '')
        brand = product.get('brand', '')
        price = product.get('price', 0)
        problem_text = problem.get('problem_text', '')
        solution_description = solution.get('solution_description', '')
        trend_score = product.get('trend_score', 5.0)
        
        return f"""
Generate engaging editorial content for this trending furniture product:

PRODUCT: {product_name} by {brand}
PRICE: ${price}
TREND SCORE: {trend_score}/10

PROBLEM IT SOLVES: {problem_text}
SOLUTION APPROACH: {solution_description}

Generate content that includes:

1. EDITORIAL CONTENT (150-200 words):
   - Why this product is trending right now
   - How it solves the specific problem
   - Who would benefit most from this product
   - Any unique features or benefits
   - Write in a conversational, helpful tone

2. WHY IT'S TRENDING (50-75 words):
   - Specific reasons for current popularity
   - Market trends it addresses
   - Social media buzz or influences

3. REALISTIC USER QUOTE (30-50 words):
   - Sound like a real person who owns this product
   - Mention the specific problem it solved for them
   - Include a minor realistic detail or context
   - Should feel authentic, not overly promotional

Return ONLY valid JSON in this exact format:
{{
    "editorial_content": "Engaging editorial content about the product...",
    "why_trending": "Specific reasons why this product is trending now...",
    "user_quote": "Quote from a satisfied customer about how it solved their problem...",
    "content_quality_score": 8.5,
    "target_audience": "young professionals",
    "key_benefits": ["space-saving", "easy installation", "stylish design"],
    "seasonal_relevance": "high|medium|low"
}}
"""
    
    def _process_content_data(self, content_data: Dict, product: Dict, problem: Dict) -> Optional[Dict]:
        """Process and validate content data."""
        try:
            # Validate required fields
            if not content_data.get('editorial_content') or not content_data.get('why_trending'):
                return None
            
            # Quality threshold
            quality_score = content_data.get('content_quality_score', 0)
            if quality_score < 7.0:  # Only include high-quality content
                return None
            
            return {
                'product_id': product['id'],
                'problem_id': problem['id'],
                'editorial_content': content_data['editorial_content'].strip(),
                'why_trending': content_data['why_trending'].strip(),
                'user_quote': content_data.get('user_quote', '').strip(),
                'quality_score': float(quality_score),
                'target_audience': content_data.get('target_audience', ''),
                'key_benefits': content_data.get('key_benefits', []),
                'seasonal_relevance': content_data.get('seasonal_relevance', 'medium'),
                'created_at': datetime.now(),
                'approved': False  # Requires manual approval
            }
            
        except Exception as e:
            logger.warning(f"Failed to process content data: {e}")
            return None
    
    def save_content_to_database(self, content: Dict) -> Optional[int]:
        """Save generated content to database."""
        if not content:
            return None
        
        try:
            # Check if content already exists for this product
            existing_id = self._find_existing_content(content['product_id'], content['problem_id'])
            
            if existing_id:
                # Update existing content
                self._update_existing_content(existing_id, content)
                logger.debug(f"Updated existing content ID {existing_id}")
                return existing_id
            else:
                # Insert new content
                content_id = self._insert_new_content(content)
                logger.debug(f"Inserted new content ID {content_id}")
                return content_id
                
        except Exception as e:
            logger.error(f"Failed to save content: {e}")
            return None
    
    def _find_existing_content(self, product_id: int, problem_id: int) -> Optional[int]:
        """Find existing content for this product-problem combination."""
        query = """
            SELECT id FROM content_snippets 
            WHERE product_id = %s AND problem_id = %s
            LIMIT 1
        """
        
        result = db.fetch_one(query, (product_id, problem_id))
        return result[0] if result else None
    
    def _update_existing_content(self, content_id: int, content_data: Dict):
        """Update existing content with new version."""
        query = """
            UPDATE content_snippets 
            SET editorial_content = %s, why_trending = %s, user_quote = %s,
                quality_score = %s, created_at = NOW(), approved = FALSE
            WHERE id = %s
        """
        
        data = (
            content_data['editorial_content'],
            content_data['why_trending'],
            content_data['user_quote'],
            content_data['quality_score'],
            content_id
        )
        
        db.execute(query, data)
    
    def _insert_new_content(self, content_data: Dict) -> int:
        """Insert new content into database."""
        query = """
            INSERT INTO content_snippets 
            (product_id, problem_id, editorial_content, why_trending, user_quote,
             quality_score, created_at, approved)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        data = (
            content_data['product_id'],
            content_data['problem_id'],
            content_data['editorial_content'],
            content_data['why_trending'],
            content_data['user_quote'],
            content_data['quality_score'],
            content_data['created_at'],
            content_data['approved']
        )
        
        result = db.fetch_one(query, data)
        return result[0] if result else None
    
    def process_products_without_content(self, limit: int = 30) -> Dict:
        """Process products that don't have editorial content yet."""
        logger.info(f"Processing up to {limit} products without content")
        
        # Get products without content
        query = """
            SELECT 
                p.id, p.product_name, p.brand, p.price, p.trend_score,
                pr.id as problem_id, pr.problem_text, pr.problem_category,
                s.id as solution_id, s.solution_description, s.solution_type
            FROM products p
            JOIN solutions s ON p.solution_id = s.id
            JOIN problems pr ON s.problem_id = pr.id
            LEFT JOIN content_snippets cs ON p.id = cs.product_id
            WHERE p.active = TRUE 
            AND pr.active = TRUE
            AND p.trend_score >= 6.0
            AND cs.id IS NULL
            ORDER BY p.trend_score DESC, p.rating DESC
            LIMIT %s
        """
        
        products = db.fetch_all(query, (limit,))
        if not products:
            logger.info("No products without content found")
            return {'products_processed': 0, 'content_generated': 0}
        
        processed_count = 0
        content_count = 0
        
        for product_row in products:
            try:
                # Convert row to dict
                product = {
                    'id': product_row[0],
                    'product_name': product_row[1],
                    'brand': product_row[2],
                    'price': float(product_row[3]) if product_row[3] else 0,
                    'trend_score': float(product_row[4]) if product_row[4] else 5.0
                }
                
                problem = {
                    'id': product_row[5],
                    'problem_text': product_row[6],
                    'problem_category': product_row[7]
                }
                
                solution = {
                    'id': product_row[8],
                    'solution_description': product_row[9],
                    'solution_type': product_row[10]
                }
                
                # Generate content
                content = self.generate_content_for_product(product, problem, solution)
                
                # Save content
                if content:
                    content_id = self.save_content_to_database(content)
                    if content_id:
                        content_count += 1
                
                processed_count += 1
                logger.debug(f"Processed product {product['id']}")
                
            except Exception as e:
                logger.error(f"Failed to process product {product_row[0]}: {e}")
                continue
        
        result = {
            'products_processed': processed_count,
            'content_generated': content_count
        }
        
        logger.info(f"Content generation complete: {result}")
        return result
    
    def generate_trending_summaries(self, limit: int = 10) -> Dict:
        """Generate trending product summaries for different categories."""
        logger.info("Generating trending summaries by category")
        
        # Get top trending products by category
        query = """
            SELECT 
                pr.problem_category,
                p.id, p.product_name, p.brand, p.trend_score,
                cs.editorial_content, cs.why_trending
            FROM products p
            JOIN solutions s ON p.solution_id = s.id
            JOIN problems pr ON s.problem_id = pr.id
            JOIN content_snippets cs ON p.id = cs.product_id
            WHERE p.active = TRUE AND pr.active = TRUE
            AND cs.approved = TRUE
            ORDER BY pr.problem_category, p.trend_score DESC
        """
        
        results = db.fetch_all(query)
        
        # Group by category
        categories = {}
        for row in results:
            category = row[0]
            if category not in categories:
                categories[category] = []
            
            if len(categories[category]) < limit:  # Limit per category
                categories[category].append({
                    'product_id': row[1],
                    'product_name': row[2],
                    'brand': row[3],
                    'trend_score': float(row[4]) if row[4] else 0,
                    'editorial_content': row[5],
                    'why_trending': row[6]
                })
        
        return categories
    
    def approve_content_batch(self, quality_threshold: float = 8.0) -> int:
        """Auto-approve high-quality content above threshold."""
        logger.info(f"Auto-approving content with quality score >= {quality_threshold}")
        
        query = """
            UPDATE content_snippets 
            SET approved = TRUE 
            WHERE quality_score >= %s 
            AND approved = FALSE
            RETURNING id
        """
        
        try:
            results = db.fetch_all(query, (quality_threshold,))
            approved_count = len(results)
            logger.info(f"Auto-approved {approved_count} content snippets")
            return approved_count
        except Exception as e:
            logger.error(f"Failed to auto-approve content: {e}")
            return 0
    
    def get_content_summary(self) -> Dict:
        """Get summary of generated content."""
        query = """
            SELECT 
                pr.problem_category,
                COUNT(*) as content_count,
                AVG(cs.quality_score) as avg_quality,
                SUM(CASE WHEN cs.approved = TRUE THEN 1 ELSE 0 END) as approved_count
            FROM content_snippets cs
            JOIN products p ON cs.product_id = p.id
            JOIN solutions s ON p.solution_id = s.id
            JOIN problems pr ON s.problem_id = pr.id
            WHERE p.active = TRUE
            GROUP BY pr.problem_category
            ORDER BY content_count DESC
        """
        
        results = db.fetch_all(query)
        
        summary = {
            'total_content': sum(row[1] for row in results),
            'total_approved': sum(row[3] for row in results),
            'by_category': {}
        }
        
        for row in results:
            category = row[0]
            summary['by_category'][category] = {
                'content_count': row[1],
                'avg_quality': float(row[2]) if row[2] else 0,
                'approved_count': row[3],
                'approval_rate': (row[3] / row[1] * 100) if row[1] > 0 else 0
            }
        
        return summary


def main():
    """Run content generation for products without content."""
    generator = ContentGenerator()
    
    # Process products without content
    result = generator.process_products_without_content(limit=15)
    print(f"✓ Processed {result['products_processed']} products")
    print(f"✓ Generated {result['content_generated']} content snippets")
    
    # Auto-approve high-quality content
    approved_count = generator.approve_content_batch(quality_threshold=8.0)
    print(f"✓ Auto-approved {approved_count} high-quality content snippets")
    
    # Show summary
    summary = generator.get_content_summary()
    print(f"\nContent Summary:")
    print(f"Total content: {summary['total_content']}")
    print(f"Approved content: {summary['total_approved']} ({summary['total_approved']/max(summary['total_content'], 1)*100:.1f}%)")
    
    print("\nBy category:")
    for category, stats in summary['by_category'].items():
        print(f"  {category}: {stats['content_count']} pieces (quality {stats['avg_quality']:.1f}, {stats['approval_rate']:.1f}% approved)")


if __name__ == "__main__":
    main()