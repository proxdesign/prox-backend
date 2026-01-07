#!/usr/bin/env python3
"""Service to update product database with real Amazon product data."""

import asyncio
import logging
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

from .amazon_api import amazon_api, extract_asin_from_url

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AmazonDataUpdater:
    """Updates product database with Amazon Product Advertising API data."""
    
    def __init__(self, database_url: str = None):
        self.database_url = database_url or os.getenv('DATABASE_URL')
        
    async def connect_db(self):
        """Create database connection."""
        return await psycopg.AsyncConnection.connect(
            self.database_url,
            row_factory=dict_row
        )
    
    async def get_products_needing_update(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get products that need Amazon data updates."""
        
        async with await self.connect_db() as conn:
            # Get products with Amazon URLs that haven't been updated recently
            # or have placeholder/broken images
            query = """
                SELECT id, product_name, affiliate_url, image_url, 
                       last_updated, brand, price
                FROM products 
                WHERE (
                    affiliate_url LIKE %s
                    AND (
                        last_updated IS NULL 
                        OR last_updated < NOW() - INTERVAL '7 days'
                        OR image_url LIKE %s
                        OR image_url = ''
                        OR image_url IS NULL
                    )
                )
                ORDER BY last_updated ASC NULLS FIRST
                LIMIT %s
            """
            
            async with conn.cursor() as cursor:
                await cursor.execute(query, ('%amazon%', '%unsplash%', limit))
                return await cursor.fetchall()
    
    async def extract_asins_from_products(self, products: List[Dict[str, Any]]) -> Dict[int, str]:
        """Extract ASINs from product affiliate URLs."""
        
        product_asins = {}
        
        for product in products:
            asin = extract_asin_from_url(product['affiliate_url'])
            if asin:
                product_asins[product['id']] = asin
                logger.info(f"Extracted ASIN {asin} for product {product['id']}: {product['product_name']}")
            else:
                logger.warning(f"Could not extract ASIN from URL: {product['affiliate_url']}")
        
        return product_asins
    
    async def update_product_with_amazon_data(self, product_id: int, amazon_data: Dict[str, Any]) -> bool:
        """Update a single product with Amazon API data."""
        
        try:
            async with await self.connect_db() as conn:
                update_query = """
                    UPDATE products SET
                        image_url = %s,
                        price = %s,
                        rating = %s,
                        review_count = %s,
                        affiliate_url = %s,
                        brand = COALESCE(NULLIF(brand, ''), %s),
                        last_updated = NOW(),
                        amazon_data = %s
                    WHERE id = %s
                """
                
                # Prepare the Amazon data JSON for storage
                amazon_json = {
                    'asin': amazon_data.get('asin', ''),
                    'features': amazon_data.get('features', []),
                    'api_updated': datetime.utcnow().isoformat(),
                    'fallback_used': amazon_data.get('fallback', False)
                }
                
                async with conn.cursor() as cursor:
                    await cursor.execute(update_query, (
                        amazon_data.get('image_url', ''),
                        amazon_data.get('price', 0.0),
                        amazon_data.get('rating', 0.0),
                        amazon_data.get('review_count', 0),
                        amazon_data.get('affiliate_url', ''),
                        amazon_data.get('brand', ''),
                        amazon_json,
                        product_id
                    ))
                    
                await conn.commit()
                logger.info(f"Updated product {product_id} with Amazon data")
                return True
                
        except Exception as e:
            logger.error(f"Failed to update product {product_id}: {e}")
            return False
    
    async def bulk_update_amazon_data(self, batch_size: int = 10, max_products: int = 50) -> Dict[str, Any]:
        """Update multiple products with Amazon data in batches."""
        
        logger.info(f"Starting bulk Amazon data update (max {max_products} products)")
        
        # Get products that need updating
        products = await self.get_products_needing_update(max_products)
        
        if not products:
            logger.info("No products found that need updating")
            return {
                'success': True,
                'products_updated': 0,
                'products_failed': 0,
                'message': 'No products need updating'
            }
        
        # Extract ASINs
        product_asins = await self.extract_asins_from_products(products)
        
        if not product_asins:
            logger.warning("No valid ASINs found in product URLs")
            return {
                'success': False,
                'products_updated': 0,
                'products_failed': len(products),
                'message': 'No valid ASINs found'
            }
        
        logger.info(f"Found {len(product_asins)} valid ASINs to update")
        
        # Process in batches
        asins = list(product_asins.values())
        product_ids = list(product_asins.keys())
        
        updated_count = 0
        failed_count = 0
        
        for i in range(0, len(asins), batch_size):
            batch_asins = asins[i:i+batch_size]
            batch_product_ids = product_ids[i:i+batch_size]
            
            logger.info(f"Processing batch {i//batch_size + 1}: {len(batch_asins)} ASINs")
            
            try:
                # Get Amazon data for this batch
                amazon_result = amazon_api.bulk_update_products(batch_asins, batch_size)
                
                # Create mapping of ASIN to Amazon data
                asin_to_data = {}
                for item in amazon_result:
                    asin_to_data[item['asin']] = item
                
                # Update each product in the batch
                for j, product_id in enumerate(batch_product_ids):
                    asin = batch_asins[j]
                    
                    if asin in asin_to_data:
                        amazon_data = asin_to_data[asin]
                        success = await self.update_product_with_amazon_data(product_id, amazon_data)
                        
                        if success:
                            updated_count += 1
                        else:
                            failed_count += 1
                    else:
                        logger.warning(f"No Amazon data returned for ASIN {asin}")
                        failed_count += 1
                
                # Rate limiting between batches
                if i + batch_size < len(asins):
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Batch {i//batch_size + 1} failed: {e}")
                failed_count += len(batch_product_ids)
        
        logger.info(f"Bulk update complete: {updated_count} updated, {failed_count} failed")
        
        return {
            'success': True,
            'products_updated': updated_count,
            'products_failed': failed_count,
            'total_products': len(products),
            'message': f'Updated {updated_count} products successfully'
        }
    
    async def update_single_product(self, product_id: int) -> Dict[str, Any]:
        """Update a single product with Amazon data."""
        
        try:
            async with await self.connect_db() as conn:
                # Get product info
                query = "SELECT affiliate_url, product_name FROM products WHERE id = %s"
                async with conn.cursor() as cursor:
                    await cursor.execute(query, (product_id,))
                    product = await cursor.fetchone()
                
                if not product:
                    return {
                        'success': False,
                        'message': f'Product {product_id} not found'
                    }
                
                # Extract ASIN
                asin = extract_asin_from_url(product['affiliate_url'])
                if not asin:
                    return {
                        'success': False,
                        'message': f'Could not extract ASIN from URL: {product["affiliate_url"]}'
                    }
                
                # Get Amazon data
                amazon_data = amazon_api.update_product_data(asin)
                if not amazon_data:
                    return {
                        'success': False,
                        'message': f'Failed to get Amazon data for ASIN: {asin}'
                    }
                
                # Update product
                success = await self.update_product_with_amazon_data(product_id, amazon_data)
                
                if success:
                    return {
                        'success': True,
                        'message': f'Updated product {product_id} ({product["product_name"]}) with Amazon data',
                        'amazon_data': amazon_data
                    }
                else:
                    return {
                        'success': False,
                        'message': f'Failed to update database for product {product_id}'
                    }
                
        except Exception as e:
            logger.error(f"Error updating single product {product_id}: {e}")
            return {
                'success': False,
                'message': f'Error updating product {product_id}: {str(e)}'
            }
    
    async def get_update_status(self) -> Dict[str, Any]:
        """Get status of Amazon data updates."""
        
        try:
            async with await self.connect_db() as conn:
                # Count products by update status
                status_query = """
                    SELECT 
                        COUNT(*) as total_products,
                        COUNT(CASE WHEN affiliate_url LIKE '%amazon%' THEN 1 END) as amazon_products,
                        COUNT(CASE WHEN last_updated IS NOT NULL THEN 1 END) as updated_products,
                        COUNT(CASE WHEN image_url LIKE '%unsplash%' OR image_url = '' OR image_url IS NULL THEN 1 END) as placeholder_images,
                        COUNT(CASE WHEN amazon_data IS NOT NULL THEN 1 END) as with_amazon_data
                    FROM products
                """
                
                async with conn.cursor() as cursor:
                    await cursor.execute(status_query)
                    stats = await cursor.fetchone()
                
                # Get recent updates
                recent_query = """
                    SELECT id, product_name, last_updated 
                    FROM products 
                    WHERE last_updated IS NOT NULL 
                    ORDER BY last_updated DESC 
                    LIMIT 5
                """
                
                async with conn.cursor() as cursor:
                    await cursor.execute(recent_query)
                    recent_updates = await cursor.fetchall()
                
                return {
                    'success': True,
                    'stats': dict(stats),
                    'recent_updates': recent_updates,
                    'needs_update': stats['amazon_products'] - stats['updated_products']
                }
                
        except Exception as e:
            logger.error(f"Error getting update status: {e}")
            return {
                'success': False,
                'message': f'Error getting status: {str(e)}'
            }

# Global instance
amazon_updater = AmazonDataUpdater()

# Convenience functions for API endpoints
async def update_amazon_data(max_products: int = 50) -> Dict[str, Any]:
    """Update Amazon product data - convenience function for API."""
    return await amazon_updater.bulk_update_amazon_data(max_products=max_products)

async def update_single_product_amazon_data(product_id: int) -> Dict[str, Any]:
    """Update single product Amazon data - convenience function for API."""
    return await amazon_updater.update_single_product(product_id)

async def get_amazon_update_status() -> Dict[str, Any]:
    """Get Amazon update status - convenience function for API."""
    return await amazon_updater.get_update_status()