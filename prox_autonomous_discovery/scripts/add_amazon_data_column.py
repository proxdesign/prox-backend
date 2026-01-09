#!/usr/bin/env python3
"""Add amazon_data column to products table for storing Amazon API metadata."""

import psycopg
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_amazon_data_column():
    """Add amazon_data JSONB column to products table."""
    
    try:
        DATABASE_URL = os.getenv('DATABASE_URL')
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Check if column already exists
                check_query = """
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='products' AND column_name='amazon_data'
                """
                cursor.execute(check_query)
                
                if cursor.fetchone():
                    logger.info("amazon_data column already exists")
                    return True
                
                # Add the column
                alter_query = """
                    ALTER TABLE products 
                    ADD COLUMN amazon_data JSONB
                """
                
                cursor.execute(alter_query)
                conn.commit()
                
                logger.info("Successfully added amazon_data column to products table")
                return True
                
    except Exception as e:
        logger.error(f"Error adding amazon_data column: {e}")
        return False

if __name__ == "__main__":
    success = add_amazon_data_column()
    if success:
        print("✓ Amazon data column added successfully")
    else:
        print("✗ Failed to add amazon_data column")
        exit(1)