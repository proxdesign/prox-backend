"""Trend Scorer - Calculate trend scores for problems, solutions, and products."""
import logging
import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class TrendScorer:
    """Calculate and update trend scores based on social signals and engagement."""
    
    def __init__(self):
        logger.info("Trend scorer initialized")
    
    def calculate_problem_trend_scores(self) -> Dict:
        """Calculate trend scores for problems based on mentions and recency."""
        logger.info("Calculating problem trend scores")
        
        # Get problem data for scoring
        query = """
            SELECT 
                p.id,
                p.platform_mentions,
                p.first_seen,
                p.last_updated,
                COUNT(DISTINCT pp.post_id) as recent_posts,
                AVG(
                    CASE 
                        WHEN pp.engagement_data->>'like_count' IS NOT NULL THEN 
                            CAST(pp.engagement_data->>'like_count' AS INTEGER)
                        WHEN pp.engagement_data->>'save_count' IS NOT NULL THEN 
                            CAST(pp.engagement_data->>'save_count' AS INTEGER)
                        WHEN pp.engagement_data->>'play_count' IS NOT NULL THEN 
                            CAST(pp.engagement_data->>'play_count' AS INTEGER) / 100
                        ELSE 1
                    END
                ) as avg_engagement
            FROM problems p
            LEFT JOIN solutions s ON p.id = s.problem_id
            LEFT JOIN products pr ON s.id = pr.solution_id
            LEFT JOIN platform_posts pp ON (
                pp.content ILIKE '%' || SPLIT_PART(p.problem_text, ' ', 1) || '%' 
                OR pp.title ILIKE '%' || SPLIT_PART(p.problem_text, ' ', 1) || '%'
            )
            WHERE p.active = TRUE
            AND pp.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY p.id, p.platform_mentions, p.first_seen, p.last_updated
        """
        
        problems = db.fetch_all(query)
        updated_count = 0
        
        for problem_row in problems:
            try:
                problem_id = problem_row[0]
                mentions = problem_row[1] or 1
                first_seen = problem_row[2]
                last_updated = problem_row[3]
                recent_posts = problem_row[4] or 0
                avg_engagement = float(problem_row[5]) if problem_row[5] else 1.0
                
                # Calculate trend score
                trend_score = self._calculate_problem_trend_score(
                    mentions, first_seen, last_updated, recent_posts, avg_engagement
                )
                
                # Update problem with new trend score
                self._update_problem_trend_score(problem_id, trend_score)
                updated_count += 1
                
            except Exception as e:
                logger.error(f"Failed to calculate trend score for problem {problem_row[0]}: {e}")
                continue
        
        logger.info(f"Updated trend scores for {updated_count} problems")
        return {'problems_updated': updated_count}
    
    def _calculate_problem_trend_score(
        self, 
        mentions: int, 
        first_seen: datetime, 
        last_updated: datetime,
        recent_posts: int,
        avg_engagement: float
    ) -> float:
        """Calculate trend score for a problem."""
        try:
            # Base score from mentions (30% weight)
            mention_score = min(10.0, math.log(mentions + 1) * 2.0)
            
            # Recency factor (25% weight)
            days_since_first_seen = (datetime.now() - first_seen).days
            days_since_last_updated = (datetime.now() - last_updated).days
            
            # Problems are trending if they're new or recently active
            recency_score = 10.0 * math.exp(-days_since_last_updated / 14.0)  # Decay over 2 weeks
            newness_bonus = 2.0 if days_since_first_seen <= 7 else 0  # Boost for new problems
            
            # Social momentum (25% weight) 
            momentum_score = min(10.0, math.log(recent_posts + 1) * 1.5)
            
            # Engagement quality (20% weight)
            engagement_score = min(10.0, math.log(avg_engagement + 1) * 1.2)
            
            # Calculate weighted average
            trend_score = (
                mention_score * 0.30 +
                (recency_score + newness_bonus) * 0.25 +
                momentum_score * 0.25 +
                engagement_score * 0.20
            )
            
            return min(10.0, max(1.0, trend_score))
            
        except Exception as e:
            logger.warning(f"Error calculating problem trend score: {e}")
            return 5.0  # Default score
    
    def _update_problem_trend_score(self, problem_id: int, trend_score: float):
        """Update problem trend score in database."""
        query = """
            UPDATE problems 
            SET trend_score = %s, last_updated = NOW()
            WHERE id = %s
        """
        db.execute(query, (trend_score, problem_id))
    
    def calculate_product_trend_scores(self) -> Dict:
        """Calculate trend scores for products based on problem trends and product metrics."""
        logger.info("Calculating product trend scores")
        
        # Get product data for scoring
        query = """
            SELECT 
                p.id,
                p.price,
                p.rating,
                p.review_count,
                p.quality_score,
                pr.trend_score as problem_trend_score,
                s.effectiveness_score,
                s.mention_count as solution_mentions,
                ap.commission_rate
            FROM products p
            JOIN solutions s ON p.solution_id = s.id
            JOIN problems pr ON s.problem_id = pr.id
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.active = TRUE AND pr.active = TRUE
        """
        
        products = db.fetch_all(query)
        updated_count = 0
        
        for product_row in products:
            try:
                product_id = product_row[0]
                price = float(product_row[1]) if product_row[1] else 0
                rating = float(product_row[2]) if product_row[2] else 3.0
                review_count = product_row[3] or 0
                quality_score = float(product_row[4]) if product_row[4] else 5.0
                problem_trend_score = float(product_row[5]) if product_row[5] else 5.0
                effectiveness_score = float(product_row[6]) if product_row[6] else 5.0
                solution_mentions = product_row[7] or 1
                commission_rate = float(product_row[8]) if product_row[8] else 3.0
                
                # Calculate trend score
                trend_score = self._calculate_product_trend_score(
                    price, rating, review_count, quality_score,
                    problem_trend_score, effectiveness_score, solution_mentions
                )
                
                # Update product with new trend score
                self._update_product_trend_score(product_id, trend_score)
                updated_count += 1
                
            except Exception as e:
                logger.error(f"Failed to calculate trend score for product {product_row[0]}: {e}")
                continue
        
        logger.info(f"Updated trend scores for {updated_count} products")
        return {'products_updated': updated_count}
    
    def _calculate_product_trend_score(
        self,
        price: float,
        rating: float,
        review_count: int,
        quality_score: float,
        problem_trend_score: float,
        effectiveness_score: float,
        solution_mentions: int
    ) -> float:
        """Calculate trend score for a product."""
        try:
            # Problem trend inheritance (35% weight)
            problem_influence = problem_trend_score * 0.35
            
            # Solution effectiveness (25% weight)
            solution_influence = effectiveness_score * 0.25
            
            # Product quality metrics (25% weight)
            rating_score = (rating / 5.0) * 10.0  # Convert 5-star to 10-point scale
            review_popularity = min(10.0, math.log(review_count + 1) * 1.5)
            quality_influence = (rating_score * 0.6 + review_popularity * 0.4) * 0.25
            
            # Price attractiveness (15% weight)
            # Sweet spot around $20-100, penalties for very cheap or very expensive
            if price == 0:
                price_score = 5.0  # Neutral for unknown price
            elif price < 10:
                price_score = 3.0  # Possibly too cheap/low quality
            elif price <= 50:
                price_score = 9.0  # Sweet spot
            elif price <= 200:
                price_score = 7.0  # Still good
            elif price <= 500:
                price_score = 5.0  # Getting expensive
            else:
                price_score = 3.0  # Very expensive
            
            price_influence = price_score * 0.15
            
            # Calculate weighted average
            base_score = (
                problem_influence + 
                solution_influence + 
                quality_influence + 
                price_influence
            )
            
            # Apply solution mention boost (up to +1.0)
            mention_boost = min(1.0, math.log(solution_mentions + 1) * 0.3)
            
            trend_score = base_score + mention_boost
            
            return min(10.0, max(1.0, trend_score))
            
        except Exception as e:
            logger.warning(f"Error calculating product trend score: {e}")
            return 5.0  # Default score
    
    def _update_product_trend_score(self, product_id: int, trend_score: float):
        """Update product trend score in database."""
        query = """
            UPDATE products 
            SET trend_score = %s, last_checked = NOW()
            WHERE id = %s
        """
        db.execute(query, (trend_score, product_id))
    
    def identify_trending_categories(self) -> List[Dict]:
        """Identify which problem categories are trending."""
        logger.info("Identifying trending categories")
        
        query = """
            SELECT 
                problem_category,
                COUNT(*) as problem_count,
                AVG(trend_score) as avg_trend_score,
                SUM(platform_mentions) as total_mentions,
                MAX(trend_score) as max_trend_score
            FROM problems 
            WHERE active = TRUE 
            AND last_updated >= NOW() - INTERVAL '7 days'
            GROUP BY problem_category
            HAVING AVG(trend_score) > 6.0
            ORDER BY avg_trend_score DESC, total_mentions DESC
        """
        
        results = db.fetch_all(query)
        
        trending_categories = []
        for row in results:
            trending_categories.append({
                'category': row[0],
                'problem_count': row[1],
                'avg_trend_score': float(row[2]) if row[2] else 0,
                'total_mentions': row[3] or 0,
                'max_trend_score': float(row[4]) if row[4] else 0
            })
        
        logger.info(f"Found {len(trending_categories)} trending categories")
        return trending_categories
    
    def get_trending_products_by_category(self, limit_per_category: int = 5) -> Dict:
        """Get top trending products for each category."""
        query = """
            SELECT 
                pr.problem_category,
                p.id,
                p.product_name,
                p.brand,
                p.price,
                p.trend_score,
                p.rating,
                ap.partner_name
            FROM products p
            JOIN solutions s ON p.solution_id = s.id
            JOIN problems pr ON s.problem_id = pr.id
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            WHERE p.active = TRUE 
            AND pr.active = TRUE
            AND p.trend_score >= 6.0
            ORDER BY pr.problem_category, p.trend_score DESC
        """
        
        results = db.fetch_all(query)
        
        # Group by category and limit per category
        trending_by_category = {}
        for row in results:
            category = row[0]
            if category not in trending_by_category:
                trending_by_category[category] = []
            
            if len(trending_by_category[category]) < limit_per_category:
                trending_by_category[category].append({
                    'product_id': row[1],
                    'product_name': row[2],
                    'brand': row[3],
                    'price': float(row[4]) if row[4] else 0,
                    'trend_score': float(row[5]) if row[5] else 0,
                    'rating': float(row[6]) if row[6] else 0,
                    'partner': row[7]
                })
        
        return trending_by_category
    
    def calculate_trend_momentum(self) -> Dict:
        """Calculate trend momentum (rate of change in trend scores)."""
        logger.info("Calculating trend momentum")
        
        # This would compare trend scores over time
        # For now, return basic momentum based on recent activity
        query = """
            SELECT 
                'problems' as type,
                COUNT(*) as total,
                COUNT(CASE WHEN last_updated >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
                COUNT(CASE WHEN last_updated >= NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
                AVG(trend_score) as avg_score
            FROM problems WHERE active = TRUE
            
            UNION ALL
            
            SELECT 
                'products' as type,
                COUNT(*) as total,
                COUNT(CASE WHEN last_checked >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
                COUNT(CASE WHEN last_checked >= NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
                AVG(trend_score) as avg_score
            FROM products WHERE active = TRUE
        """
        
        results = db.fetch_all(query)
        
        momentum = {}
        for row in results:
            momentum[row[0]] = {
                'total': row[1],
                'active_24h': row[2],
                'active_7d': row[3],
                'avg_score': float(row[4]) if row[4] else 0,
                'daily_activity_rate': (row[2] / max(row[1], 1)) * 100,
                'weekly_activity_rate': (row[3] / max(row[1], 1)) * 100
            }
        
        return momentum
    
    def update_all_trend_scores(self) -> Dict:
        """Update all trend scores in the system."""
        logger.info("Starting comprehensive trend score update")
        
        # Update problems first (products depend on problem scores)
        problem_result = self.calculate_problem_trend_scores()
        
        # Update products based on new problem scores
        product_result = self.calculate_product_trend_scores()
        
        # Get trending insights
        trending_categories = self.identify_trending_categories()
        momentum = self.calculate_trend_momentum()
        
        result = {
            'problems_updated': problem_result['problems_updated'],
            'products_updated': product_result['products_updated'],
            'trending_categories_count': len(trending_categories),
            'trending_categories': trending_categories,
            'momentum': momentum,
            'timestamp': datetime.now()
        }
        
        logger.info(f"Trend score update complete: {result}")
        return result
    
    def get_trend_summary(self) -> Dict:
        """Get comprehensive trend summary."""
        query = """
            SELECT 
                'Overall Stats' as category,
                COUNT(DISTINCT pr.id) as problems,
                COUNT(DISTINCT p.id) as products,
                AVG(pr.trend_score) as avg_problem_score,
                AVG(p.trend_score) as avg_product_score
            FROM problems pr
            LEFT JOIN solutions s ON pr.id = s.problem_id
            LEFT JOIN products p ON s.id = p.solution_id
            WHERE pr.active = TRUE
        """
        
        result = db.fetch_one(query)
        
        return {
            'total_problems': result[1] or 0,
            'total_products': result[2] or 0,
            'avg_problem_score': float(result[3]) if result[3] else 0,
            'avg_product_score': float(result[4]) if result[4] else 0,
            'last_updated': datetime.now()
        }


