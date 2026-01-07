#!/usr/bin/env python3
"""Test script for Amazon Product Advertising API integration."""

import asyncio
import sys
import os
import json
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from services.amazon_api import amazon_api, extract_asin_from_url
from services.amazon_data_updater import amazon_updater

async def test_credentials():
    """Test if Amazon API credentials are configured."""
    print("🔑 Testing Amazon API Credentials...")
    
    has_credentials = bool(amazon_api.access_key and amazon_api.secret_key)
    
    print(f"   Access Key: {'✓ Configured' if amazon_api.access_key else '✗ Missing'}")
    print(f"   Secret Key: {'✓ Configured' if amazon_api.secret_key else '✗ Missing'}")
    print(f"   Partner Tag: {amazon_api.partner_tag}")
    print(f"   Region: {amazon_api.region}")
    print(f"   Fallback Mode: {'✓' if not has_credentials else '✗'}")
    print()
    
    return has_credentials

def test_asin_extraction():
    """Test ASIN extraction from various Amazon URLs."""
    print("🔍 Testing ASIN Extraction...")
    
    test_urls = [
        "https://www.amazon.com/dp/B08N5WRWNW",
        "https://amazon.com/gp/product/B08N5WRWNW",
        "https://www.amazon.com/Some-Product-Name/dp/B08N5WRWNW/ref=sr_1_1",
        "https://amazon.com/dp/B08N5WRWNW?tag=prox0a-20",
    ]
    
    for url in test_urls:
        asin = extract_asin_from_url(url)
        print(f"   {url} -> {asin}")
    
    print()

async def test_api_call():
    """Test Amazon API call with sample ASINs."""
    print("📞 Testing Amazon API Call...")
    
    # Test with a few common furniture ASINs
    test_asins = ['B08N5WRWNW', 'B07RYKX4Q7', 'B0B2RZ9QJY']
    
    try:
        result = amazon_api.get_items(test_asins)
        
        if result.get('success'):
            print(f"   ✓ API call successful!")
            print(f"   ✓ Returned {len(result.get('items', []))} items")
            
            for item in result.get('items', [])[:2]:  # Show first 2 items
                print(f"   - {item['asin']}: {item['title'][:50]}...")
                print(f"     Price: ${item['price']}")
                print(f"     Rating: {item['rating']} ({item['review_count']} reviews)")
        else:
            print(f"   ✗ API call failed or using fallback data")
            print(f"   ℹ Returned {len(result.get('items', []))} fallback items")
            
    except Exception as e:
        print(f"   ✗ API call failed: {e}")
    
    print()

async def test_database_status():
    """Test database update status."""
    print("💾 Testing Database Status...")
    
    try:
        status = await amazon_updater.get_update_status()
        
        if status['success']:
            stats = status['stats']
            print(f"   Total Products: {stats['total_products']}")
            print(f"   Amazon Products: {stats['amazon_products']}")
            print(f"   Updated Products: {stats['updated_products']}")
            print(f"   Placeholder Images: {stats['placeholder_images']}")
            print(f"   With Amazon Data: {stats['with_amazon_data']}")
            print(f"   Needs Update: {status['needs_update']}")
        else:
            print(f"   ✗ Failed to get database status: {status.get('message')}")
            
    except Exception as e:
        print(f"   ✗ Database status failed: {e}")
    
    print()

async def test_single_update():
    """Test updating a single product."""
    print("🔄 Testing Single Product Update...")
    
    try:
        # Get a product that needs updating
        products = await amazon_updater.get_products_needing_update(1)
        
        if not products:
            print("   ℹ No products found that need updating")
            return
        
        product = products[0]
        print(f"   Testing with product {product['id']}: {product['product_name']}")
        
        result = await amazon_updater.update_single_product(product['id'])
        
        if result['success']:
            print(f"   ✓ Successfully updated product {product['id']}")
            if 'amazon_data' in result:
                data = result['amazon_data']
                print(f"   - ASIN: {data.get('asin')}")
                print(f"   - Price: ${data.get('price', 0):.2f}")
                print(f"   - Rating: {data.get('rating', 0)}")
        else:
            print(f"   ✗ Failed to update product: {result['message']}")
            
    except Exception as e:
        print(f"   ✗ Single update test failed: {e}")
    
    print()

async def main():
    """Run all tests."""
    print("🛠️  Amazon Product API Integration Test")
    print("=" * 50)
    print()
    
    # Test credentials
    has_credentials = await test_credentials()
    
    # Test ASIN extraction
    test_asin_extraction()
    
    # Test API call
    await test_api_call()
    
    # Test database status
    await test_database_status()
    
    # Test single update
    if has_credentials:
        await test_single_update()
    else:
        print("⚠️  Skipping single update test (no credentials)")
        print()
    
    print("🏁 Test Complete!")
    
    if not has_credentials:
        print()
        print("💡 To enable real Amazon API integration:")
        print("   1. Set AMAZON_ACCESS_KEY_ID environment variable")
        print("   2. Set AMAZON_SECRET_ACCESS_KEY environment variable")
        print("   3. Set AMAZON_PARTNER_TAG environment variable (optional)")

if __name__ == "__main__":
    asyncio.run(main())