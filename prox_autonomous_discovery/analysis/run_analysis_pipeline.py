"""Analysis Pipeline - Orchestrate the complete AI analysis workflow."""
import logging
import time
from datetime import datetime
from typing import Dict, List
from config.settings import settings
from database.connection import db
from analysis.problem_extractor import ProblemExtractor
from analysis.solution_matcher import SolutionMatcher
from analysis.product_enricher import ProductEnricher
from analysis.content_generator import ContentGenerator
from analysis.trend_scorer import TrendScorer

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class AnalysisPipeline:
    """Orchestrate the complete AI analysis pipeline."""
    
    def __init__(self):
        self.problem_extractor = ProblemExtractor()
        self.solution_matcher = SolutionMatcher()
        self.product_enricher = ProductEnricher()
        self.content_generator = ContentGenerator()
        self.trend_scorer = TrendScorer()
        logger.info("Analysis pipeline initialized")
    
    def run_full_pipeline(self, 
                         post_limit: int = 100,
                         problem_limit: int = 50,
                         solution_limit: int = 50,
                         content_limit: int = 30) -> Dict:
        """Run the complete analysis pipeline."""
        logger.info("Starting full analysis pipeline")
        start_time = datetime.now()
        
        # Log pipeline start
        self._log_agent_action("analysis_pipeline", "start_full_pipeline", {
            "post_limit": post_limit,
            "problem_limit": problem_limit,
            "solution_limit": solution_limit,
            "content_limit": content_limit
        })
        
        results = {
            'pipeline_start': start_time,
            'steps': {}
        }
        
        try:
            # Step 1: Extract problems from unprocessed posts
            logger.info("Step 1: Extracting problems from posts")
            step_start = time.time()
            
            problem_result = self.problem_extractor.process_unprocessed_posts(limit=post_limit)
            
            results['steps']['problem_extraction'] = {
                'posts_processed': problem_result['posts_processed'],
                'problems_extracted': problem_result['problems_extracted'],
                'duration_seconds': time.time() - step_start
            }
            
            logger.info(f"✓ Step 1 complete: {problem_result['problems_extracted']} problems extracted")
            
            # Step 2: Generate solutions for unsolved problems
            logger.info("Step 2: Generating solutions for problems")
            step_start = time.time()
            
            solution_result = self.solution_matcher.process_unsolved_problems(limit=problem_limit)
            
            results['steps']['solution_matching'] = {
                'problems_processed': solution_result['problems_processed'],
                'solutions_generated': solution_result['solutions_generated'],
                'duration_seconds': time.time() - step_start
            }
            
            logger.info(f"✓ Step 2 complete: {solution_result['solutions_generated']} solutions generated")
            
            # Step 3: Find products for solutions
            logger.info("Step 3: Finding products for solutions")
            step_start = time.time()
            
            product_result = self.product_enricher.process_solutions_without_products(limit=solution_limit)
            
            results['steps']['product_enrichment'] = {
                'solutions_processed': product_result['solutions_processed'],
                'products_found': product_result['products_found'],
                'duration_seconds': time.time() - step_start
            }
            
            logger.info(f"✓ Step 3 complete: {product_result['products_found']} products found")
            
            # Step 4: Generate editorial content
            logger.info("Step 4: Generating editorial content")
            step_start = time.time()
            
            content_result = self.content_generator.process_products_without_content(limit=content_limit)
            
            results['steps']['content_generation'] = {
                'products_processed': content_result['products_processed'],
                'content_generated': content_result['content_generated'],
                'duration_seconds': time.time() - step_start
            }
            
            logger.info(f"✓ Step 4 complete: {content_result['content_generated']} content pieces generated")
            
            # Step 5: Calculate trend scores
            logger.info("Step 5: Updating trend scores")
            step_start = time.time()
            
            trend_result = self.trend_scorer.update_all_trend_scores()
            
            results['steps']['trend_scoring'] = {
                'problems_updated': trend_result['problems_updated'],
                'products_updated': trend_result['products_updated'],
                'trending_categories_count': trend_result['trending_categories_count'],
                'duration_seconds': time.time() - step_start
            }
            
            logger.info(f"✓ Step 5 complete: {trend_result['problems_updated']} problems and {trend_result['products_updated']} products scored")
            
            # Step 6: Quality scoring and cleanup
            logger.info("Step 6: Quality scoring and cleanup")
            step_start = time.time()
            
            cleanup_result = self._run_quality_scoring_and_cleanup()
            
            results['steps']['quality_cleanup'] = {
                **cleanup_result,
                'duration_seconds': time.time() - step_start
            }
            
            logger.info(f"✓ Step 6 complete: Quality scoring and cleanup finished")
            
            # Final results
            end_time = datetime.now()
            results['pipeline_end'] = end_time
            results['total_duration_seconds'] = (end_time - start_time).total_seconds()
            results['status'] = 'completed'
            
            # Log success
            self._log_agent_action("analysis_pipeline", "completed_full_pipeline", results)
            
            logger.info(f"✅ Full analysis pipeline complete in {results['total_duration_seconds']:.1f}s")
            return results
            
        except Exception as e:
            # Log failure
            results['status'] = 'failed'
            results['error'] = str(e)
            results['pipeline_end'] = datetime.now()
            
            self._log_agent_action("analysis_pipeline", "failed_full_pipeline", {
                "error": str(e),
                "results": results
            })
            
            logger.error(f"❌ Pipeline failed: {e}")
            raise
    
    def run_incremental_update(self, limit: int = 25) -> Dict:
        """Run incremental analysis for new data."""
        logger.info("Running incremental analysis update")
        start_time = datetime.now()
        
        results = {
            'update_start': start_time,
            'mode': 'incremental'
        }
        
        try:
            # Quick update cycle for new content
            problem_result = self.problem_extractor.process_unprocessed_posts(limit=limit)
            solution_result = self.solution_matcher.process_unsolved_problems(limit=limit//2)
            product_result = self.product_enricher.process_solutions_without_products(limit=limit//3)
            content_result = self.content_generator.process_products_without_content(limit=limit//4)
            
            # Update effectiveness and trend scores
            self.solution_matcher.update_solution_effectiveness()
            trend_result = self.trend_scorer.calculate_problem_trend_scores()
            
            results.update({
                'problems_extracted': problem_result['problems_extracted'],
                'solutions_generated': solution_result['solutions_generated'],
                'products_found': product_result['products_found'],
                'content_generated': content_result['content_generated'],
                'trend_updates': trend_result['problems_updated'],
                'update_end': datetime.now(),
                'status': 'completed'
            })
            
            logger.info("✅ Incremental update complete")
            return results
            
        except Exception as e:
            results['status'] = 'failed'
            results['error'] = str(e)
            logger.error(f"❌ Incremental update failed: {e}")
            raise
    
    def _run_quality_scoring_and_cleanup(self) -> Dict:
        """Run quality scoring and cleanup operations."""
        results = {}
        
        try:
            # Calculate product quality scores
            self.product_enricher.calculate_product_quality_scores()
            results['quality_scores_updated'] = True
            
            # Auto-approve high-quality content
            approved_count = self.content_generator.approve_content_batch(quality_threshold=8.0)
            results['content_approved'] = approved_count
            
            # Deactivate low-performing items (optional cleanup)
            cleanup_stats = self._cleanup_low_performers()
            results.update(cleanup_stats)
            
            return results
            
        except Exception as e:
            logger.error(f"Quality scoring failed: {e}")
            results['quality_scoring_error'] = str(e)
            return results
    
    def _cleanup_low_performers(self) -> Dict:
        """Clean up low-performing problems and products."""
        cleanup_stats = {
            'problems_deactivated': 0,
            'products_deactivated': 0
        }
        
        try:
            # Deactivate problems with very low trend scores and no recent activity
            problem_query = """
                UPDATE problems 
                SET active = FALSE 
                WHERE trend_score < 2.0 
                AND last_updated < NOW() - INTERVAL '30 days'
                AND platform_mentions = 1
                AND active = TRUE
            """
            
            problem_result = db.execute(problem_query)
            cleanup_stats['problems_deactivated'] = problem_result or 0
            
            # Deactivate products with very low scores and no engagement
            product_query = """
                UPDATE products 
                SET active = FALSE 
                WHERE trend_score < 2.0 
                AND quality_score < 3.0
                AND (rating < 3.0 OR rating IS NULL)
                AND active = TRUE
            """
            
            product_result = db.execute(product_query)
            cleanup_stats['products_deactivated'] = product_result or 0
            
            logger.info(f"Cleanup: deactivated {cleanup_stats['problems_deactivated']} problems, {cleanup_stats['products_deactivated']} products")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
            cleanup_stats['cleanup_error'] = str(e)
        
        return cleanup_stats
    
    def _log_agent_action(self, agent_name: str, action_type: str, details: Dict):
        """Log agent actions to database."""
        try:
            query = """
                INSERT INTO agent_logs (agent_name, action_type, details, result, created_at)
                VALUES (%s, %s, %s::jsonb, %s, NOW())
            """
            
            import json
            result = "success" if details.get('status') != 'failed' else "failed"
            db.execute(query, (agent_name, action_type, json.dumps(details), result))
            
        except Exception as e:
            logger.warning(f"Failed to log agent action: {e}")
    
    def get_pipeline_summary(self) -> Dict:
        """Get comprehensive summary of analysis pipeline results."""
        # Get problem summary
        problem_summary = self.problem_extractor.get_problem_summary()
        
        # Get solution summary
        solution_summary = self.solution_matcher.get_solution_summary()
        
        # Get product summary
        product_summary = self.product_enricher.get_product_summary()
        
        # Get content summary
        content_summary = self.content_generator.get_content_summary()
        
        # Get trend summary
        trend_summary = self.trend_scorer.get_trend_summary()
        
        # Get recent agent activity
        agent_activity = self._get_recent_agent_activity()
        
        return {
            'problems': problem_summary,
            'solutions': solution_summary,
            'products': product_summary,
            'content': content_summary,
            'trends': trend_summary,
            'agent_activity': agent_activity,
            'summary_generated': datetime.now()
        }
    
    def _get_recent_agent_activity(self) -> List[Dict]:
        """Get recent agent activity logs."""
        query = """
            SELECT agent_name, action_type, result, created_at
            FROM agent_logs
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            ORDER BY created_at DESC
            LIMIT 20
        """
        
        try:
            results = db.fetch_all(query)
            activity = []
            
            for row in results:
                activity.append({
                    'agent_name': row[0],
                    'action_type': row[1],
                    'result': row[2],
                    'created_at': row[3]
                })
            
            return activity
            
        except Exception as e:
            logger.error(f"Failed to get agent activity: {e}")
            return []
    
    def run_analysis_for_category(self, category: str, limit: int = 50) -> Dict:
        """Run targeted analysis for a specific problem category."""
        logger.info(f"Running targeted analysis for category: {category}")
        
        # This could be enhanced to focus on specific categories
        # For now, run standard pipeline with category logging
        results = self.run_incremental_update(limit=limit)
        results['target_category'] = category
        
        self._log_agent_action("analysis_pipeline", f"category_analysis_{category}", results)
        
        return results


def main():
    """Run the analysis pipeline."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run Prox Analysis Pipeline')
    parser.add_argument('--mode', choices=['full', 'incremental', 'summary'], 
                       default='incremental', help='Pipeline mode to run')
    parser.add_argument('--post-limit', type=int, default=100, 
                       help='Limit for posts to process (full mode)')
    parser.add_argument('--problem-limit', type=int, default=50,
                       help='Limit for problems to process (full mode)')
    parser.add_argument('--solution-limit', type=int, default=50,
                       help='Limit for solutions to process (full mode)')
    parser.add_argument('--content-limit', type=int, default=30,
                       help='Limit for content to generate (full mode)')
    parser.add_argument('--incremental-limit', type=int, default=25,
                       help='Limit for incremental updates')
    
    args = parser.parse_args()
    
    pipeline = AnalysisPipeline()
    
    if args.mode == 'full':
        print("🚀 Running full analysis pipeline...")
        result = pipeline.run_full_pipeline(
            post_limit=args.post_limit,
            problem_limit=args.problem_limit,
            solution_limit=args.solution_limit,
            content_limit=args.content_limit
        )
        
        print(f"\n📊 Pipeline Results:")
        print(f"Duration: {result['total_duration_seconds']:.1f} seconds")
        for step, data in result['steps'].items():
            print(f"  {step}: {data}")
    
    elif args.mode == 'incremental':
        print("🔄 Running incremental analysis update...")
        result = pipeline.run_incremental_update(limit=args.incremental_limit)
        
        print(f"\n📈 Update Results:")
        print(f"Problems extracted: {result.get('problems_extracted', 0)}")
        print(f"Solutions generated: {result.get('solutions_generated', 0)}")
        print(f"Products found: {result.get('products_found', 0)}")
        print(f"Content generated: {result.get('content_generated', 0)}")
        print(f"Trend updates: {result.get('trend_updates', 0)}")
    
    elif args.mode == 'summary':
        print("📋 Generating analysis summary...")
        summary = pipeline.get_pipeline_summary()
        
        print(f"\n📊 Analysis Summary:")
        print(f"Total problems: {summary['problems']['total_problems']}")
        print(f"Total products: {summary['products']['total_products']}")
        print(f"Total content: {summary['content']['total_content']}")
        print(f"Approved content: {summary['content']['total_approved']}")
        
        print(f"\n🔥 Trending Categories:")
        for category, stats in summary['problems']['categories'].items():
            print(f"  {category}: {stats['count']} problems (avg {stats['avg_trend_score']:.1f} score)")
    
    print("✅ Analysis pipeline complete!")


if __name__ == "__main__":
    main()