def main():
    """Run comprehensive trend score updates."""
    scorer = TrendScorer()
    
    # Update all trend scores
    result = scorer.update_all_trend_scores()
    
    print(f"✓ Updated {result['problems_updated']} problem trend scores")
    print(f"✓ Updated {result['products_updated']} product trend scores")
    print(f"✓ Found {result['trending_categories_count']} trending categories")
    
    # Show trending categories
    if result['trending_categories']:
        print(f"\nTop Trending Categories:")
        for i, category in enumerate(result['trending_categories'][:5], 1):
            print(f"{i}. {category['category']}: {category['avg_trend_score']:.1f} avg score, {category['total_mentions']} mentions")
    
    # Show momentum
    print(f"\nTrend Momentum:")
    for item_type, stats in result['momentum'].items():
        print(f"  {item_type.title()}: {stats['daily_activity_rate']:.1f}% daily activity, avg score {stats['avg_score']:.1f}")
    
    # Show summary
    summary = scorer.get_trend_summary()
    print(f"\nTrend Summary:")
    print(f"  Problems: {summary['total_problems']} (avg score {summary['avg_problem_score']:.1f})")
    print(f"  Products: {summary['total_products']} (avg score {summary['avg_product_score']:.1f})")


if __name__ == "__main__":
    main()