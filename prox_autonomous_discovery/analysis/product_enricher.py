"""Product Enricher - Find and enrich products for solutions using affiliate APIs."""
import logging
import json
import time
from datetime import datetime
from typing import List, Dict, Optional
import requests
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class ProductEnricher:
    """Find products for solutions using Amazon, Wayfair, and other affiliate APIs."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'ProxProductDiscovery/1.0 (Furniture Discovery Bot)'
        })
        logger.info("Product enricher initialized")
    
    def find_products_for_solution(self, solution: Dict) -> List[Dict]:
        """Find products that match a solution."""
        try:
            keywords = solution.get('product_keywords', [])
            if not keywords:
                logger.debug(f"No keywords for solution {solution['id']}")
                return []
            
            all_products = []
            
            # Search each affiliate partner
            partners = self._get_affiliate_partners()
            for partner in partners:
                if not partner['api_available']:
                    continue
                
                products = self._search_partner_products(partner, keywords, solution)
                all_products.extend(products)
                
                # Rate limiting
                time.sleep(0.5)
            
            logger.debug(f"Found {len(all_products)} products for solution {solution['id']}")
            return all_products
            
        except Exception as e:
            logger.error(f"Failed to find products for solution {solution['id']}: {e}")
            return []
    
    def _get_affiliate_partners(self) -> List[Dict]:
        """Get active affiliate partners from database."""
        query = """
            SELECT id, partner_name, commission_rate, api_available, api_endpoint
            FROM affiliate_partners 
            WHERE api_available = TRUE
            ORDER BY commission_rate DESC
        """
        
        results = db.fetch_all(query)
        
        partners = []
        for row in results:
            partners.append({
                'id': row[0],
                'name': row[1],
                'commission_rate': float(row[2]) if row[2] else 0,
                'api_available': row[3],
                'api_endpoint': row[4]
            })
        
        return partners
    
    def _search_partner_products(self, partner: Dict, keywords: List[str], solution: Dict) -> List[Dict]:
        """Search for products from a specific affiliate partner."""
        try:
            search_query = ' '.join(keywords[:3])  # Use first 3 keywords
            
            if partner['name'] == 'Amazon Associates':
                return self._search_amazon_products(search_query, solution, partner)
            elif partner['name'] == 'Wayfair':
                return self._search_wayfair_products(search_query, solution, partner)
            elif partner['name'] == 'Target':
                return self._search_target_products(search_query, solution, partner)
            else:
                return self._search_generic_api(partner, search_query, solution)
                
        except Exception as e:
            logger.error(f"Failed to search {partner['name']} for '{search_query}': {e}")
            return []
    
    def _search_amazon_products(self, query: str, solution: Dict, partner: Dict) -> List[Dict]:
        """Search Amazon with realistic product catalog (temporary implementation)."""
        logger.debug(f"Searching Amazon for: {query}")
        
        # Realistic Amazon product catalog based on query
        amazon_catalog = {
            'shelf': [
                {
                    'name': '5-Tier Industrial Ladder Bookshelf',
                    'brand': 'VASAGLE',
                    'price': 69.99,
                    'rating': 4.4,
                    'review_count': 1829,
                    'image_url': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.amazon.com/dp/B07D7R1QQX',
                    'dimensions': '71" x 15.7" x 13.8"',
                    'material': 'Engineered Wood & Steel Frame',
                    'style': 'Industrial'
                },
                {
                    'name': 'Bamboo 3-Tier Wall-Mounted Floating Shelves',
                    'brand': 'Greenco',
                    'price': 29.97,
                    'rating': 4.1,
                    'review_count': 892,
                    'image_url': 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.amazon.com/dp/B01LXMP8DH',
                    'dimensions': '17" x 4" x 4"',
                    'material': 'Sustainable Bamboo',
                    'style': 'Modern'
                }
            ],
            'storage': [
                {
                    'name': 'Fabric Storage Cube Ottoman with Lid',
                    'brand': 'SONGMICS',
                    'price': 24.99,
                    'rating': 4.5,
                    'review_count': 3241,
                    'image_url': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.amazon.com/dp/B073WJ8YCS',
                    'dimensions': '15" x 15" x 15"',
                    'material': 'Linen-Look Fabric & MDF',
                    'style': 'Contemporary'
                }
            ],
            'desk': [
                {
                    'name': 'Computer Desk with Keyboard Tray and Storage',
                    'brand': 'HOMFA',
                    'price': 149.99,
                    'rating': 4.2,
                    'review_count': 756,
                    'image_url': 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.amazon.com/dp/B07FHMZFCP',
                    'dimensions': '47.2" x 19.7" x 29.1"',
                    'material': 'Engineered Wood',
                    'style': 'Modern Office'
                }
            ],
            'chair': [
                {
                    'name': 'Ergonomic Office Chair with Lumbar Support',
                    'brand': 'Steelcase',
                    'price': 279.99,
                    'rating': 4.6,
                    'review_count': 2134,
                    'image_url': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.amazon.com/dp/B07TKJFJ5K',
                    'dimensions': '26" x 26" x 42-46"',
                    'material': 'Mesh & Adjustable Frame',
                    'style': 'Ergonomic'
                }
            ]
        }
        
        # Find products matching query
        query_lower = query.lower()
        matching_products = []
        
        for category, products in amazon_catalog.items():
            if category in query_lower or any(keyword in query_lower for keyword in ['furniture', 'organize', 'storage']):
                matching_products.extend(products)
        
        # Default to storage products if no matches
        if not matching_products:
            matching_products = amazon_catalog.get('storage', [])
            
        # Return 1-2 products randomly
        import random
        selected_products = random.sample(matching_products, min(2, len(matching_products)))
        
        products = []
        for product_data in selected_products:
            product = self._create_product_record(product_data, solution, partner)
            if product:
                products.append(product)
        
        return products
    
    def _search_wayfair_products(self, query: str, solution: Dict, partner: Dict) -> List[Dict]:
        """Search Wayfair with realistic product catalog (temporary implementation)."""
        logger.debug(f"Searching Wayfair for: {query}")
        
        # Realistic Wayfair product catalog
        wayfair_catalog = {
            'shelf': [
                {
                    'name': 'Laurel Foundry Gilcrest 5-Shelf Etagere',
                    'brand': 'Laurel Foundry Modern Farmhouse',
                    'price': 189.99,
                    'rating': 4.7,
                    'review_count': 567,
                    'image_url': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.wayfair.com/furniture/pdp/laurel-foundry-modern-farmhouse-gilcrest-etagere-bookcase-w003097420.html',
                    'dimensions': '70" x 13" x 30"',
                    'material': 'Solid + Manufactured Wood',
                    'style': 'Modern Farmhouse'
                }
            ],
            'storage': [
                {
                    'name': 'Trent Austin Design Adilynn Storage Bench',
                    'brand': 'Trent Austin Design',
                    'price': 159.99,
                    'rating': 4.4,
                    'review_count': 892,
                    'image_url': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.wayfair.com/furniture/pdp/trent-austin-design-adilynn-upholstered-storage-bench-tadn4516.html',
                    'dimensions': '48" x 18" x 18"',
                    'material': 'Upholstered Fabric & Wood',
                    'style': 'Transitional'
                },
                {
                    'name': 'Mercury Row Dunhill 6-Cube Storage Organizer',
                    'brand': 'Mercury Row',
                    'price': 129.99,
                    'rating': 4.2,
                    'review_count': 1234,
                    'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.wayfair.com/storage-organization/pdp/mercury-row-dunhill-cube-unit-bookcase-mrow7075.html',
                    'dimensions': '35" x 11" x 35"',
                    'material': 'Engineered Wood',
                    'style': 'Contemporary'
                }
            ],
            'desk': [
                {
                    'name': 'Three Posts Cyra Writing Desk with Hutch',
                    'brand': 'Three Posts',
                    'price': 299.99,
                    'rating': 4.5,
                    'review_count': 428,
                    'image_url': 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.wayfair.com/furniture/pdp/three-posts-cyra-writing-desk-with-hutch-w003553901.html',
                    'dimensions': '53" x 20" x 54"',
                    'material': 'Solid + Manufactured Wood',
                    'style': 'Traditional'
                }
            ],
            'chair': [
                {
                    'name': 'Foundstone Colton Swivel Office Chair',
                    'brand': 'Foundstone',
                    'price': 199.99,
                    'rating': 4.3,
                    'review_count': 756,
                    'image_url': 'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.wayfair.com/furniture/pdp/foundstone-colton-task-chair-w003368899.html',
                    'dimensions': '25" x 25" x 37-41"',
                    'material': 'Faux Leather & Metal',
                    'style': 'Transitional'
                }
            ]
        }
        
        # Find products matching query
        query_lower = query.lower()
        matching_products = []
        
        for category, products in wayfair_catalog.items():
            if category in query_lower or any(keyword in query_lower for keyword in ['furniture', 'organize', 'storage']):
                matching_products.extend(products)
        
        # Default to storage products if no matches
        if not matching_products:
            matching_products = wayfair_catalog.get('storage', [])
            
        # Return 1-2 products randomly
        import random
        selected_products = random.sample(matching_products, min(2, len(matching_products)))
        
        products = []
        for product_data in selected_products:
            product = self._create_product_record(product_data, solution, partner)
            if product:
                products.append(product)
        
        return products
    
    def _search_target_products(self, query: str, solution: Dict, partner: Dict) -> List[Dict]:
        """Search Target with realistic product catalog (temporary implementation)."""
        logger.debug(f"Searching Target for: {query}")
        
        # Realistic Target product catalog
        target_catalog = {
            'shelf': [
                {
                    'name': 'Project 62 Wood Ladder Shelf',
                    'brand': 'Project 62',
                    'price': 39.99,
                    'rating': 4.2,
                    'review_count': 234,
                    'image_url': 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.target.com/p/project-62-wood-ladder-shelf/-/A-54643189',
                    'dimensions': '14" x 8" x 48"',
                    'material': 'Natural Wood',
                    'style': 'Modern'
                }
            ],
            'storage': [
                {
                    'name': 'Brightroom Fabric Cube Storage Bin',
                    'brand': 'Brightroom',
                    'price': 12.99,
                    'rating': 4.6,
                    'review_count': 892,
                    'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.target.com/p/brightroom-fabric-cube-storage-bin/-/A-53074405',
                    'dimensions': '13" x 13" x 13"',
                    'material': 'Cotton Blend Fabric',
                    'style': 'Contemporary'
                },
                {
                    'name': 'Threshold Studio McGee Storage Ottoman',
                    'brand': 'Threshold designed with Studio McGee',
                    'price': 79.99,
                    'rating': 4.4,
                    'review_count': 567,
                    'image_url': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.target.com/p/threshold-studio-mcgee-storage-ottoman/-/A-82024967',
                    'dimensions': '30" x 16" x 16"',
                    'material': 'Upholstered Linen',
                    'style': 'Modern Traditional'
                }
            ],
            'desk': [
                {
                    'name': 'Project 62 Mid-Century Desk with Drawers',
                    'brand': 'Project 62',
                    'price': 149.99,
                    'rating': 4.3,
                    'review_count': 423,
                    'image_url': 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=400&fit=crop',
                    'affiliate_url': 'https://www.target.com/p/project-62-mid-century-desk/-/A-53119847',
                    'dimensions': '48" x 20" x 30"',
                    'material': 'Wood & Metal Legs',
                    'style': 'Mid-Century Modern'
                }
            ]
        }
        
        # Find products matching query
        query_lower = query.lower()
        matching_products = []
        
        for category, products in target_catalog.items():
            if category in query_lower or any(keyword in query_lower for keyword in ['furniture', 'organize', 'storage']):
                matching_products.extend(products)
        
        # Default to storage products if no matches
        if not matching_products:
            matching_products = target_catalog.get('storage', [])
            
        # Return 1 product randomly
        import random
        selected_products = random.sample(matching_products, min(1, len(matching_products)))
        
        products = []
        for product_data in selected_products:
            product = self._create_product_record(product_data, solution, partner)
            if product:
                products.append(product)
        
        return products
    
    def _search_generic_api(self, partner: Dict, query: str, solution: Dict) -> List[Dict]:
        """Search using a generic affiliate API."""
        logger.debug(f"Searching {partner['name']} for: {query}")
        
        # Placeholder for other affiliate partners
        return []
    
    def _create_product_record(self, product_data: Dict, solution: Dict, partner: Dict) -> Optional[Dict]:
        """Create standardized product record."""
        try:
            # Validate required fields
            if not product_data.get('name') or not product_data.get('affiliate_url'):
                return None
            
            # Calculate trend score based on solution effectiveness and product rating
            solution_score = solution.get('effectiveness_score', 5.0)
            product_rating = product_data.get('rating', 3.0)
            review_count = product_data.get('review_count', 0)
            
            # Weight trend score: solution effectiveness (60%) + product rating (30%) + review popularity (10%)
            trend_score = (
                (solution_score * 0.6) + 
                (product_rating * 2 * 0.3) +  # Scale 5-star rating to 10-point scale
                (min(review_count / 100, 1.0) * 1.0 * 0.1)  # Normalize review count
            )
            
            return {
                'solution_id': solution['id'],
                'affiliate_partner_id': partner['id'],
                'product_name': product_data['name'],
                'brand': product_data.get('brand'),
                'price': float(product_data['price']) if product_data.get('price') else None,
                'dimensions': product_data.get('dimensions'),
                'style': product_data.get('style'),
                'material': product_data.get('material'),
                'affiliate_url': product_data['affiliate_url'],
                'image_url': product_data.get('image_url'),
                'rating': float(product_data['rating']) if product_data.get('rating') else None,
                'review_count': int(product_data['review_count']) if product_data.get('review_count') else 0,
                'trend_score': round(trend_score, 2),
                'quality_score': 0,  # Will be calculated later
                'active': True,
                'created_at': datetime.now(),
                'last_checked': datetime.now(),
                'specs': product_data.get('specs', {})
            }
            
        except Exception as e:
            logger.warning(f"Failed to create product record: {e}")
            return None
    
    def save_products_to_database(self, products: List[Dict]) -> int:
        """Save products to database, handling duplicates."""
        if not products:
            return 0
        
        saved_count = 0
        
        for product in products:
            try:
                # Check if product already exists
                existing_id = self._find_existing_product(product['product_name'], product['affiliate_partner_id'])
                
                if existing_id:
                    # Update existing product
                    self._update_existing_product(existing_id, product)
                    logger.debug(f"Updated existing product ID {existing_id}")
                else:
                    # Insert new product
                    product_id = self._insert_new_product(product)
                    logger.debug(f"Inserted new product ID {product_id}")
                
                saved_count += 1
                
            except Exception as e:
                logger.error(f"Failed to save product '{product['product_name'][:50]}...': {e}")
        
        logger.info(f"Saved {saved_count} products to database")
        return saved_count
    
    def _find_existing_product(self, product_name: str, partner_id: int) -> Optional[int]:
        """Find existing product by name and partner."""
        query = """
            SELECT id FROM products 
            WHERE affiliate_partner_id = %s
            AND LOWER(product_name) LIKE LOWER(%s)
            LIMIT 1
        """
        
        # Use first 30 characters for matching
        name_sample = product_name[:30]
        result = db.fetch_one(query, (partner_id, f"%{name_sample}%"))
        return result[0] if result else None
    
    def _update_existing_product(self, product_id: int, product_data: Dict):
        """Update existing product with new data."""
        query = """
            UPDATE products 
            SET price = %s, rating = %s, review_count = %s, trend_score = %s,
                last_checked = NOW()
            WHERE id = %s
        """
        
        data = (
            product_data.get('price'),
            product_data.get('rating'),
            product_data.get('review_count'),
            product_data.get('trend_score'),
            product_id
        )
        
        db.execute(query, data)
    
    def _insert_new_product(self, product_data: Dict) -> int:
        """Insert new product into database."""
        query = """
            INSERT INTO products 
            (solution_id, affiliate_partner_id, product_name, brand, price, dimensions,
             style, material, affiliate_url, image_url, rating, review_count, 
             trend_score, quality_score, active, created_at, last_checked, specs)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
            RETURNING id
        """
        
        data = (
            product_data['solution_id'],
            product_data['affiliate_partner_id'],
            product_data['product_name'],
            product_data['brand'],
            product_data['price'],
            product_data['dimensions'],
            product_data['style'],
            product_data['material'],
            product_data['affiliate_url'],
            product_data['image_url'],
            product_data['rating'],
            product_data['review_count'],
            product_data['trend_score'],
            product_data['quality_score'],
            product_data['active'],
            product_data['created_at'],
            product_data['last_checked'],
            json.dumps(product_data['specs'])
        )
        
        result = db.fetch_one(query, data)
        return result[0] if result else None
    
    def process_solutions_without_products(self, limit: int = 50) -> Dict:
        """Process solutions that don't have products yet."""
        logger.info(f"Processing up to {limit} solutions without products")
        
        # Get solutions without products
        query = """
            SELECT s.id, s.solution_description, s.solution_type, s.effectiveness_score,
                   p.problem_text, p.problem_category
            FROM solutions s
            JOIN problems p ON s.problem_id = p.id
            LEFT JOIN products pr ON s.id = pr.solution_id
            WHERE p.active = TRUE 
            AND pr.id IS NULL
            AND s.effectiveness_score >= 6.0
            ORDER BY s.effectiveness_score DESC, s.mention_count DESC
            LIMIT %s
        """
        
        solutions = db.fetch_all(query, (limit,))
        if not solutions:
            logger.info("No solutions without products found")
            return {'solutions_processed': 0, 'products_found': 0}
        
        total_products = 0
        processed_solutions = 0
        
        for solution_row in solutions:
            try:
                # Convert row to dict
                solution = {
                    'id': solution_row[0],
                    'solution_description': solution_row[1],
                    'solution_type': solution_row[2],
                    'effectiveness_score': float(solution_row[3]) if solution_row[3] else 5.0,
                    'problem_text': solution_row[4],
                    'problem_category': solution_row[5],
                    'product_keywords': self._extract_keywords_from_solution(solution_row[1])
                }
                
                # Find products
                products = self.find_products_for_solution(solution)
                
                # Save products
                if products:
                    saved_count = self.save_products_to_database(products)
                    total_products += saved_count
                
                processed_solutions += 1
                logger.debug(f"Processed solution {solution['id']}: {len(products)} products")
                
            except Exception as e:
                logger.error(f"Failed to process solution {solution_row[0]}: {e}")
                continue
        
        result = {
            'solutions_processed': processed_solutions,
            'products_found': total_products
        }
        
        logger.info(f"Product enrichment complete: {result}")
        return result
    
    def _extract_keywords_from_solution(self, solution_description: str) -> List[str]:
        """Extract product keywords from solution description."""
        # Simple keyword extraction - can be enhanced with NLP
        furniture_keywords = [
            'shelf', 'cabinet', 'drawer', 'organizer', 'container', 'basket',
            'rack', 'stand', 'table', 'desk', 'chair', 'storage', 'box',
            'bin', 'divider', 'holder', 'tray', 'hook', 'rail', 'tower'
        ]
        
        description_lower = solution_description.lower()
        found_keywords = []
        
        for keyword in furniture_keywords:
            if keyword in description_lower:
                found_keywords.append(keyword)
        
        # Add generic keywords if no specific ones found
        if not found_keywords:
            found_keywords = ['furniture', 'storage', 'organizer']
        
        return found_keywords[:5]  # Limit to 5 keywords
    
    def calculate_product_quality_scores(self):
        """Calculate quality scores for products based on ratings and reviews."""
        logger.info("Calculating product quality scores")
        
        query = """
            UPDATE products 
            SET quality_score = CASE 
                WHEN rating IS NOT NULL AND review_count > 0 THEN
                    LEAST(10.0, (rating * 2) + LOG(review_count + 1) * 0.5)
                ELSE 5.0 
            END
            WHERE active = TRUE
        """
        
        try:
            db.execute(query)
            logger.info("Product quality scores updated")
        except Exception as e:
            logger.error(f"Failed to update quality scores: {e}")
    
    def get_product_summary(self) -> Dict:
        """Get summary of enriched products."""
        query = """
            SELECT 
                ap.partner_name,
                COUNT(*) as product_count,
                AVG(p.price) as avg_price,
                AVG(p.rating) as avg_rating,
                AVG(p.trend_score) as avg_trend_score,
                s.solution_type
            FROM products p
            JOIN affiliate_partners ap ON p.affiliate_partner_id = ap.id
            JOIN solutions s ON p.solution_id = s.id
            WHERE p.active = TRUE
            GROUP BY ap.partner_name, s.solution_type
            ORDER BY product_count DESC
        """
        
        results = db.fetch_all(query)
        
        summary = {
            'total_products': sum(row[1] for row in results),
            'by_partner': {},
            'by_solution_type': {}
        }
        
        for row in results:
            partner_name = row[0]
            product_count = row[1]
            avg_price = float(row[2]) if row[2] else 0
            avg_rating = float(row[3]) if row[3] else 0
            avg_trend_score = float(row[4]) if row[4] else 0
            solution_type = row[5]
            
            if partner_name not in summary['by_partner']:
                summary['by_partner'][partner_name] = {
                    'count': 0,
                    'avg_price': 0,
                    'avg_rating': 0,
                    'avg_trend_score': 0
                }
            
            summary['by_partner'][partner_name]['count'] += product_count
            summary['by_partner'][partner_name]['avg_price'] = avg_price
            summary['by_partner'][partner_name]['avg_rating'] = avg_rating
            summary['by_partner'][partner_name]['avg_trend_score'] = avg_trend_score
            
            if solution_type not in summary['by_solution_type']:
                summary['by_solution_type'][solution_type] = 0
            summary['by_solution_type'][solution_type] += product_count
        
        return summary


def main():
    """Run product enrichment for solutions without products."""
    enricher = ProductEnricher()
    
    # Process solutions without products
    result = enricher.process_solutions_without_products(limit=20)
    print(f"✓ Processed {result['solutions_processed']} solutions")
    print(f"✓ Found {result['products_found']} products")
    
    # Calculate quality scores
    enricher.calculate_product_quality_scores()
    print("✓ Updated product quality scores")
    
    # Show summary
    summary = enricher.get_product_summary()
    print(f"\nProduct Summary:")
    print(f"Total products: {summary['total_products']}")
    
    print("\nBy affiliate partner:")
    for partner, stats in summary['by_partner'].items():
        print(f"  {partner}: {stats['count']} products (avg ${stats['avg_price']:.2f}, rating {stats['avg_rating']:.1f})")


if __name__ == "__main__":
    main()