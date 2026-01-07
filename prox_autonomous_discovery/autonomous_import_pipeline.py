#!/usr/bin/env python3
"""
Autonomous Product Discovery Import Pipeline
Multi-phase operation for comprehensive product import, audit, and cleanup.
"""

import os
import sys
import time
import requests
import logging
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from collections import defaultdict, Counter
import re

# Add the project root to path for imports
sys.path.append('/Volumes/Dave\'s Mac/prox-product-discovery/prox_autonomous_discovery')

from database.connection import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'/Volumes/Dave\'s Mac/prox-product-discovery/prox_autonomous_discovery/logs/autonomous_import_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AutonomousImportPipeline:
    """Main pipeline class for autonomous product import."""
    
    def __init__(self):
        self.canopy_endpoint = "https://rest.canopyapi.co/api/amazon/search"
        self.api_key = "ca19966e-764d-40ea-bc78-0bcc9a864c2b"
        self.headers = {"API-KEY": self.api_key}
        self.stats = {
            'api_calls': 0,
            'products_imported': 0,
            'products_flagged': 0,
            'products_deleted': 0,
            'errors': []
        }
        self.category_stats = defaultdict(int)
        self.refinement_stats = defaultdict(int)
        self.flagged_products = []
        
    def get_empty_solutions(self) -> List[Dict]:
        """Phase 1: Get all solutions with 0 products."""
        query = """
        SELECT s.id, s.solution_description, COUNT(p.id) as product_count
        FROM solutions s
        LEFT JOIN products p ON s.id = p.solution_id
        GROUP BY s.id, s.solution_description
        HAVING COUNT(p.id) = 0
        ORDER BY s.id
        """
        try:
            solutions = db.execute_query(query)
            logger.info(f"Found {len(solutions)} solutions with 0 products")
            return solutions
        except Exception as e:
            logger.error(f"Error getting empty solutions: {e}")
            self.stats['errors'].append(f"Failed to get empty solutions: {e}")
            return []
    
    def determine_refinement_type(self, solution_desc: str) -> Tuple[str, List[str]]:
        """Determine refinement strategy based on solution category."""
        solution_lower = solution_desc.lower()
        
        # Extract the main product from the solution description
        # Remove common prefixes and get the core product
        product_match = re.search(r'\b(?:best|top|affordable|cheap|good|quality|stylish|modern|rustic|industrial|minimalist)\s+(.+?)(?:\s+for|\s+that|\s+to|\s+under|\s*$)', solution_lower)
        if product_match:
            base_product = product_match.group(1).strip()
        else:
            # Fallback: try to extract key product words
            words = solution_lower.split()
            # Remove common words and take remaining meaningful words
            meaningful_words = [w for w in words if w not in ['best', 'top', 'affordable', 'cheap', 'good', 'quality', 'for', 'that', 'to', 'under', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'with']]
            base_product = ' '.join(meaningful_words[:3])  # Take first 3 meaningful words
        
        # Style-based categories
        if any(keyword in solution_lower for keyword in ['chair', 'table', 'desk', 'shelf', 'cabinet', 'dresser', 'bed', 'sofa', 'couch', 'stool', 'lamp', 'mirror', 'decor', 'art', 'vase', 'storage', 'organizer', 'rack', 'stand']):
            return 'style', [
                f"modern {base_product}",
                f"rustic {base_product}",
                f"industrial {base_product}",
                f"minimalist {base_product}"
            ]
        
        # Material-based categories
        if any(keyword in solution_lower for keyword in ['bathroom', 'shower', 'bath', 'toilet', 'sink', 'cleaning', 'scrub', 'brush', 'mop', 'broom', 'vacuum']):
            return 'material', [
                f"plastic {base_product}",
                f"metal {base_product}",
                f"bamboo wood {base_product}"
            ]
        
        # Budget-based categories
        if any(keyword in solution_lower for keyword in ['laptop', 'computer', 'printer', 'monitor', 'keyboard', 'mouse', 'tablet', 'phone', 'speaker', 'headphone', 'office', 'equipment']):
            return 'budget', [
                f"{base_product} under 50",
                f"{base_product} mid range",
                f"premium {base_product}"
            ]
        
        # Size-based categories
        if any(keyword in solution_lower for keyword in ['dog', 'cat', 'pet', 'bird', 'fish', 'hamster', 'rabbit']):
            return 'pet_size', [
                f"small {base_product}",
                f"medium {base_product}",
                f"large {base_product}"
            ]
        
        # CPG/Consumables
        if any(keyword in solution_lower for keyword in ['detergent', 'soap', 'shampoo', 'toothpaste', 'paper', 'towel', 'tissue', 'food', 'snack', 'supplement', 'vitamin']):
            return 'cpg', [
                f"best rated {base_product}",
                f"value pack {base_product}",
                f"eco friendly {base_product}",
                f"professional {base_product}"
            ]
        
        # Default: no refinement
        return 'none', [base_product]
    
    def search_amazon_products(self, search_term: str, limit: int = 3) -> List[Dict]:
        """Search Amazon via Canopy API."""
        params = {
            'searchTerm': search_term,
            'domain': 'US',
            'limit': limit
        }
        
        try:
            response = requests.get(self.canopy_endpoint, headers=self.headers, params=params)
            self.stats['api_calls'] += 1
            
            if response.status_code == 200:
                data = response.json()
                products = []
                
                # Navigate to the correct path in the response
                results = data.get('data', {}).get('amazonProductSearchResults', {}).get('productResults', {}).get('results', [])
                
                for item in results:
                    product = {
                        'asin': item.get('asin'),
                        'title': item.get('title'),
                        'price': item.get('price', {}).get('value'),
                        'image_url': item.get('mainImageUrl'),
                        'rating': item.get('rating'),
                        'ratings_total': item.get('ratingsTotal'),
                        'affiliate_url': f"https://www.amazon.com/dp/{item.get('asin')}?tag=proxdesign20-20"
                    }
                    products.append(product)
                
                return products
            else:
                logger.warning(f"API call failed for '{search_term}': {response.status_code}")
                self.stats['errors'].append(f"API call failed for '{search_term}': {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error searching for '{search_term}': {e}")
            self.stats['errors'].append(f"Error searching '{search_term}': {e}")
            return []
    
    def insert_products(self, solution_id: int, products: List[Dict], refinement_type: str, refinement_value: str = None):
        """Insert products into database."""
        if not products:
            return
            
        insert_query = """
        INSERT INTO products (
            solution_id, product_name, price, image_url, rating, review_count,
            affiliate_url, style, material, budget_tier, pet_size, refinement_type, amazon_data
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        data_to_insert = []
        for product in products:
            # Determine which column to populate based on refinement type
            style = refinement_value if refinement_type == 'style' else None
            material = refinement_value if refinement_type == 'material' else None
            budget_tier = refinement_value if refinement_type == 'budget' else None
            pet_size = refinement_value if refinement_type == 'pet_size' else None
            
            amazon_data = {
                'asin': product['asin'],
                'search_term_used': refinement_value or 'base'
            }
            
            row = (
                solution_id,
                product['title'],
                product['price'],
                product['image_url'],
                product['rating'],
                product['ratings_total'],
                product['affiliate_url'],
                style,
                material,
                budget_tier,
                pet_size,
                refinement_type,
                json.dumps(amazon_data)
            )
            data_to_insert.append(row)
        
        try:
            db.execute_many(insert_query, data_to_insert)
            self.stats['products_imported'] += len(data_to_insert)
            logger.info(f"Inserted {len(data_to_insert)} products for solution {solution_id}")
        except Exception as e:
            logger.error(f"Error inserting products for solution {solution_id}: {e}")
            self.stats['errors'].append(f"Insert failed for solution {solution_id}: {e}")
    
    def import_products_for_solution(self, solution: Dict):
        """Import products for a single solution."""
        solution_id = solution['id']
        solution_desc = solution['solution_description']
        
        logger.info(f"Processing solution {solution_id}: {solution_desc[:100]}...")
        
        refinement_type, search_terms = self.determine_refinement_type(solution_desc)
        self.refinement_stats[refinement_type] += 1
        
        # Track category for stats
        category = self.categorize_solution(solution_desc)
        self.category_stats[category] += 1
        
        for search_term in search_terms:
            products = self.search_amazon_products(search_term, limit=3)
            if products:
                # Extract refinement value from search term
                refinement_value = None
                if refinement_type == 'style':
                    for style in ['modern', 'rustic', 'industrial', 'minimalist']:
                        if style in search_term:
                            refinement_value = style
                            break
                elif refinement_type == 'material':
                    if 'plastic' in search_term:
                        refinement_value = 'plastic'
                    elif 'metal' in search_term:
                        refinement_value = 'metal'
                    elif 'bamboo' in search_term:
                        refinement_value = 'bamboo'
                elif refinement_type == 'budget':
                    if 'under 50' in search_term:
                        refinement_value = 'budget'
                    elif 'mid range' in search_term:
                        refinement_value = 'mid-range'
                    elif 'premium' in search_term:
                        refinement_value = 'premium'
                elif refinement_type == 'pet_size':
                    for size in ['small', 'medium', 'large']:
                        if size in search_term:
                            refinement_value = size
                            break
                elif refinement_type == 'cpg':
                    if 'best rated' in search_term:
                        refinement_value = 'best_rated'
                    elif 'value pack' in search_term:
                        refinement_value = 'value_pack'
                    elif 'eco friendly' in search_term:
                        refinement_value = 'eco_friendly'
                    elif 'professional' in search_term:
                        refinement_value = 'professional'
                
                self.insert_products(solution_id, products, refinement_type, refinement_value)
            
            # Rate limiting
            time.sleep(0.5)
        
        # Progress logging every 10 solutions
        if solution_id % 10 == 0:
            logger.info(f"Progress: Processed {solution_id} solutions, imported {self.stats['products_imported']} products")
    
    def categorize_solution(self, solution_desc: str) -> str:
        """Categorize solution for reporting purposes."""
        solution_lower = solution_desc.lower()
        
        if any(keyword in solution_lower for keyword in ['chair', 'table', 'desk', 'sofa', 'bed']):
            return 'furniture'
        elif any(keyword in solution_lower for keyword in ['bathroom', 'shower', 'toilet']):
            return 'bathroom'
        elif any(keyword in solution_lower for keyword in ['cleaning', 'vacuum', 'mop']):
            return 'cleaning'
        elif any(keyword in solution_lower for keyword in ['office', 'laptop', 'computer']):
            return 'office'
        elif any(keyword in solution_lower for keyword in ['pet', 'dog', 'cat']):
            return 'pet'
        elif any(keyword in solution_lower for keyword in ['storage', 'organizer']):
            return 'storage'
        else:
            return 'other'
    
    def audit_all_products(self):
        """Phase 2: Comprehensive audit of all products."""
        logger.info("Starting comprehensive product audit...")
        
        query = """
        SELECT p.id, p.solution_id, p.product_name, s.solution_description
        FROM products p
        JOIN solutions s ON p.solution_id = s.id
        ORDER BY p.solution_id, p.id
        """
        
        try:
            products = db.execute_query(query)
            logger.info(f"Auditing {len(products)} products...")
            
            for product in products:
                if self.should_flag_product(product):
                    reason = self.get_flag_reason(product)
                    self.flagged_products.append({
                        'id': product['id'],
                        'product_name': product['product_name'],
                        'solution_description': product['solution_description'],
                        'reason': reason
                    })
                    self.stats['products_flagged'] += 1
            
            logger.info(f"Audit complete. Flagged {len(self.flagged_products)} products for deletion")
            
        except Exception as e:
            logger.error(f"Error during audit: {e}")
            self.stats['errors'].append(f"Audit failed: {e}")
    
    def should_flag_product(self, product: Dict) -> bool:
        """Determine if a product should be flagged for deletion."""
        product_name = product['product_name'].lower()
        solution_desc = product['solution_description'].lower()
        
        # Check for obvious mismatches
        mismatch_patterns = [
            # Automotive in non-automotive solutions
            (r'\b(car|auto|vehicle|truck|motorcycle|tire|engine|brake|transmission)\b', 
             lambda s: not any(auto in s for auto in ['car', 'auto', 'vehicle', 'garage'])),
            
            # Bathroom items in non-bathroom solutions
            (r'\b(toilet|shower|bath|bathroom|sink|faucet|shampoo)\b',
             lambda s: not any(bath in s for bath in ['bathroom', 'bath', 'shower', 'toilet', 'sink'])),
            
            # Garden/outdoor in indoor solutions
            (r'\b(garden|outdoor|lawn|grass|plant|seed|fertilizer|hose)\b',
             lambda s: not any(outdoor in s for outdoor in ['garden', 'outdoor', 'yard', 'plant', 'patio'])),
            
            # Pet items in non-pet solutions
            (r'\b(dog|cat|pet|bird|fish|hamster|rabbit|leash|collar)\b',
             lambda s: not any(pet in s for pet in ['pet', 'dog', 'cat', 'bird', 'animal'])),
            
            # Industrial/commercial in household solutions
            (r'\b(industrial|commercial|warehouse|factory|forklift|crane)\b',
             lambda s: 'industrial' not in s and 'commercial' not in s),
            
            # Electronics in non-electronic solutions
            (r'\b(electronic|digital|wireless|bluetooth|usb|hdmi|laptop|computer)\b',
             lambda s: not any(tech in s for tech in ['electronic', 'computer', 'tech', 'digital', 'office', 'work'])),
        ]
        
        for pattern, condition_check in mismatch_patterns:
            if re.search(pattern, product_name) and condition_check(solution_desc):
                return True
        
        # Check for completely unrelated items
        unrelated_keywords = [
            'tractor', 'boat', 'airplane', 'motorcycle', 'atv', 'rv',
            'medical', 'surgical', 'pharmaceutical', 'prescription',
            'weapon', 'gun', 'knife', 'ammunition',
            'tobacco', 'cigarette', 'vape', 'alcohol'
        ]
        
        if any(keyword in product_name for keyword in unrelated_keywords):
            return True
        
        return False
    
    def get_flag_reason(self, product: Dict) -> str:
        """Get the reason why a product was flagged."""
        product_name = product['product_name'].lower()
        solution_desc = product['solution_description'].lower()
        
        if any(keyword in product_name for keyword in ['car', 'auto', 'vehicle', 'truck']) and 'auto' not in solution_desc:
            return "Automotive item in non-automotive solution"
        elif any(keyword in product_name for keyword in ['toilet', 'shower', 'bath']) and 'bathroom' not in solution_desc:
            return "Bathroom item in non-bathroom solution"
        elif any(keyword in product_name for keyword in ['garden', 'outdoor', 'lawn']) and 'outdoor' not in solution_desc:
            return "Outdoor item in indoor solution"
        elif any(keyword in product_name for keyword in ['dog', 'cat', 'pet']) and 'pet' not in solution_desc:
            return "Pet item in non-pet solution"
        elif any(keyword in product_name for keyword in ['industrial', 'commercial']):
            return "Industrial/commercial item in household solution"
        elif any(keyword in product_name for keyword in ['tractor', 'boat', 'weapon']):
            return "Completely unrelated item"
        else:
            return "Content mismatch"
    
    def cleanup_flagged_products(self):
        """Phase 3: Delete flagged products and duplicates."""
        logger.info("Starting cleanup of flagged products...")
        
        # Delete flagged products
        if self.flagged_products:
            product_ids = [p['id'] for p in self.flagged_products]
            placeholders = ','.join(['%s'] * len(product_ids))
            delete_query = f"DELETE FROM products WHERE id IN ({placeholders})"
            
            try:
                deleted_count = db.execute(delete_query, product_ids)
                self.stats['products_deleted'] += deleted_count
                logger.info(f"Deleted {deleted_count} flagged products")
            except Exception as e:
                logger.error(f"Error deleting flagged products: {e}")
                self.stats['errors'].append(f"Cleanup failed: {e}")
        
        # Delete duplicates (same ASIN)
        duplicate_query = """
        DELETE FROM products 
        WHERE id NOT IN (
            SELECT MIN(id) 
            FROM products 
            WHERE amazon_data->>'asin' IS NOT NULL
            GROUP BY amazon_data->>'asin'
        )
        AND amazon_data->>'asin' IS NOT NULL
        """
        
        try:
            duplicate_deleted = db.execute(duplicate_query)
            self.stats['products_deleted'] += duplicate_deleted
            logger.info(f"Deleted {duplicate_deleted} duplicate products")
        except Exception as e:
            logger.error(f"Error deleting duplicates: {e}")
            self.stats['errors'].append(f"Duplicate deletion failed: {e}")
    
    def update_frontend_mappings(self):
        """Phase 4: Update frontend search mappings."""
        logger.info("Updating frontend search mappings...")
        
        try:
            # Get all solutions with their keywords
            solutions_query = """
            SELECT id, solution_description
            FROM solutions
            WHERE id IN (SELECT DISTINCT solution_id FROM products)
            ORDER BY id
            """
            solutions = db.execute_query(solutions_query)
            
            # Update productApi.ts
            product_api_path = "/Volumes/Dave's Mac/prox-product-discovery/prox-frontend-v2/lib/productApi.ts"
            
            # Read current file
            with open(product_api_path, 'r') as f:
                content = f.read()
            
            # Generate new mapping
            mapping_entries = []
            for solution in solutions:
                # Extract key words from solution description
                desc = solution['solution_description'].lower()
                keywords = self.extract_keywords_from_description(desc)
                for keyword in keywords[:3]:  # Limit to 3 keywords per solution
                    mapping_entries.append(f'  "{keyword}": {solution["id"]},')
            
            # Replace the mapping in the file
            new_mapping = "const SEARCH_TO_SOLUTION_MAP: { [key: string]: number } = {\n" + "\n".join(mapping_entries) + "\n};"
            
            # Find and replace the mapping
            import re
            pattern = r'const SEARCH_TO_SOLUTION_MAP.*?};'
            content = re.sub(pattern, new_mapping, content, flags=re.DOTALL)
            
            with open(product_api_path, 'w') as f:
                f.write(content)
            
            logger.info(f"Updated frontend mappings with {len(mapping_entries)} entries")
            
        except Exception as e:
            logger.error(f"Error updating frontend mappings: {e}")
            self.stats['errors'].append(f"Frontend update failed: {e}")
    
    def extract_keywords_from_description(self, desc: str) -> List[str]:
        """Extract meaningful keywords from solution description."""
        # Remove common words and extract key terms
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'that', 'which', 'who', 'what', 'where', 'when', 'why', 'how', 'best', 'good', 'great', 'top', 'most', 'very', 'really', 'quite'}
        
        words = re.findall(r'\b[a-zA-Z]{3,}\b', desc.lower())
        keywords = [word for word in words if word not in stop_words]
        
        # Return unique keywords, prioritizing nouns (rough heuristic)
        return list(dict.fromkeys(keywords))[:10]
    
    def generate_final_report(self):
        """Phase 5: Generate comprehensive final report."""
        logger.info("Generating final comprehensive report...")
        
        # Get final database state
        final_stats_query = """
        SELECT 
            COUNT(p.id) as total_products,
            COUNT(DISTINCT p.solution_id) as solutions_with_products,
            AVG(product_count) as avg_products_per_solution
        FROM products p
        JOIN (
            SELECT solution_id, COUNT(*) as product_count
            FROM products
            GROUP BY solution_id
        ) pc ON p.solution_id = pc.solution_id
        """
        
        final_stats = db.execute_query(final_stats_query)[0]
        
        # Products per solution breakdown
        solution_breakdown_query = """
        SELECT s.id, s.solution_description, COUNT(p.id) as product_count
        FROM solutions s
        LEFT JOIN products p ON s.id = p.solution_id
        GROUP BY s.id, s.solution_description
        ORDER BY COUNT(p.id) DESC, s.id
        """
        
        solution_breakdown = db.execute_query(solution_breakdown_query)
        
        # Style variety check
        style_variety_query = """
        SELECT 
            solution_id,
            COUNT(DISTINCT style) as style_count,
            array_agg(DISTINCT style) as styles
        FROM products 
        WHERE style IS NOT NULL
        GROUP BY solution_id
        HAVING COUNT(DISTINCT style) = 4
        """
        
        style_complete = db.execute_query(style_variety_query)
        
        # Generate report
        report = f"""
