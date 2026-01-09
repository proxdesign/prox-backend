#!/usr/bin/env python3
"""
Test script to verify Rainforest API is working
"""
import requests
import json

RAINFOREST_API_KEY = '1BB720F0F7B8459B89A3DCCBC83AD0C0'
RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request'

def test_rainforest_api():
    """Test a simple search with the Rainforest API"""
    params = {
        'api_key': RAINFOREST_API_KEY,
        'type': 'search',
        'amazon_domain': 'amazon.com',
        'search_term': 'sofa',
        'max_results': 3
    }
    
    try:
        print("Testing Rainforest API...")
        response = requests.get(RAINFOREST_BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Results found: {len(data.get('search_results', []))}")
        
        if 'search_results' in data:
            for i, item in enumerate(data['search_results'][:2]):
                print(f"\nProduct {i+1}:")
                print(f"  Title: {item.get('title', 'N/A')}")
                print(f"  Price: {item.get('price', 'N/A')}")
                print(f"  ASIN: {item.get('asin', 'N/A')}")
        
        return True
        
    except requests.RequestException as e:
        print(f"API Error: {e}")
        return False
    except Exception as e:
        print(f"General Error: {e}")
        return False

if __name__ == "__main__":
    if test_rainforest_api():
        print("\n✅ Rainforest API is working!")
    else:
        print("\n❌ Rainforest API test failed!")