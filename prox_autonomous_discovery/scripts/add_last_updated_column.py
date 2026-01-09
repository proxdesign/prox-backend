#!/usr/bin/env python3
"""Add last_updated column to products table."""

import psycopg
import os
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_last_updated_column():
    """Add last_updated TIMESTAMP column to products table."""
    
    try:
        DATABASE_URL = os.getenv('DATABASE_URL')
        with psycopg.connect(DATABASE_URL) as conn:
            with conn.cursor() as cursor:
                # Check if column already exists
                check_query = """
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='products' AND column_name='last_updated'
                """
                cursor.execute(check_query)
                
                if cursor.fetchone():
                    logger.info("last_updated column already exists")
                    return True
                
                # Add the column
                alter_query = """
                    ALTER TABLE products 
                    ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE
                """
                
                cursor.execute(alter_query)
                conn.commit()
                
                logger.info("Successfully added last_updated column to products table")
                return True
                
    except Exception as e:
        logger.error(f"Error adding last_updated column: {e}")
        return False

if __name__ == "__main__":
    success = add_last_updated_column()
    if success:
        print("✓ Last updated column added successfully")
    else:
        print("✗ Failed to add last_updated column")
        exit(1)