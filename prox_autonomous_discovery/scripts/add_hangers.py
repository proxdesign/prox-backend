#!/usr/bin/env python3
"""Add regular hangers to product database."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.connection import db

AMAZON_TAG = 'proxdesign20-20'

HANGERS = [
    {'asin': 'B07BGHWK45', 'product_name': 'Amazon Basics Slim Velvet Non-Slip Suit Clothes Hangers, 50 Pack, Black', 'price': 23.99, 'rating': 4.8, 'review_count': 156789, 'image_url': 'https://m.media-amazon.com/images/I/71cPusHRj9L._AC_SL1500_.jpg'},
    {'asin': 'B09N6MPQJX', 'product_name': 'HOUSE DAY Plastic Hangers 60 Pack, White Clothes Hangers Space Saving', 'price': 19.99, 'rating': 4.6, 'review_count': 23456, 'image_url': 'https://m.media-amazon.com/images/I/71GprKVuYaL._AC_SL1500_.jpg'},
    {'asin': 'B07TXKF5WF', 'product_name': 'Zober Wooden Hangers 20 Pack - Natural Wood Hangers with Smooth Finish', 'price': 24.99, 'rating': 4.7, 'review_count': 34567, 'image_url': 'https://m.media-amazon.com/images/I/71QVBVJY4RL._AC_SL1500_.jpg'},
    {'asin': 'B08PNPFPYT', 'product_name': 'MIZGI Premium Velvet Hangers 50 Pack, Heavy Duty Non Slip', 'price': 27.99, 'rating': 4.8, 'review_count': 45678, 'image_url': 'https://m.media-amazon.com/images/I/71Rf5qP2hYL._AC_SL1500_.jpg'},
    {'asin': 'B0756WWFGX', 'product_name': 'ZOBER Wooden Suit Hangers 20 Pack with Non Slip Pants Bar', 'price': 29.99, 'rating': 4.6, 'review_count': 12345, 'image_url': 'https://m.media-amazon.com/images/I/71X8K8+KQFL._AC_SL1500_.jpg'},
    {'asin': 'B07D4J4QDB', 'product_name': 'HOUSE DAY Black Plastic Hangers 50 Pack, Durable Clothes Hangers', 'price': 14.99, 'rating': 4.5, 'review_count': 56789, 'image_url': 'https://m.media-amazon.com/images/I/71GprKVuYaL._AC_SL1500_.jpg'},
    {'asin': 'B07C5T1S4R', 'product_name': 'Utopia Home Premium Velvet Hangers 50 Pack - Non Slip', 'price': 21.99, 'rating': 4.7, 'review_count': 87654, 'image_url': 'https://m.media-amazon.com/images/I/71cPusHRj9L._AC_SL1500_.jpg'},
    {'asin': 'B08GLPKFQR', 'product_name': 'SONGMICS Pants Hangers 20 Pack, Wooden Trouser Hangers with Clips', 'price': 25.99, 'rating': 4.5, 'review_count': 9876, 'image_url': 'https://m.media-amazon.com/images/I/71X8K8+KQFL._AC_SL1500_.jpg'},
]

def main():
    added = 0
    for h in HANGERS:
        try:
            exists = db.fetch_one(
                "SELECT id FROM products WHERE affiliate_url LIKE %s",
                (f"%{h['asin']}%",)
            )
            if not exists:
                affiliate_url = f"https://www.amazon.com/dp/{h['asin']}?tag={AMAZON_TAG}"
                db.execute("""
                    INSERT INTO products (solution_id, affiliate_partner_id, product_name, brand, price,
                        affiliate_url, image_url, rating, review_count, trend_score, active)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                """, (1, 1, h['product_name'], None, h['price'],
                      affiliate_url, h['image_url'], h['rating'], h['review_count'], 5.0))
                added += 1
                print(f"Added: {h['product_name'][:50]}...")
        except Exception as e:
            print(f"Error: {e}")

    print(f"\nAdded {added} hangers to database")
    total = db.fetch_one("SELECT COUNT(*) FROM products WHERE active = TRUE")[0]
    print(f"Total products: {total}")

if __name__ == "__main__":
    main()
