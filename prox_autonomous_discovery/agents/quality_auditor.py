"""Audit product quality based on user engagement metrics and demote poor performers."""
from agents.base_agent import BaseAgent
from database.connection import db


class QualityAuditor(BaseAgent):
    """Audits product quality based on feedback and engagement metrics."""
    
    def __init__(self):
        super().__init__("quality_auditor")
        self.min_feedback_count = 3  # Minimum feedback to make decisions
        self.approval_threshold = 0.4  # 40% approval rate minimum
        self.score_penalty = 1.5  # How much to reduce trend_score
        self.min_score = 1.0  # Don't reduce score below this
    
    def run(self) -> dict:
        """Find and demote poor-performing products based on feedback."""
        
        # Get products with engagement data
        engagement_data = db.fetch_all("""
            SELECT 
                p.id,
                p.product_name,
                p.trend_score,
                p.created_at,
                COALESCE(
                    (SELECT COUNT(*) FROM product_feedback pf 
                     WHERE pf.product_id = p.id AND pf.feedback_type = 'helpful'), 0
                ) as helpful_count,
                COALESCE(
                    (SELECT COUNT(*) FROM product_feedback pf 
                     WHERE pf.product_id = p.id AND pf.feedback_type = 'not_helpful'), 0
                ) as not_helpful_count,
                COALESCE(
                    (SELECT COUNT(*) FROM product_feedback pf 
                     WHERE pf.product_id = p.id), 0
                ) as total_feedback
            FROM products p
            WHERE p.active = TRUE
            AND p.trend_score > %s
            ORDER BY p.trend_score DESC
        """, (self.min_score,))
        
        if not engagement_data:
            self.log_info("No active products found for quality audit")
            return {
                "audited": 0,
                "demoted": 0,
                "demoted_products": []
            }
        
        self.items_processed = len(engagement_data)
        self.log_info(f"Auditing quality for {len(engagement_data)} products...")
        
        demoted_products = []
        products_with_feedback = 0
        
        for product in engagement_data:
            product_id, name, current_score, created_at, helpful, not_helpful, total = product
            
            # Skip if not enough feedback data
            if total < self.min_feedback_count:
                continue
            
            products_with_feedback += 1
            
            # Calculate approval rate
            approval_rate = helpful / total if total > 0 else 0
            
            # Demote if approval rate is below threshold
            if approval_rate < self.approval_threshold:
                new_score = max(self.min_score, float(current_score) - self.score_penalty)
                
                # Only update if score actually changes
                if new_score < float(current_score):
                    try:
                        db.execute_query("""
                            UPDATE products 
                            SET trend_score = %s,
                                last_updated = NOW()
                            WHERE id = %s
                        """, (new_score, product_id), fetch=False)
                        
                        self.items_affected += 1
                        demoted_products.append({
                            "id": product_id,
                            "name": name[:80],  # Truncate long names
                            "old_score": float(current_score),
                            "new_score": new_score,
                            "approval_rate": round(approval_rate, 3),
                            "feedback_count": total,
                            "helpful": helpful,
                            "not_helpful": not_helpful
                        })
                        
                        self.log_info(f"Demoted {name[:50]}...: {current_score:.1f} → {new_score:.1f} (approval: {approval_rate:.1%})")
                        
                    except Exception as e:
                        self.log_error(f"Failed to update product {product_id}: {e}")
        
        # Also identify products with consistently high scores that might need manual review
        high_performers = []
        for product in engagement_data:
            product_id, name, current_score, created_at, helpful, not_helpful, total = product
            
            if total >= self.min_feedback_count:
                approval_rate = helpful / total if total > 0 else 0
                if approval_rate >= 0.8 and float(current_score) >= 8.0:
                    high_performers.append({
                        "id": product_id,
                        "name": name[:80],
                        "score": float(current_score),
                        "approval_rate": round(approval_rate, 3),
                        "feedback_count": total
                    })
        
        result = {
            "audited": self.items_processed,
            "products_with_feedback": products_with_feedback,
            "demoted": self.items_affected,
            "demoted_products": demoted_products,
            "high_performers": high_performers[:5]  # Top 5 high performers
        }
        
        # Log summary
        if self.items_affected > 0:
            self.log_warning(f"Demoted {self.items_affected} poor-performing products")
        
        if high_performers:
            self.log_info(f"Identified {len(high_performers)} high-performing products")
        
        self.log_info(f"Quality audit complete: {products_with_feedback} products had sufficient feedback for evaluation")
        
        return result


def main():
    """Run quality auditor standalone."""
    import logging
    logging.basicConfig(level=logging.INFO)
    
    agent = QualityAuditor()
    result = agent.execute()
    
    print(f"\nQuality Audit Results:")
    print(f"  - Audited: {result['audited']} products")
    print(f"  - With feedback: {result['products_with_feedback']} products")
    print(f"  - Demoted: {result['demoted']} products")
    print(f"  - High performers: {len(result.get('high_performers', []))} products")
    
    if result['demoted_products']:
        print("\nDemoted products:")
        for product in result['demoted_products'][:5]:  # Show first 5
            print(f"  - {product['name']}: {product['old_score']:.1f} → {product['new_score']:.1f} "
                  f"(approval: {product['approval_rate']:.1%})")
    
    if result.get('high_performers'):
        print("\nTop performers:")
        for product in result['high_performers']:
            print(f"  - {product['name']}: score {product['score']:.1f}, "
                  f"approval {product['approval_rate']:.1%}")


if __name__ == "__main__":
    main()