=============================================================================
AUTONOMOUS PRODUCT DISCOVERY IMPORT PIPELINE - FINAL REPORT
=============================================================================
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

IMPORT SUMMARY:
--------------
Total API requests made: {self.stats['api_calls']}
Total products imported: {self.stats['products_imported']}

Products imported per category:
"""
        
        for category, count in self.category_stats.items():
            report += f"  {category}: {count} solutions\n"
        
        report += f"\nProducts per refinement type:\n"
        for refinement, count in self.refinement_stats.items():
            report += f"  {refinement}: {count} solutions\n"
        
        report += f"""
AUDIT SUMMARY:
--------------
Total products flagged for deletion: {self.stats['products_flagged']}
Total products deleted: {self.stats['products_deleted']}

Breakdown by mismatch reason:
"""
        
        reason_counts = Counter([p['reason'] for p in self.flagged_products])
        for reason, count in reason_counts.items():
            report += f"  {reason}: {count}\n"
        
        report += f"""
Examples of deleted products:
"""
        for example in self.flagged_products[:5]:  # Show first 5 examples
            report += f"  - {example['product_name'][:50]}... (Reason: {example['reason']})\n"
        
        report += f"""
FINAL DATABASE STATE:
--------------------
Total clean products: {final_stats['total_products']}
Solutions with products: {final_stats['solutions_with_products']}
Average products per solution: {final_stats['avg_products_per_solution']:.1f}

