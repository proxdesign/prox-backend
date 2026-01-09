"""Apply trend decay to products that haven't been mentioned recently."""
from datetime import datetime, timedelta
from agents.base_agent import BaseAgent
from database.connection import db


class TrendDecay(BaseAgent):
    """Applies decay to products that haven't been trending recently."""
    
    def __init__(self):
        super().__init__("trend_decay")
        self.decay_days = 30  # Start decay after 30 days
        self.archive_days = 90  # Archive after 90 days
        self.decay_amount = 1.5  # Score reduction for decay
        self.min_score = 1.0  # Don't go below this
        self.severe_decay_days = 60  # More aggressive decay after 60 days
        self.severe_decay_amount = 2.5
    
    def run(self) -> dict:
        """Apply decay to stale products and archive very old ones."""
        
        now = datetime.now()
        decay_threshold = now - timedelta(days=self.decay_days)
        severe_decay_threshold = now - timedelta(days=self.severe_decay_days)
        archive_threshold = now - timedelta(days=self.archive_days)
        
        # Get products that need attention
        products = db.fetch_all("""
            SELECT id, product_name, trend_score, last_updated, created_at, active
            FROM products 
            WHERE active = TRUE
            AND trend_score > %s
            ORDER BY last_updated ASC, created_at ASC
        """, (self.min_score,))
        
        if not products:
            self.log_info("No active products found for trend decay")
            return {
                "analyzed": 0,
                "decayed": 0,
                "severely_decayed": 0,
                "archived": 0,
                "decayed_products": [],
                "archived_products": []
            }
        
        self.items_processed = len(products)
        self.log_info(f"Analyzing trend decay for {len(products)} products...")
        
        decayed = []
        severely_decayed = []
        archived = []
        
        for product in products:
            product_id, name, score, last_updated, created_at, active = product
            
            # Use last_updated or created_at as reference date
            reference_date = last_updated or created_at
            
            if reference_date is None:
                self.log_warning(f"Product {product_id} has no reference date, skipping")
                continue
            
            age_days = (now - reference_date).days
            
            try:
                # Check if should be archived (90+ days old)
                if reference_date < archive_threshold:
                    db.execute_query("""
                        UPDATE products 
                        SET active = FALSE,
                            last_updated = NOW()
                        WHERE id = %s
                    """, (product_id,), fetch=False)
                    
                    archived.append({
                        "id": product_id, 
                        "name": name[:80], 
                        "age_days": age_days,
                        "final_score": float(score)
                    })
                    self.items_affected += 1
                    self.log_info(f"Archived {name[:50]}... (inactive for {age_days} days)")
                
                # Check if should get severe decay (60-90 days old)
                elif reference_date < severe_decay_threshold:
                    new_score = max(self.min_score, float(score) - self.severe_decay_amount)
                    
                    if new_score < float(score):
                        db.execute_query("""
                            UPDATE products 
                            SET trend_score = %s,
                                last_updated = NOW()
                            WHERE id = %s
                        """, (new_score, product_id), fetch=False)
                        
                        severely_decayed.append({
                            "id": product_id, 
                            "name": name[:80], 
                            "old_score": float(score),
                            "new_score": new_score,
                            "age_days": age_days
                        })
                        self.items_affected += 1
                        self.log_info(f"Severe decay {name[:50]}...: {score:.1f} → {new_score:.1f} ({age_days} days old)")
                
                # Check if should get regular decay (30-60 days old)
                elif reference_date < decay_threshold:
                    new_score = max(self.min_score, float(score) - self.decay_amount)
                    
                    if new_score < float(score):
                        db.execute_query("""
                            UPDATE products 
                            SET trend_score = %s,
                                last_updated = NOW()
                            WHERE id = %s
                        """, (new_score, product_id), fetch=False)
                        
                        decayed.append({
                            "id": product_id, 
                            "name": name[:80], 
                            "old_score": float(score),
                            "new_score": new_score,
                            "age_days": age_days
                        })
                        self.items_affected += 1
                        self.log_info(f"Decay {name[:50]}...: {score:.1f} → {new_score:.1f} ({age_days} days old)")
                        
            except Exception as e:
                self.log_error(f"Failed to process product {product_id}: {e}")
        
        result = {
            "analyzed": self.items_processed,
            "decayed": len(decayed),
            "severely_decayed": len(severely_decayed),
            "archived": len(archived),
            "total_affected": self.items_affected,
            "decayed_products": decayed,
            "severely_decayed_products": severely_decayed,
            "archived_products": archived
        }
        
        # Log summary
        if self.items_affected > 0:
            self.log_info(f"Trend decay complete: {len(decayed)} decayed, {len(severely_decayed)} severely decayed, {len(archived)} archived")
        else:
            self.log_info("No products needed trend decay adjustment")
        
        return result


def main():
    """Run trend decay agent standalone."""
    import logging
    logging.basicConfig(level=logging.INFO)
    
    agent = TrendDecay()
    result = agent.execute()
    
    print(f"\nTrend Decay Results:")
    print(f"  - Analyzed: {result['analyzed']} products")
    print(f"  - Decayed: {result['decayed']} products")
    print(f"  - Severely decayed: {result['severely_decayed']} products")
    print(f"  - Archived: {result['archived']} products")
    print(f"  - Total affected: {result['total_affected']} products")
    
    if result['archived_products']:
        print(f"\nArchived products ({len(result['archived_products'])}):")
        for product in result['archived_products'][:3]:
            print(f"  - {product['name']} (age: {product['age_days']} days)")
    
    if result['severely_decayed_products']:
        print(f"\nSeverely decayed products ({len(result['severely_decayed_products'])}):")
        for product in result['severely_decayed_products'][:3]:
            print(f"  - {product['name']}: {product['old_score']:.1f} → {product['new_score']:.1f}")


if __name__ == "__main__":
    main()