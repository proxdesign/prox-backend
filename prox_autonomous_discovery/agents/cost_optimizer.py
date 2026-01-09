"""Track and optimize API usage costs to stay within budget."""
from datetime import datetime, timedelta
from agents.base_agent import BaseAgent
from database.connection import db


class CostOptimizer(BaseAgent):
    """Monitors API costs and provides budget alerts and optimization suggestions."""
    
    def __init__(self):
        super().__init__("cost_optimizer")
        self.daily_budget = 15.00  # $15/day target
        self.monthly_budget = 400.00  # $400/month target
        self.claude_cost_per_1k_tokens = 0.015  # Anthropic pricing estimate
        self.youtube_api_quota_daily = 10000  # YouTube API quota units
        self.alert_threshold = 0.8  # Alert at 80% of budget
    
    def run(self) -> dict:
        """Calculate costs and check against budgets."""
        
        today = datetime.now().date()
        month_start = today.replace(day=1)
        
        # Get today's activity
        daily_stats = self._get_daily_stats(today)
        
        # Get monthly activity
        monthly_stats = self._get_monthly_stats(month_start)
        
        # Calculate estimated costs
        daily_cost = self._estimate_daily_cost(daily_stats)
        monthly_cost = self._estimate_monthly_cost(monthly_stats)
        
        # Check budget status
        daily_budget_used = daily_cost / self.daily_budget
        monthly_budget_used = monthly_cost / self.monthly_budget
        
        self.items_processed = 1
        
        result = {
            "date": str(today),
            "daily": {
                "agent_runs": daily_stats['agent_runs'],
                "collection_runs": daily_stats['collection_runs'],
                "estimated_cost": round(daily_cost, 2),
                "budget": self.daily_budget,
                "budget_used_percent": round(daily_budget_used * 100, 1),
                "status": "OK" if daily_budget_used < self.alert_threshold else "ALERT"
            },
            "monthly": {
                "total_agent_runs": monthly_stats['agent_runs'],
                "total_collection_runs": monthly_stats['collection_runs'],
                "estimated_cost": round(monthly_cost, 2),
                "budget": self.monthly_budget,
                "budget_used_percent": round(monthly_budget_used * 100, 1),
                "status": "OK" if monthly_budget_used < self.alert_threshold else "ALERT"
            },
            "recommendations": []
        }
        
        # Generate alerts and recommendations
        if daily_budget_used >= self.alert_threshold:
            self.log_warning(f"Daily budget alert! {daily_budget_used:.0%} of daily budget used (${daily_cost:.2f}/${self.daily_budget})")
            self.items_affected += 1
            result["recommendations"].append("Consider reducing collection frequency for today")
        
        if monthly_budget_used >= self.alert_threshold:
            self.log_warning(f"Monthly budget alert! {monthly_budget_used:.0%} of monthly budget used (${monthly_cost:.2f}/${self.monthly_budget})")
            self.items_affected += 1
            result["recommendations"].append("Review collection settings to optimize costs")
        
        # Add optimization recommendations
        recommendations = self._generate_recommendations(daily_stats, monthly_stats)
        result["recommendations"].extend(recommendations)
        
        # Log summary
        self.log_info(f"Cost analysis complete: Daily ${daily_cost:.2f}/{self.daily_budget}, Monthly ${monthly_cost:.2f}/{self.monthly_budget}")
        
        return result
    
    def _get_daily_stats(self, date) -> dict:
        """Get activity stats for a specific date."""
        
        # Count agent runs today
        try:
            agent_runs = db.fetch_one("""
                SELECT COUNT(*) FROM agent_logs 
                WHERE DATE(started_at) = %s
            """, (date,))
        except:
            agent_runs = (0,)
        
        # Count platform post collections today (approximate)
        try:
            posts_collected = db.fetch_one("""
                SELECT COUNT(*) FROM platform_posts 
                WHERE DATE(collected_at) = %s
            """, (date,))
        except:
            posts_collected = (0,)
        
        # Count user sessions today (handle missing table)
        try:
            user_sessions = db.fetch_one("""
                SELECT COUNT(*) FROM user_sessions 
                WHERE DATE(created_at) = %s
            """, (date,))
        except:
            # Table might not exist, use fallback
            user_sessions = (0,)
        
        return {
            "agent_runs": agent_runs[0] if agent_runs else 0,
            "collection_runs": 1 if posts_collected and posts_collected[0] > 0 else 0,  # Estimate collection runs
            "posts_collected": posts_collected[0] if posts_collected else 0,
            "user_sessions": user_sessions[0] if user_sessions else 0
        }
    
    def _get_monthly_stats(self, month_start) -> dict:
        """Get activity stats for the current month."""
        
        # Count agent runs this month
        try:
            agent_runs = db.fetch_one("""
                SELECT COUNT(*) FROM agent_logs 
                WHERE started_at >= %s
            """, (month_start,))
        except:
            agent_runs = (0,)
        
        # Estimate collection runs this month
        try:
            posts_collected = db.fetch_one("""
                SELECT COUNT(*) FROM platform_posts 
                WHERE collected_at >= %s
            """, (month_start,))
        except:
            posts_collected = (0,)
        
        # Count user sessions this month (handle missing table)
        try:
            user_sessions = db.fetch_one("""
                SELECT COUNT(*) FROM user_sessions 
                WHERE created_at >= %s
            """, (month_start,))
        except:
            user_sessions = (0,)
        
        return {
            "agent_runs": agent_runs[0] if agent_runs else 0,
            "collection_runs": max(1, (posts_collected[0] if posts_collected else 0) // 100),  # Rough estimate
            "posts_collected": posts_collected[0] if posts_collected else 0,
            "user_sessions": user_sessions[0] if user_sessions else 0
        }
    
    def _estimate_daily_cost(self, stats) -> float:
        """Estimate daily API costs based on activity."""
        
        # Estimate Claude API calls
        # Agent runs + user sessions typically use Claude
        estimated_claude_calls = stats['agent_runs'] * 5 + stats['user_sessions'] * 2
        
        # Estimate tokens per call (rough estimate)
        avg_tokens_per_call = 1000
        
        # Calculate Claude costs
        claude_cost = (estimated_claude_calls * avg_tokens_per_call / 1000) * self.claude_cost_per_1k_tokens
        
        # YouTube API costs are included in free tier up to quota
        youtube_cost = 0.0  # Assuming we stay within free tier
        
        return claude_cost + youtube_cost
    
    def _estimate_monthly_cost(self, stats) -> float:
        """Estimate monthly API costs based on activity."""
        
        # Estimate monthly Claude API usage
        estimated_claude_calls = stats['agent_runs'] * 5 + stats['user_sessions'] * 2
        avg_tokens_per_call = 1000
        
        claude_cost = (estimated_claude_calls * avg_tokens_per_call / 1000) * self.claude_cost_per_1k_tokens
        
        return claude_cost
    
    def _generate_recommendations(self, daily_stats, monthly_stats) -> list:
        """Generate cost optimization recommendations."""
        recommendations = []
        
        # High collection volume
        if daily_stats['posts_collected'] > 1000:
            recommendations.append("Consider reducing collection frequency - high volume detected")
        
        # High session volume
        if daily_stats['user_sessions'] > 100:
            recommendations.append("High user activity - monitor Claude API usage closely")
        
        # Low activity
        if daily_stats['posts_collected'] < 10 and daily_stats['user_sessions'] < 5:
            recommendations.append("Low activity day - good opportunity to run maintenance agents")
        
        # Monthly trends
        if monthly_stats['posts_collected'] > 20000:
            recommendations.append("High monthly collection volume - consider data quality over quantity")
        
        return recommendations


def main():
    """Run cost optimizer standalone."""
    import logging
    logging.basicConfig(level=logging.INFO)
    
    agent = CostOptimizer()
    result = agent.execute()
    
    print(f"\nCost Optimization Report:")
    print(f"  Daily Cost: ${result['daily']['estimated_cost']:.2f} / ${result['daily']['budget']:.2f} ({result['daily']['budget_used_percent']:.1f}%)")
    print(f"  Monthly Cost: ${result['monthly']['estimated_cost']:.2f} / ${result['monthly']['budget']:.2f} ({result['monthly']['budget_used_percent']:.1f}%)")
    print(f"  Daily Status: {result['daily']['status']}")
    print(f"  Monthly Status: {result['monthly']['status']}")
    
    if result['recommendations']:
        print(f"\nRecommendations:")
        for i, rec in enumerate(result['recommendations'], 1):
            print(f"  {i}. {rec}")
    
    print(f"\nActivity Summary:")
    print(f"  - Agent runs today: {result['daily']['agent_runs']}")
    print(f"  - Collection runs today: {result['daily']['collection_runs']}")


if __name__ == "__main__":
    main()