Solutions with <3 products (may need manual attention):
"""
        
        low_count_solutions = [s for s in solution_breakdown if s['product_count'] < 3 and s['product_count'] > 0]
        for solution in low_count_solutions[:10]:  # Show first 10
            report += f"  Solution {solution['id']}: {solution['product_count']} products - {solution['solution_description'][:60]}...\n"
        
        report += f"""
Top populated solutions:
"""
        for solution in solution_breakdown[:10]:  # Show top 10
            report += f"  Solution {solution['id']}: {solution['product_count']} products - {solution['solution_description'][:60]}...\n"
        
        report += f"""
STYLE VARIETY CHECK:
-------------------
Solutions with all 4 styles populated: {len(style_complete)}
"""
        
        for solution in style_complete[:5]:  # Show first 5 examples
            report += f"  Solution {solution['solution_id']}: {', '.join([s for s in solution['styles'] if s])}\n"
        
        report += f"""
SAMPLE VERIFICATION:
-------------------
5 random affiliate links to test:
"""
        
        # Get 5 random products for verification
        sample_query = """
        SELECT affiliate_url, product_name, refinement_type
        FROM products 
        WHERE affiliate_url IS NOT NULL
        ORDER BY RANDOM()
        LIMIT 5
        """
        
        sample_products = db.execute_query(sample_query)
        for product in sample_products:
            report += f"  {product['affiliate_url']} ({product['refinement_type']}: {product['product_name'][:40]}...)\n"
        
        if self.stats['errors']:
            report += f"""
