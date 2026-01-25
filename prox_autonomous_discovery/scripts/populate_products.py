#!/usr/bin/env python3
"""
Populate products to meet tier-based allocation targets.
Uses Canopy API to fetch Amazon products with style and price variety.
"""

import os
import sys
import time
import json
import argparse
import logging
import requests
import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import db
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProductPopulator:
    """Populates products database to meet allocation targets."""

    # Style variations by tier
    TIER_1_STYLES = ['modern', 'rustic', 'industrial', 'minimalist', 'traditional']
    TIER_2_STYLES = ['modern', 'rustic', 'industrial']

    # Price modifiers for search queries
    PRICE_MODIFIERS = {
        'budget': 'under $50',
        'mid': '$50 to $150',
        'premium': '$150 to $300',
        'luxury': 'premium high-end'
    }

    # Minimum ratings by tier
    MIN_RATINGS = {
        1: 4.0,
        2: 4.0,
        3: 4.0,
        4: 3.5
    }

    def __init__(self, dry_run: bool = False):
        self.canopy_url = "https://rest.canopyapi.co/api/amazon/search"
        self.api_key = os.getenv('CANOPY_API_KEY')
        self.affiliate_tag = os.getenv('AMAZON_ASSOCIATE_TAG', 'proxdesign20-20')
        self.dry_run = dry_run
        self.batch_id = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Stats tracking
        self.stats = {
            'api_calls': 0,
            'products_added': 0,
            'products_skipped_rating': 0,
            'products_skipped_duplicate': 0,
            'errors': []
        }

        # Track existing ASINs to avoid duplicates
        self.existing_asins = self._load_existing_asins()

        if not self.api_key:
            raise ValueError("CANOPY_API_KEY environment variable is required")

    def _load_existing_asins(self) -> set:
        """Load existing ASINs from database to avoid duplicates."""
        query = """
        SELECT DISTINCT amazon_data->>'asin' as asin
        FROM products
        WHERE amazon_data->>'asin' IS NOT NULL
        """
        try:
            results = db.execute_query(query)
            asins = {r['asin'] for r in results if r['asin']}
            logger.info(f"Loaded {len(asins)} existing ASINs")
            return asins
        except Exception as e:
            logger.warning(f"Could not load existing ASINs: {e}")
            return set()

    def get_solutions_needing_products(self, tier: Optional[int] = None) -> List[Dict]:
        """Get solutions that need more products based on allocation targets."""
        query = """
        SELECT
            solution_id,
            tier,
            solution_name,
            target_products,
            current_products,
            products_needed,
            style_variety,
            styles_needed,
            price_tiers_needed
        FROM product_allocation_status
        WHERE products_needed > 0
        """
        if tier:
            query += f" AND tier = {tier}"
        query += " ORDER BY tier, solution_id"

        try:
            results = db.execute_query(query)
            logger.info(f"Found {len(results)} solutions needing products")
            return results
        except Exception as e:
            logger.error(f"Error getting solutions: {e}")
            return []

    def extract_search_keywords(self, solution_name: str) -> str:
        """Extract meaningful search keywords from solution name/description."""
        # Remove common filler words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'that', 'which', 'who', 'what', 'where',
            'when', 'why', 'how', 'best', 'good', 'great', 'top', 'most', 'very',
            'really', 'quite', 'install', 'use', 'create', 'implement', 'provide',
            'design', 'custom', 'built-in', 'high-quality', 'adjustable'
        }

        # Extract words
        words = re.findall(r'\b[a-zA-Z]{3,}\b', solution_name.lower())
        keywords = [w for w in words if w not in stop_words]

        # Take first 4-5 meaningful words
        return ' '.join(keywords[:5])

    def generate_search_terms(self, solution: Dict) -> List[Tuple[str, Optional[str], str]]:
        """
        Generate search terms with style and price variations.
        Returns list of (search_term, style, budget_tier) tuples.
        """
        tier = solution['tier']
        base_keywords = self.extract_search_keywords(solution['solution_name'])
        terms = []

        if tier == 1:
            # Furniture: 5 styles × 4 price tiers
            styles = self.TIER_1_STYLES
            price_tiers = ['budget', 'mid', 'premium', 'luxury']
            for style in styles:
                for price_tier in price_tiers:
                    search = f"{style} {base_keywords}"
                    terms.append((search, style, price_tier))

        elif tier == 2:
            # Visible Storage: 3 styles × 4 price tiers
            styles = self.TIER_2_STYLES
            price_tiers = ['budget', 'mid', 'premium', 'luxury']
            for style in styles:
                for price_tier in price_tiers:
                    search = f"{style} {base_keywords}"
                    terms.append((search, style, price_tier))

        elif tier == 3:
            # Functional: price tiers only
            price_tiers = ['budget', 'mid', 'premium', 'luxury']
            for price_tier in price_tiers:
                search = base_keywords
                terms.append((search, None, price_tier))

        elif tier == 4:
            # DIY Supplies: 3 price tiers
            price_tiers = ['budget', 'mid', 'premium']
            for price_tier in price_tiers:
                search = base_keywords
                terms.append((search, None, price_tier))

        return terms

    def search_canopy(self, search_term: str, limit: int = 5,
                      min_rating: float = 4.0) -> List[Dict]:
        """Search Amazon via Canopy API."""
        params = {
            'searchTerm': search_term,
            'domain': 'US',
            'limit': limit * 2  # Request more to account for rating filter
        }
        headers = {'API-KEY': self.api_key}

        try:
            response = requests.get(self.canopy_url, headers=headers, params=params)
            self.stats['api_calls'] += 1

            if response.status_code == 200:
                data = response.json()
                results = (data.get('data', {})
                          .get('amazonProductSearchResults', {})
                          .get('productResults', {})
                          .get('results', []))

                # Filter by rating and transform
                products = []
                for item in results:
                    rating = item.get('rating', 0) or 0
                    if rating >= min_rating:
                        asin = item.get('asin')
                        if asin and asin not in self.existing_asins:
                            products.append({
                                'asin': asin,
                                'title': item.get('title', 'Unknown Product'),
                                'price': item.get('price', {}).get('value'),
                                'image_url': item.get('mainImageUrl'),
                                'rating': rating,
                                'review_count': item.get('ratingsTotal', 0),
                                'affiliate_url': f"https://www.amazon.com/dp/{asin}?tag={self.affiliate_tag}"
                            })
                            self.existing_asins.add(asin)
                        else:
                            self.stats['products_skipped_duplicate'] += 1
                    else:
                        self.stats['products_skipped_rating'] += 1

                return products[:limit]
            else:
                logger.warning(f"API returned {response.status_code} for '{search_term}'")
                self.stats['errors'].append(f"API {response.status_code}: {search_term}")
                return []

        except Exception as e:
            logger.error(f"Error searching '{search_term}': {e}")
            self.stats['errors'].append(f"Error: {search_term} - {e}")
            return []

    def insert_products(self, solution_id: int, products: List[Dict],
                       style: Optional[str], budget_tier: str) -> int:
        """Insert products into database."""
        if not products:
            return 0

        if self.dry_run:
            logger.info(f"[DRY RUN] Would insert {len(products)} products for solution {solution_id}")
            return len(products)

        query = """
        INSERT INTO products (
            solution_id, product_name, price, image_url, rating, review_count,
            affiliate_url, style, budget_tier, affiliate_partner_id,
            amazon_data, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """

        rows = []
        for product in products:
            amazon_data = json.dumps({
                'asin': product['asin'],
                'batch_id': self.batch_id
            })

            rows.append((
                solution_id,
                product['title'][:255],  # Truncate to fit varchar(255)
                product['price'],
                product['image_url'],
                product['rating'],
                product['review_count'],
                product['affiliate_url'],
                style,
                budget_tier,
                1,  # Amazon Associates partner ID
                amazon_data
            ))

        try:
            db.execute_many(query, rows)
            self.stats['products_added'] += len(rows)
            return len(rows)
        except Exception as e:
            logger.error(f"Error inserting products for solution {solution_id}: {e}")
            self.stats['errors'].append(f"Insert error: solution {solution_id} - {e}")
            return 0

    def populate_solution(self, solution: Dict) -> int:
        """Populate products for a single solution."""
        solution_id = solution['solution_id']
        tier = solution['tier']
        needed = solution['products_needed']
        min_rating = self.MIN_RATINGS.get(tier, 4.0)

        logger.info(f"Processing solution {solution_id} (Tier {tier}): {solution['solution_name'][:60]}...")
        logger.info(f"  Need {needed} products, current: {solution['current_products']}")

        # Generate search terms
        search_terms = self.generate_search_terms(solution)

        # Calculate products per search
        products_per_search = max(1, needed // len(search_terms)) + 1

        total_added = 0
        for search_term, style, budget_tier in search_terms:
            if total_added >= needed:
                break

            # Determine how many we still need
            remaining = needed - total_added
            limit = min(products_per_search, remaining)

            logger.info(f"  Searching: '{search_term}' (style={style}, tier={budget_tier})")

            products = self.search_canopy(search_term, limit=limit, min_rating=min_rating)

            if products:
                added = self.insert_products(solution_id, products, style, budget_tier)
                total_added += added
                logger.info(f"    Added {added} products")

            # Rate limiting
            time.sleep(0.5)

        logger.info(f"  Total added for solution {solution_id}: {total_added}")
        return total_added

    def run(self, tier: Optional[int] = None):
        """Run the population process."""
        start_time = datetime.now()

        mode = "[DRY RUN] " if self.dry_run else ""
        tier_msg = f"Tier {tier}" if tier else "all tiers"
        logger.info(f"{mode}Starting product population for {tier_msg}")
        logger.info(f"Batch ID: {self.batch_id}")

        # Get solutions needing products
        solutions = self.get_solutions_needing_products(tier)

        if not solutions:
            logger.info("No solutions need products!")
            return

        # Group by tier for reporting
        by_tier = defaultdict(list)
        for s in solutions:
            by_tier[s['tier']].append(s)

        logger.info(f"Solutions by tier:")
        for t in sorted(by_tier.keys()):
            total_needed = sum(s['products_needed'] for s in by_tier[t])
            logger.info(f"  Tier {t}: {len(by_tier[t])} solutions, {total_needed} products needed")

        # Process each solution
        for solution in solutions:
            self.populate_solution(solution)

        # Final report
        duration = datetime.now() - start_time

        logger.info("=" * 60)
        logger.info("POPULATION COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Duration: {duration}")
        logger.info(f"API calls made: {self.stats['api_calls']}")
        logger.info(f"Products added: {self.stats['products_added']}")
        logger.info(f"Skipped (low rating): {self.stats['products_skipped_rating']}")
        logger.info(f"Skipped (duplicate): {self.stats['products_skipped_duplicate']}")

        if self.stats['errors']:
            logger.warning(f"Errors encountered: {len(self.stats['errors'])}")
            for err in self.stats['errors'][:10]:
                logger.warning(f"  - {err}")

        return self.stats


def main():
    parser = argparse.ArgumentParser(description='Populate products to meet allocation targets')
    parser.add_argument('--tier', type=int, choices=[1, 2, 3, 4],
                       help='Only process specific tier (1-4)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Simulate without inserting to database')

    args = parser.parse_args()

    try:
        populator = ProductPopulator(dry_run=args.dry_run)
        populator.run(tier=args.tier)
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
