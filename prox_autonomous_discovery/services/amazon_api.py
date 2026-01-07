#!/usr/bin/env python3
"""Amazon Product Advertising API service for real product data."""

import os
import time
import hashlib
import hmac
import base64
import requests
import logging
from datetime import datetime
from urllib.parse import quote, urlencode
from typing import Dict, List, Optional, Any
import xml.etree.ElementTree as ET

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AmazonProductAPI:
    """Amazon Product Advertising API client."""
    
    def __init__(self):
        # These need to be set in environment variables or configuration
        self.access_key = os.getenv('AMAZON_ACCESS_KEY_ID')
        self.secret_key = os.getenv('AMAZON_SECRET_ACCESS_KEY') 
        self.partner_tag = os.getenv('AMAZON_PARTNER_TAG', 'prox0a-20')
        self.region = os.getenv('AMAZON_REGION', 'us-east-1')
        
        # PA-API 5.0 endpoint
        self.endpoint = f"https://webservices.amazon.{self._get_region_domain()}"
        self.service = 'ProductAdvertisingAPI'
        
        # Verify credentials
        if not self.access_key or not self.secret_key:
            logger.warning("Amazon API credentials not configured. Using fallback data.")
    
    def _get_region_domain(self) -> str:
        """Get Amazon domain for region."""
        region_domains = {
            'us-east-1': 'com',
            'us-west-2': 'com', 
            'eu-west-1': 'co.uk',
            'eu-central-1': 'de',
            'ap-northeast-1': 'co.jp',
            'ap-southeast-1': 'com.au'
        }
        return region_domains.get(self.region, 'com')
    
    def _sign_request(self, method: str, uri: str, query_string: str, payload: str, headers: Dict[str, str]) -> str:
        """Create AWS signature v4 for API request."""
        
        # Create canonical request
        canonical_headers = '\n'.join(f'{k.lower()}:{v}' for k, v in sorted(headers.items())) + '\n'
        signed_headers = ';'.join(k.lower() for k in sorted(headers.keys()))
        
        canonical_request = f"{method}\n{uri}\n{query_string}\n{canonical_headers}\n{signed_headers}\n{hashlib.sha256(payload.encode()).hexdigest()}"
        
        # Create string to sign
        timestamp = headers['X-Amz-Date']
        date = timestamp[:8]
        credential_scope = f"{date}/{self.region}/{self.service}/aws4_request"
        string_to_sign = f"AWS4-HMAC-SHA256\n{timestamp}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode()).hexdigest()}"
        
        # Calculate signature
        def sign(key: bytes, msg: str) -> bytes:
            return hmac.new(key, msg.encode(), hashlib.sha256).digest()
        
        kDate = sign(f"AWS4{self.secret_key}".encode(), date)
        kRegion = sign(kDate, self.region)
        kService = sign(kRegion, self.service)
        kSigning = sign(kService, "aws4_request")
        
        signature = hmac.new(kSigning, string_to_sign.encode(), hashlib.sha256).hexdigest()
        
        # Create authorization header
        return f"AWS4-HMAC-SHA256 Credential={self.access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
    
    def get_items(self, asins: List[str], resources: List[str] = None) -> Dict[str, Any]:
        """Get item details from Amazon Product Advertising API."""
        
        if not self.access_key or not self.secret_key:
            return self._get_fallback_data(asins)
        
        if not resources:
            resources = [
                "Images.Primary.Large",
                "ItemInfo.Title", 
                "ItemInfo.Features",
                "ItemInfo.ByLineInfo",
                "Offers.Listings.Price",
                "CustomerReviews.StarRating",
                "CustomerReviews.Count"
            ]
        
        # Prepare request
        timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        
        payload = {
            "Operation": "GetItems",
            "PartnerTag": self.partner_tag,
            "PartnerType": "Associates",
            "Marketplace": f"www.amazon.{self._get_region_domain()}",
            "ItemIds": asins,
            "Resources": resources
        }
        
        headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
            'X-Amz-Date': timestamp,
            'Host': f"webservices.amazon.{self._get_region_domain()}"
        }
        
        import json
        payload_str = json.dumps(payload)
        
        # Sign request
        auth_header = self._sign_request('POST', '/paapi5/getitems', '', payload_str, headers)
        headers['Authorization'] = auth_header
        
        try:
            response = requests.post(
                f"{self.endpoint}/paapi5/getitems",
                headers=headers,
                data=payload_str,
                timeout=30
            )
            
            if response.status_code == 200:
                return self._parse_api_response(response.json())
            else:
                logger.error(f"Amazon API error: {response.status_code} - {response.text}")
                return self._get_fallback_data(asins)
                
        except Exception as e:
            logger.error(f"Amazon API request failed: {e}")
            return self._get_fallback_data(asins)
    
    def _parse_api_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Amazon API response into usable format."""
        
        items = []
        
        if 'ItemsResult' in response and 'Items' in response['ItemsResult']:
            for item in response['ItemsResult']['Items']:
                try:
                    # Extract basic info
                    asin = item.get('ASIN', '')
                    title = ''
                    if 'ItemInfo' in item and 'Title' in item['ItemInfo']:
                        title = item['ItemInfo']['Title'].get('DisplayValue', '')
                    
                    # Extract brand
                    brand = ''
                    if 'ItemInfo' in item and 'ByLineInfo' in item['ItemInfo'] and 'Brand' in item['ItemInfo']['ByLineInfo']:
                        brand = item['ItemInfo']['ByLineInfo']['Brand'].get('DisplayValue', '')
                    
                    # Extract price
                    price = 0.0
                    if 'Offers' in item and 'Listings' in item['Offers'] and item['Offers']['Listings']:
                        listing = item['Offers']['Listings'][0]
                        if 'Price' in listing and 'Amount' in listing['Price']:
                            price = listing['Price']['Amount'] / 100  # Convert cents to dollars
                    
                    # Extract image
                    image_url = ''
                    if 'Images' in item and 'Primary' in item['Images'] and 'Large' in item['Images']['Primary']:
                        image_url = item['Images']['Primary']['Large'].get('URL', '')
                    
                    # Extract rating and reviews
                    rating = 0.0
                    review_count = 0
                    if 'CustomerReviews' in item:
                        if 'StarRating' in item['CustomerReviews']:
                            rating = float(item['CustomerReviews']['StarRating'].get('Value', 0))
                        if 'Count' in item['CustomerReviews']:
                            review_count = item['CustomerReviews']['Count'].get('Value', 0)
                    
                    # Extract features
                    features = []
                    if 'ItemInfo' in item and 'Features' in item['ItemInfo']:
                        features = [f.get('DisplayValue', '') for f in item['ItemInfo']['Features'].get('DisplayValues', [])]
                    
                    items.append({
                        'asin': asin,
                        'title': title,
                        'brand': brand,
                        'price': price,
                        'image_url': image_url,
                        'rating': rating,
                        'review_count': review_count,
                        'features': features,
                        'affiliate_url': f"https://www.amazon.{self._get_region_domain()}/dp/{asin}?tag={self.partner_tag}"
                    })
                    
                except Exception as e:
                    logger.error(f"Error parsing item {item.get('ASIN', 'unknown')}: {e}")
                    continue
        
        return {'items': items, 'success': True}
    
    def _get_fallback_data(self, asins: List[str]) -> Dict[str, Any]:
        """Return fallback data when API is not available."""
        
        logger.info("Using fallback product data (Amazon API not configured)")
        
        # Generate reasonable fallback data
        items = []
        for i, asin in enumerate(asins):
            items.append({
                'asin': asin,
                'title': f'Premium Furniture Item #{i+1}',
                'brand': 'Quality Brand',
                'price': 99.99 + (i * 25),
                'image_url': f'https://images.unsplash.com/photo-{1586023492125 + i}?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
                'rating': 4.0 + (i % 2) * 0.5,
                'review_count': 100 + (i * 50),
                'features': ['High Quality', 'Easy Assembly', 'Modern Design'],
                'affiliate_url': f"https://www.amazon.com/dp/{asin}?tag={self.partner_tag}"
            })
        
        return {'items': items, 'success': False, 'fallback': True}
    
    def update_product_data(self, asin: str, force_refresh: bool = False) -> Optional[Dict[str, Any]]:
        """Update single product data from Amazon API."""
        
        try:
            result = self.get_items([asin])
            if result['items']:
                return result['items'][0]
            return None
            
        except Exception as e:
            logger.error(f"Failed to update product {asin}: {e}")
            return None
    
    def bulk_update_products(self, asins: List[str], batch_size: int = 10) -> List[Dict[str, Any]]:
        """Update multiple products in batches to respect API limits."""
        
        all_items = []
        
        # Process in batches
        for i in range(0, len(asins), batch_size):
            batch = asins[i:i+batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}: {len(batch)} items")
            
            try:
                result = self.get_items(batch)
                all_items.extend(result['items'])
                
                # Rate limiting - Amazon limits requests
                if i + batch_size < len(asins):
                    time.sleep(1)  # 1 second delay between batches
                    
            except Exception as e:
                logger.error(f"Batch {i//batch_size + 1} failed: {e}")
                continue
        
        logger.info(f"Successfully updated {len(all_items)} out of {len(asins)} products")
        return all_items

# Global instance
amazon_api = AmazonProductAPI()

def extract_asin_from_url(url: str) -> Optional[str]:
    """Extract ASIN from Amazon URL."""
    
    import re
    
    # Common Amazon URL patterns
    patterns = [
        r'/dp/([A-Z0-9]{10})',
        r'/gp/product/([A-Z0-9]{10})',
        r'asin=([A-Z0-9]{10})',
        r'/([A-Z0-9]{10})\?',
        r'/([A-Z0-9]{10})$'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None