ERRORS:
-------
Total errors encountered: {len(self.stats['errors'])}
"""
            for error in self.stats['errors'][:10]:  # Show first 10 errors
                report += f"  - {error}\n"
        else:
            report += f"""
ERRORS: None - Pipeline executed successfully!
"""
        
        report += f"""
=============================================================================
Pipeline execution completed successfully!
Total runtime: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
=============================================================================
"""
        
        return report
    
    def run_complete_pipeline(self):
        """Execute all phases of the pipeline."""
        start_time = datetime.now()
        logger.info("Starting Autonomous Product Discovery Import Pipeline")
        
        try:
            # Phase 1: Import products
            logger.info("=== PHASE 1: IMPORTING PRODUCTS ===")
            empty_solutions = self.get_empty_solutions()
            
            for solution in empty_solutions:
                self.import_products_for_solution(solution)
            
            # Phase 2: Audit products
            logger.info("=== PHASE 2: AUDITING PRODUCTS ===")
            self.audit_all_products()
            
            # Phase 3: Cleanup
            logger.info("=== PHASE 3: CLEANING UP ===")
            self.cleanup_flagged_products()
            
            # Phase 4: Update frontend
            logger.info("=== PHASE 4: UPDATING FRONTEND ===")
            self.update_frontend_mappings()
            
            # Phase 5: Generate report
            logger.info("=== PHASE 5: GENERATING REPORT ===")
            final_report = self.generate_final_report()
            
            # Save report to file
            report_filename = f'/Volumes/Dave\'s Mac/prox-product-discovery/prox_autonomous_discovery/logs/final_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
            with open(report_filename, 'w') as f:
                f.write(final_report)
            
            end_time = datetime.now()
            runtime = end_time - start_time
            
            logger.info(f"Pipeline completed successfully in {runtime}")
            logger.info(f"Final report saved to: {report_filename}")
            
            return final_report
            
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            self.stats['errors'].append(f"Pipeline failure: {e}")
            return f"Pipeline failed with error: {e}"

def main():
    """Main execution function."""
    pipeline = AutonomousImportPipeline()
    return pipeline.run_complete_pipeline()

if __name__ == "__main__":
    report = main()
    print("\n" + "="*80)
    print("FINAL REPORT")
    print("="*80)
    print(report)