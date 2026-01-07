"""Solution Matcher - Match furniture/organization solutions to identified problems."""
import logging
import json
from datetime import datetime
from typing import List, Dict, Optional
import anthropic
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class SolutionMatcher:
    """Match solutions to furniture and organization problems using Claude API."""
    
    def __init__(self):
        self.claude = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = "claude-3-5-haiku-20241022"
        logger.info("Solution matcher initialized")
    
    def generate_solutions_for_problem(self, problem: Dict) -> List[Dict]:
        """Generate solutions for a specific problem."""
        try:
            # Create prompt for Claude
            prompt = self._create_solution_prompt(problem)
            
            # Get response from Claude
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=1500,
                temperature=0.3,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Parse response
            solutions_data = json.loads(response.content[0].text)
            
            # Process and validate solutions
            solutions = []
            for solution_data in solutions_data.get('solutions', []):
                solution = self._process_solution_data(solution_data, problem)
                if solution:
                    solutions.append(solution)
            
            logger.debug(f"Generated {len(solutions)} solutions for problem {problem['id']}")
            return solutions
            
        except Exception as e:
            logger.error(f"Failed to generate solutions for problem {problem['id']}: {e}")
            return []
    
    def _create_solution_prompt(self, problem: Dict) -> str:
        """Create prompt for Claude to generate solutions."""
        problem_text = problem.get('problem_text', '')
        category = problem.get('problem_category', '')
        mentions = problem.get('platform_mentions', 1)
        
        return f"""
Generate practical, actionable solutions for this furniture/organization problem:

PROBLEM: {problem_text}
CATEGORY: {category}
POPULARITY: {mentions} mentions across social media

Generate 2-4 specific solutions that:
1. Directly address this problem
2. Are practical and implementable
3. Consider different budget ranges when relevant
4. Include specific product types or approaches

For each solution, provide:
- Clear description of the solution approach
- Solution type (furniture, organizational_system, space_optimization, storage_solution, diy_hack, professional_service)
- Effectiveness score (1-10, how well this solves the problem)
- Implementation difficulty (easy/medium/hard)
- Estimated budget range (budget/mid_range/premium)
- Product keywords for affiliate search

Return ONLY valid JSON in this exact format:
{{
    "solutions": [
        {{
            "solution_description": "Detailed description of the solution approach",
            "solution_type": "furniture|organizational_system|space_optimization|storage_solution|diy_hack|professional_service",
            "effectiveness_score": 8.5,
            "implementation_difficulty": "easy|medium|hard",
            "budget_range": "budget|mid_range|premium",
            "product_keywords": ["specific", "product", "search", "terms"],
            "target_spaces": ["bedroom", "kitchen", "living room"],
            "additional_benefits": ["space saving", "aesthetic improvement"]
        }}
    ]
}}
"""
    
    def _process_solution_data(self, solution_data: Dict, problem: Dict) -> Optional[Dict]:
        """Process and validate solution data."""
        try:
            # Validate required fields
            if not solution_data.get('solution_description') or not solution_data.get('solution_type'):
                return None
            
            # Validate effectiveness score
            effectiveness = solution_data.get('effectiveness_score', 0)
            if effectiveness < 6:  # Only include high-effectiveness solutions
                return None
            
            # Valid solution types
            valid_types = [
                'furniture', 'organizational_system', 'space_optimization', 
                'storage_solution', 'diy_hack', 'professional_service'
            ]
            solution_type = solution_data.get('solution_type')
            if solution_type not in valid_types:
                solution_type = 'organizational_system'  # Default fallback
            
            return {
                'problem_id': problem['id'],
                'solution_description': solution_data['solution_description'].strip(),
                'solution_type': solution_type,
                'effectiveness_score': float(effectiveness),
                'mention_count': 1,
                'implementation_difficulty': solution_data.get('implementation_difficulty', 'medium'),
                'budget_range': solution_data.get('budget_range', 'mid_range'),
                'product_keywords': solution_data.get('product_keywords', []),
                'target_spaces': solution_data.get('target_spaces', []),
                'additional_benefits': solution_data.get('additional_benefits', []),
                'created_at': datetime.now()
            }
            
        except Exception as e:
            logger.warning(f"Failed to process solution data: {e}")
            return None
    
    def save_solutions_to_database(self, solutions: List[Dict]) -> int:
        """Save solutions to database, handling duplicates."""
        if not solutions:
            return 0
        
        saved_count = 0
        
        for solution in solutions:
            try:
                # Check if similar solution already exists for this problem
                existing_id = self._find_similar_solution(
                    solution['problem_id'], 
                    solution['solution_description'], 
                    solution['solution_type']
                )
                
                if existing_id:
                    # Update existing solution
                    self._update_existing_solution(existing_id)
                    logger.debug(f"Updated existing solution ID {existing_id}")
                else:
                    # Insert new solution
                    solution_id = self._insert_new_solution(solution)
                    logger.debug(f"Inserted new solution ID {solution_id}")
                
                saved_count += 1
                
            except Exception as e:
                logger.error(f"Failed to save solution '{solution['solution_description'][:50]}...': {e}")
        
        logger.info(f"Saved {saved_count} solutions to database")
        return saved_count
    
    def _find_similar_solution(self, problem_id: int, description: str, solution_type: str) -> Optional[int]:
        """Find similar existing solution for the same problem."""
        query = """
            SELECT id FROM solutions 
            WHERE problem_id = %s 
            AND solution_type = %s
            AND LOWER(solution_description) LIKE LOWER(%s)
            LIMIT 1
        """
        
        # Use first 50 characters for similarity matching
        description_sample = description[:50]
        result = db.fetch_one(query, (problem_id, solution_type, f"%{description_sample}%"))
        return result[0] if result else None
    
    def _update_existing_solution(self, solution_id: int):
        """Update existing solution with new mention."""
        query = """
            UPDATE solutions 
            SET mention_count = mention_count + 1,
                created_at = NOW()
            WHERE id = %s
        """
        db.execute(query, (solution_id,))
    
    def _insert_new_solution(self, solution_data: Dict) -> int:
        """Insert new solution into database."""
        query = """
            INSERT INTO solutions 
            (problem_id, solution_description, solution_type, effectiveness_score, 
             mention_count, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        data = (
            solution_data['problem_id'],
            solution_data['solution_description'],
            solution_data['solution_type'],
            solution_data['effectiveness_score'],
            solution_data['mention_count'],
            solution_data['created_at']
        )
        
        result = db.fetch_one(query, data)
        return result[0] if result else None
    
    def process_unsolved_problems(self, limit: int = 50) -> Dict:
        """Process problems that don't have solutions yet."""
        logger.info(f"Processing up to {limit} unsolved problems")
        
        # Get problems without solutions
        query = """
            SELECT p.id, p.problem_text, p.problem_category, p.platform_mentions, p.trend_score
            FROM problems p
            LEFT JOIN solutions s ON p.id = s.problem_id
            WHERE p.active = TRUE 
            AND s.id IS NULL
            ORDER BY p.platform_mentions DESC, p.trend_score DESC
            LIMIT %s
        """
        
        problems = db.fetch_all(query, (limit,))
        if not problems:
            logger.info("No unsolved problems found")
            return {'problems_processed': 0, 'solutions_generated': 0}
        
        total_solutions = 0
        processed_problems = 0
        
        for problem_row in problems:
            try:
                # Convert row to dict
                problem = {
                    'id': problem_row[0],
                    'problem_text': problem_row[1],
                    'problem_category': problem_row[2],
                    'platform_mentions': problem_row[3],
                    'trend_score': float(problem_row[4]) if problem_row[4] else 5.0
                }
                
                # Generate solutions
                solutions = self.generate_solutions_for_problem(problem)
                
                # Save solutions
                if solutions:
                    saved_count = self.save_solutions_to_database(solutions)
                    total_solutions += saved_count
                
                processed_problems += 1
                logger.debug(f"Processed problem {problem['id']}: {len(solutions)} solutions")
                
            except Exception as e:
                logger.error(f"Failed to process problem {problem_row[0]}: {e}")
                continue
        
        result = {
            'problems_processed': processed_problems,
            'solutions_generated': total_solutions
        }
        
        logger.info(f"Solution matching complete: {result}")
        return result
    
    def update_solution_effectiveness(self, limit: int = 100):
        """Update effectiveness scores based on solution popularity."""
        logger.info("Updating solution effectiveness scores")
        
        query = """
            UPDATE solutions 
            SET effectiveness_score = LEAST(10.0, effectiveness_score + (mention_count * 0.1))
            WHERE mention_count > 1
        """
        
        try:
            db.execute(query)
            logger.info("Solution effectiveness scores updated")
        except Exception as e:
            logger.error(f"Failed to update effectiveness scores: {e}")
    
    def get_solution_summary(self) -> Dict:
        """Get summary of generated solutions."""
        query = """
            SELECT 
                s.solution_type,
                COUNT(*) as count,
                AVG(s.effectiveness_score) as avg_effectiveness,
                AVG(s.mention_count) as avg_mentions,
                p.problem_category
            FROM solutions s
            JOIN problems p ON s.problem_id = p.id
            WHERE p.active = TRUE
            GROUP BY s.solution_type, p.problem_category
            ORDER BY count DESC
        """
        
        results = db.fetch_all(query)
        
        summary = {
            'total_solutions': len(results),
            'by_type': {},
            'by_problem_category': {}
        }
        
        for row in results:
            solution_type = row[0]
            count = row[1]
            avg_effectiveness = float(row[2]) if row[2] else 0
            avg_mentions = float(row[3]) if row[3] else 0
            problem_category = row[4]
            
            if solution_type not in summary['by_type']:
                summary['by_type'][solution_type] = {
                    'count': 0,
                    'avg_effectiveness': 0,
                    'avg_mentions': 0
                }
            
            summary['by_type'][solution_type]['count'] += count
            summary['by_type'][solution_type]['avg_effectiveness'] = avg_effectiveness
            summary['by_type'][solution_type]['avg_mentions'] = avg_mentions
            
            if problem_category not in summary['by_problem_category']:
                summary['by_problem_category'][problem_category] = 0
            summary['by_problem_category'][problem_category] += count
        
        return summary
    
    def get_top_solutions(self, limit: int = 20) -> List[Dict]:
        """Get top solutions by effectiveness and popularity."""
        query = """
            SELECT 
                s.id, s.solution_description, s.solution_type, s.effectiveness_score,
                s.mention_count, p.problem_text, p.problem_category
            FROM solutions s
            JOIN problems p ON s.problem_id = p.id
            WHERE p.active = TRUE
            ORDER BY (s.effectiveness_score * s.mention_count) DESC
            LIMIT %s
        """
        
        results = db.fetch_all(query, (limit,))
        
        solutions = []
        for row in results:
            solutions.append({
                'id': row[0],
                'solution_description': row[1],
                'solution_type': row[2],
                'effectiveness_score': float(row[3]) if row[3] else 0,
                'mention_count': row[4],
                'problem_text': row[5],
                'problem_category': row[6]
            })
        
        return solutions


def main():
    """Run solution matching for unsolved problems."""
    matcher = SolutionMatcher()
    
    # Process unsolved problems
    result = matcher.process_unsolved_problems(limit=25)
    print(f"✓ Processed {result['problems_processed']} problems")
    print(f"✓ Generated {result['solutions_generated']} solutions")
    
    # Update effectiveness scores
    matcher.update_solution_effectiveness()
    print("✓ Updated solution effectiveness scores")
    
    # Show summary
    summary = matcher.get_solution_summary()
    print(f"\nSolution Summary:")
    print(f"Total solutions: {summary['total_solutions']}")
    
    print("\nBy solution type:")
    for solution_type, stats in summary['by_type'].items():
        print(f"  {solution_type}: {stats['count']} (avg effectiveness {stats['avg_effectiveness']:.1f})")
    
    # Show top solutions
    top_solutions = matcher.get_top_solutions(5)
    print(f"\nTop 5 Solutions:")
    for i, solution in enumerate(top_solutions, 1):
        print(f"{i}. {solution['solution_type']}: {solution['solution_description'][:80]}...")
        print(f"   Effectiveness: {solution['effectiveness_score']:.1f}, Mentions: {solution['mention_count']}")


if __name__ == "__main__":
    main()