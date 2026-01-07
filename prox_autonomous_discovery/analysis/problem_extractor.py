"""Problem Extractor - Extract furniture/organization problems from social media posts."""
import logging
import json
from datetime import datetime
from typing import List, Dict, Optional
import anthropic
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class ProblemExtractor:
    """Extract furniture and organization problems from social media content using Claude API."""
    
    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-haiku-20241022"
        logger.info("Problem extractor initialized")
    
    def extract_problems_from_post(self, post: Dict) -> List[Dict]:
        """Extract problems from a single social media post."""
        try:
            # Create prompt for Claude
            prompt = self._create_extraction_prompt(post)
            
            # Get response from Claude
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=1000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse response
            problems_data = json.loads(response.content[0].text)
            
            # Process and validate problems
            problems = []
            for problem_data in problems_data.get('problems', []):
                problem = self._process_problem_data(problem_data, post)
                if problem:
                    problems.append(problem)
            
            logger.debug(f"Extracted {len(problems)} problems from post {post['post_id']}")
            return problems
            
        except Exception as e:
            logger.error(f"Failed to extract problems from post {post['post_id']}: {e}")
            return []
    
    def _create_extraction_prompt(self, post: Dict) -> str:
        """Create prompt for Claude to extract problems from post content."""
        content = post.get('content', '')
        title = post.get('title', '')
        platform = post.get('platform', '')
        
        return f"""
Analyze this {platform} post and extract specific furniture or organization problems mentioned or implied.

POST TITLE: {title}
POST CONTENT: {content}

Look for:
1. Explicit problems (complaints, frustrations, failures)
2. Space constraints (small spaces, awkward areas, lack of storage)
3. Organization challenges (clutter, disorganization, inefficient systems)
4. Furniture issues (assembly problems, sizing issues, quality concerns)
5. Storage problems (nowhere to put things, overflowing spaces)

For each problem found, determine:
- Problem description (clear, specific)
- Problem category (storage, space_constraint, organization, furniture_quality, assembly, budget)
- Confidence score (1-10, how certain this is a real problem)
- Urgency level (low/medium/high - how pressing this problem seems)

Return ONLY valid JSON in this exact format:
{{
    "problems": [
        {{
            "problem_text": "Clear description of the specific problem",
            "problem_category": "storage|space_constraint|organization|furniture_quality|assembly|budget",
            "confidence_score": 8,
            "urgency_level": "medium",
            "context_keywords": ["relevant", "keywords", "from", "post"]
        }}
    ]
}}

If no clear problems are found, return: {{"problems": []}}
"""
    
    def _process_problem_data(self, problem_data: Dict, post: Dict) -> Optional[Dict]:
        """Process and validate extracted problem data."""
        try:
            # Validate required fields
            if not problem_data.get('problem_text') or not problem_data.get('problem_category'):
                return None
            
            # Confidence threshold
            confidence = problem_data.get('confidence_score', 0)
            if confidence < 6:  # Only include high-confidence problems
                return None
            
            # Valid categories
            valid_categories = ['storage', 'space_constraint', 'organization', 'furniture_quality', 'assembly', 'budget']
            category = problem_data.get('problem_category')
            if category not in valid_categories:
                category = 'organization'  # Default fallback
            
            return {
                'problem_text': problem_data['problem_text'].strip(),
                'problem_category': category,
                'platform_mentions': 1,
                'trend_score': 5.0,  # Default, will be updated by trend scorer
                'source_platform': post.get('platform'),
                'source_post_id': post.get('post_id'),
                'confidence_score': confidence,
                'urgency_level': problem_data.get('urgency_level', 'medium'),
                'context_keywords': problem_data.get('context_keywords', []),
                'first_seen': datetime.now(),
                'last_updated': datetime.now(),
                'active': True
            }
            
        except Exception as e:
            logger.warning(f"Failed to process problem data: {e}")
            return None
    
    def save_problems_to_database(self, problems: List[Dict]) -> int:
        """Save extracted problems to database, handling duplicates."""
        if not problems:
            return 0
        
        saved_count = 0
        
        for problem in problems:
            try:
                # Check if similar problem already exists
                existing_id = self._find_similar_problem(problem['problem_text'], problem['problem_category'])
                
                if existing_id:
                    # Update existing problem
                    self._update_existing_problem(existing_id, problem)
                    logger.debug(f"Updated existing problem ID {existing_id}")
                else:
                    # Insert new problem
                    problem_id = self._insert_new_problem(problem)
                    logger.debug(f"Inserted new problem ID {problem_id}")
                
                saved_count += 1
                
            except Exception as e:
                logger.error(f"Failed to save problem '{problem['problem_text'][:50]}...': {e}")
        
        logger.info(f"Saved {saved_count} problems to database")
        return saved_count
    
    def _find_similar_problem(self, problem_text: str, category: str) -> Optional[int]:
        """Find similar existing problem using text similarity and category match."""
        query = """
            SELECT id, problem_text 
            FROM problems 
            WHERE problem_category = %s 
            AND active = TRUE
            AND similarity(problem_text, %s) > 0.6
            ORDER BY similarity(problem_text, %s) DESC
            LIMIT 1
        """
        
        try:
            result = db.fetch_one(query, (category, problem_text, problem_text))
            return result[0] if result else None
        except Exception:
            # If similarity extension not available, use simple text matching
            query_simple = """
                SELECT id FROM problems 
                WHERE problem_category = %s 
                AND active = TRUE
                AND LOWER(problem_text) LIKE LOWER(%s)
                LIMIT 1
            """
            result = db.fetch_one(query_simple, (category, f"%{problem_text[:30]}%"))
            return result[0] if result else None
    
    def _update_existing_problem(self, problem_id: int, problem_data: Dict):
        """Update existing problem with new mention."""
        query = """
            UPDATE problems 
            SET platform_mentions = platform_mentions + 1,
                last_updated = NOW()
            WHERE id = %s
        """
        db.execute(query, (problem_id,))
    
    def _insert_new_problem(self, problem_data: Dict) -> int:
        """Insert new problem into database."""
        query = """
            INSERT INTO problems 
            (problem_text, problem_category, platform_mentions, trend_score, 
             first_seen, last_updated, active)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        data = (
            problem_data['problem_text'],
            problem_data['problem_category'],
            problem_data['platform_mentions'],
            problem_data['trend_score'],
            problem_data['first_seen'],
            problem_data['last_updated'],
            problem_data['active']
        )
        
        result = db.fetch_one(query, data)
        return result[0] if result else None
    
    def process_unprocessed_posts(self, limit: int = 100) -> Dict:
        """Process unprocessed posts and extract problems."""
        logger.info(f"Processing up to {limit} unprocessed posts")
        
        # Get unprocessed posts
        query = """
            SELECT post_id, platform, title, content, author, url, created_at 
            FROM platform_posts 
            WHERE processed = FALSE 
            ORDER BY created_at DESC 
            LIMIT %s
        """
        
        posts = db.fetch_all(query, (limit,))
        if not posts:
            logger.info("No unprocessed posts found")
            return {'posts_processed': 0, 'problems_extracted': 0}
        
        total_problems = 0
        processed_posts = 0
        
        for post_row in posts:
            try:
                # Convert row to dict
                post = {
                    'post_id': post_row[0],
                    'platform': post_row[1],
                    'title': post_row[2],
                    'content': post_row[3],
                    'author': post_row[4],
                    'url': post_row[5],
                    'created_at': post_row[6]
                }
                
                # Extract problems
                problems = self.extract_problems_from_post(post)
                
                # Save problems
                if problems:
                    saved_count = self.save_problems_to_database(problems)
                    total_problems += saved_count
                
                # Mark post as processed
                self._mark_post_processed(post['post_id'])
                processed_posts += 1
                
                logger.debug(f"Processed post {post['post_id']}: {len(problems)} problems")
                
            except Exception as e:
                logger.error(f"Failed to process post {post_row[0]}: {e}")
                continue
        
        result = {
            'posts_processed': processed_posts,
            'problems_extracted': total_problems
        }
        
        logger.info(f"Processing complete: {result}")
        return result
    
    def _mark_post_processed(self, post_id: str):
        """Mark post as processed in database."""
        query = "UPDATE platform_posts SET processed = TRUE WHERE post_id = %s"
        db.execute(query, (post_id,))
    
    def get_problem_summary(self) -> Dict:
        """Get summary of extracted problems."""
        query = """
            SELECT 
                problem_category,
                COUNT(*) as count,
                AVG(platform_mentions) as avg_mentions,
                AVG(trend_score) as avg_trend_score
            FROM problems 
            WHERE active = TRUE
            GROUP BY problem_category
            ORDER BY count DESC
        """
        
        results = db.fetch_all(query)
        
        summary = {
            'total_problems': sum(row[1] for row in results),
            'categories': {}
        }
        
        for row in results:
            summary['categories'][row[0]] = {
                'count': row[1],
                'avg_mentions': float(row[2]) if row[2] else 0,
                'avg_trend_score': float(row[3]) if row[3] else 0
            }
        
        return summary


def main():
    """Run problem extraction on unprocessed posts."""
    extractor = ProblemExtractor()
    result = extractor.process_unprocessed_posts(limit=50)
    
    print(f"✓ Processed {result['posts_processed']} posts")
    print(f"✓ Extracted {result['problems_extracted']} problems")
    
    # Show summary
    summary = extractor.get_problem_summary()
    print(f"\nProblem Summary:")
    print(f"Total problems: {summary['total_problems']}")
    for category, stats in summary['categories'].items():
        print(f"  {category}: {stats['count']} problems (avg {stats['avg_mentions']:.1f} mentions)")


if __name__ == "__main__":
    main()