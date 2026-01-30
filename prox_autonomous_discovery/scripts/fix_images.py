#!/usr/bin/env python3
"""Fix broken Amazon image URLs that use ASINs instead of real image IDs."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import db

def main():
    # Count broken images (those with /I/B0 pattern - ASINs start with B0)
    result = db.fetch_one(
        "SELECT COUNT(*) FROM products WHERE image_url LIKE '%/I/B0%'"
    )
    print(f"Products with broken images: {result[0]}")

    if result[0] == 0:
        print("No broken images to fix")
        return

    # Update broken image URLs to NULL so frontend can handle gracefully
    db.execute(
        "UPDATE products SET image_url = NULL WHERE image_url LIKE '%/I/B0%'"
    )
    print("Fixed - set broken image URLs to NULL")

    # Verify
    result = db.fetch_one(
        "SELECT COUNT(*) FROM products WHERE image_url LIKE '%/I/B0%'"
    )
    print(f"Products with broken images after fix: {result[0]}")

if __name__ == "__main__":
    main()
