#!/usr/bin/env python3
"""
Simple script to add a few furniture products using Rainforest API
"""
import requests
import json
import os
import sys
from typing import List, Dict
import time

# Add the parent directory to sys.path to import database utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import db

RAINFOREST_API_KEY = '1BB720F0F7B8459B89A3DCCBC83AD0C0'
RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request'

FURNITURE_CATEGORIES = [
    "sofa",
    "couch", 
    "dining chair",
    "desk",
    "bookshelf",
    "table lamp"
]

def fetch_products_for_category(category: str, max_products: int = 5) -> List[Dict]:
    """Fetch products for a specific furniture category from Rainforest API"""
    params = {
        'api_key': RAINFOREST_API_KEY,
        'type': 'search',
        'amazon_domain': 'amazon.com',
        'search_term': category,
        'max_results': max_products
    }
    
    try:
        print(f"Fetching {category}...")
        response = requests.get(RAINFOREST_BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        products = []
        if 'search_results' in data:
            for item in data['search_results']:
                price_value = 0.0
                if 'price' in item and item['price']:
                    price_data = item['price']
                    if isinstance(price_data, dict):
                        price_value = price_data.get('value', 0.0)
                    elif isinstance(price_data, (int, float)):
                        price_value = float(price_data)
                
                product = {
                    'title': item.get('title', '')[:500],  # Truncate long titles
                    'price': price_value,
                    'image_url': item.get('image', ''),
                    'rating': item.get('rating', 0) or 0,
                    'reviews_count': item.get('reviews_total', 0) or 0,
                    'asin': item.get('asin', ''),
                    'category': category,
                    'url': item.get('link', '')
                }
                
                if product['title'] and product['image_url'] and product['asin']:
                    products.append(product)
        
        print(f"  Found {len(products)} valid products for {category}")
        return products
        
    except requests.RequestException as e:
        print(f"Error fetching products for {category}: {e}")
        return []

def save_products_to_db(products: List[Dict]):
    """Save products to the database"""
    # Check if products table exists, if not create it
    db.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            price DECIMAL(10,2),
            image_url TEXT,
            rating DECIMAL(3,2),
            reviews_count INTEGER,
            asin VARCHAR(20) UNIQUE,
            category VARCHAR(100),
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    saved_count = 0
    # Insert products
    for product in products:
        try:
            rows_affected = db.execute("""
                INSERT INTO products (title, price, image_url, rating, reviews_count, asin, category, url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (asin) DO NOTHING
            """, (
                product['title'],
                product['price'],
                product['image_url'],
                product['rating'],
                product['reviews_count'],
                product['asin'],
                product['category'],
                product['url']
            ))
            if rows_affected > 0:
                saved_count += 1
        except Exception as e:
            print(f"Error inserting product {product['title']}: {e}")
            continue
    
    print(f"Saved {saved_count} new products to database")
    return saved_count

def main():
    """Main function to fetch and save furniture products"""
    all_products = []
    
    print("Fetching furniture products from Rainforest API...")
    
    for category in FURNITURE_CATEGORIES:
        products = fetch_products_for_category(category, max_products=5)
        all_products.extend(products)
        
        # Add delay to avoid rate limiting
        time.sleep(2)
    
    print(f"\nTotal products fetched: {len(all_products)}")
    
    if all_products:
        print("Saving products to database...")
        saved_count = save_products_to_db(all_products)
        print(f"✅ Successfully added {saved_count} furniture products!")
        
        # Print summary
        category_counts = {}
        for product in all_products:
            category = product['category']
            category_counts[category] = category_counts.get(category, 0) + 1
        
        print("\nProducts fetched by category:")
        for category, count in category_counts.items():
            print(f"  {category}: {count}")
    else:
        print("❌ No products were fetched")

if __name__ == "__main__":
    main()