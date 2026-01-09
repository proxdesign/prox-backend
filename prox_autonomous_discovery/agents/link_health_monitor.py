"""Monitor affiliate link health and deactivate products with broken links."""
import requests
from agents.base_agent import BaseAgent
from database.connection import db


class LinkHealthMonitor(BaseAgent):
    """Monitors affiliate link health and deactivates products with broken links."""
    
    def __init__(self):
        super().__init__("link_health_monitor")
        self.timeout = 10
        self.broken_links = []
        self.session = requests.Session()
        
        # Set a reasonable user agent to avoid blocking
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def run(self) -> dict:
        """Check all active product affiliate links for availability."""
        
        # Get active products with affiliate URLs
        products = db.fetch_all("""
            SELECT id, product_name, affiliate_url, price
            FROM products 
            WHERE active = TRUE 
            AND affiliate_url IS NOT NULL
            AND affiliate_url != ''
            ORDER BY created_at DESC
        """)
        
        if not products:
            self.log_info("No products with affiliate URLs found")
            return {
                "checked": 0,
                "broken": 0,
                "working": 0,
                "broken_products": []
            }
        
        self.items_processed = len(products)
        self.log_info(f"Checking {len(products)} product links...")
        
        working_count = 0
        
        for product in products:
            product_id, name, url, price = product
            
            try:
                # Use HEAD request to check link without downloading content
                response = self.session.head(
                    url, 
                    timeout=self.timeout, 
                    allow_redirects=True
                )
                
                if response.status_code >= 400:
                    self._mark_broken(product_id, name, url, f"HTTP {response.status_code}")
                else:
                    working_count += 1
                    self.log_info(f"✓ {name[:50]}... - Working ({response.status_code})")
                    
            except requests.Timeout:
                self._mark_broken(product_id, name, url, "Request timeout")
            except requests.ConnectionError:
                self._mark_broken(product_id, name, url, "Connection failed")
            except requests.RequestException as e:
                self._mark_broken(product_id, name, url, f"Request error: {str(e)[:100]}")
            except Exception as e:
                self.log_error(f"Unexpected error checking {name}: {str(e)}")
        
        result = {
            "checked": self.items_processed,
            "broken": self.items_affected,
            "working": working_count,
            "broken_products": self.broken_links
        }
        
        # Log summary
        if self.items_affected > 0:
            self.log_warning(f"Found {self.items_affected} broken links out of {self.items_processed} checked")
        else:
            self.log_info(f"All {self.items_processed} links are working properly")
        
        return result
    
    def _mark_broken(self, product_id: int, name: str, url: str, reason: str):
        """Mark product as inactive due to broken link."""
        
        try:
            # Update product to inactive
            db.execute_query("""
                UPDATE products 
                SET active = FALSE, 
                    last_updated = NOW()
                WHERE id = %s
            """, (product_id,), fetch=False)
            
            self.items_affected += 1
            self.broken_links.append({
                "id": product_id,
                "name": name[:100],  # Truncate long names
                "url": url[:100],    # Truncate long URLs
                "reason": reason
            })
            
            self.log_warning(f"✗ Deactivated product {product_id} ({name[:50]}...): {reason}")
            
        except Exception as e:
            self.log_error(f"Failed to deactivate product {product_id}: {e}")


def main():
    """Run link health monitor standalone."""
    import logging
    logging.basicConfig(level=logging.INFO)
    
    agent = LinkHealthMonitor()
    result = agent.execute()
    print(f"Link Health Monitor Results:")
    print(f"  - Checked: {result['checked']} products")
    print(f"  - Working: {result['working']} links")
    print(f"  - Broken: {result['broken']} links")
    
    if result['broken_products']:
        print("\nBroken products:")
        for product in result['broken_products']:
            print(f"  - {product['name']}: {product['reason']}")


if __name__ == "__main__":
    main()