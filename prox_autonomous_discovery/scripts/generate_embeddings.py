#!/usr/bin/env python3
"""Generate embeddings for products using Voyage AI voyage-3-lite."""

import os
import sys
import time
import logging
from typing import List, Dict

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import voyageai
import psycopg2
from psycopg2.extras import execute_batch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
EMBEDDING_MODEL = "voyage-3-lite"  # 512 dimensions
BATCH_SIZE = 10  # Smaller batches for rate limiting
DELAY_BETWEEN_BATCHES = 21  # 3 RPM = 1 request per 20 seconds, add buffer


def create_product_text(product: Dict) -> str:
    """Create searchable text from product fields."""
    parts = []

    if product.get('product_name'):
        parts.append(product['product_name'])

    if product.get('brand'):
        parts.append(f"Brand: {product['brand']}")

    # Extract keywords from product name for better matching
    name_lower = (product.get('product_name') or '').lower()

    # Add category hints based on keywords
    if any(w in name_lower for w in ['spice', 'rack', 'kitchen']):
        parts.append("kitchen organization storage")
    if any(w in name_lower for w in ['shoe', 'closet']):
        parts.append("closet organization storage")
    if any(w in name_lower for w in ['desk', 'office']):
        parts.append("home office organization")
    if any(w in name_lower for w in ['bathroom', 'shower']):
        parts.append("bathroom organization storage")
    if any(w in name_lower for w in ['drawer', 'cabinet']):
        parts.append("drawer cabinet organization")

    return " ".join(parts)


def main():
    if not VOYAGE_API_KEY:
        logger.error("VOYAGE_API_KEY environment variable not set")
        sys.exit(1)

    if not DATABASE_URL:
        logger.error("DATABASE_URL environment variable not set")
        sys.exit(1)

    # Initialize Voyage client
    client = voyageai.Client(api_key=VOYAGE_API_KEY)

    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Get products without embeddings
    cur.execute("""
        SELECT id, product_name, brand
        FROM products
        WHERE embedding IS NULL AND active = TRUE
        ORDER BY id
    """)
    products = cur.fetchall()

    total = len(products)
    logger.info(f"Found {total} products without embeddings")

    if total == 0:
        logger.info("All products already have embeddings")
        cur.close()
        conn.close()
        return

    # Process in batches with rate limiting
    processed = 0
    errors = 0

    for i in range(0, total, BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]

        try:
            # Prepare texts for batch embedding
            texts = []
            product_ids = []

            for product_id, product_name, brand in batch:
                product_dict = {
                    'product_name': product_name,
                    'brand': brand
                }
                text = create_product_text(product_dict)
                texts.append(text)
                product_ids.append(product_id)

            # Generate embeddings in batch
            result = client.embed(texts, model=EMBEDDING_MODEL, input_type="document")
            embeddings = result.embeddings

            # Prepare updates
            batch_updates = list(zip(embeddings, product_ids))

            # Batch update embeddings
            execute_batch(cur,
                "UPDATE products SET embedding = %s WHERE id = %s",
                batch_updates
            )
            conn.commit()

            processed += len(batch)
            logger.info(f"Processed {processed}/{total} products")

        except Exception as e:
            error_msg = str(e)
            if "rate limit" in error_msg.lower() or "RPM" in error_msg:
                logger.warning(f"Rate limit hit, waiting 60 seconds...")
                time.sleep(60)
                # Retry this batch
                i -= BATCH_SIZE
                continue
            else:
                logger.error(f"Error processing batch at {i}: {e}")
                errors += len(batch)
                continue

        # Rate limiting - wait between batches (3 RPM limit)
        if i + BATCH_SIZE < total:
            logger.info(f"Waiting {DELAY_BETWEEN_BATCHES}s for rate limit...")
            time.sleep(DELAY_BETWEEN_BATCHES)

    logger.info(f"Embedding generation complete: {processed} processed, {errors} errors")

    # Verify
    cur.execute("SELECT COUNT(*) FROM products WHERE embedding IS NOT NULL")
    embedded_count = cur.fetchone()[0]
    logger.info(f"Products with embeddings: {embedded_count}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
