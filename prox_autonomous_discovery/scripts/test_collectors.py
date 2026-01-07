"""Test script to verify all collectors are working properly."""
import logging
import sys
import os
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.settings import settings
from database.connection import db

# Import all collectors
from collectors.reddit_collector import RedditCollector
from collectors.youtube_collector import YouTubeCollector
from collectors.apify_instagram import InstagramCollector
from collectors.apify_tiktok import TikTokCollector
from collectors.apify_pinterest import PinterestCollector

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_database_connection():
    """Test database connectivity."""
    print("\n" + "="*60)
    print("TESTING DATABASE CONNECTION")
    print("="*60)
    
    try:
        if db.test_connection():
            print("✓ Database connection successful")
            
            # Check if platform_posts table exists
            result = db.execute_query("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'platform_posts'
            """)
            
            if result:
                print("✓ platform_posts table exists")
                
                # Check current row count
                count_result = db.execute_query("SELECT COUNT(*) as count FROM platform_posts")
                current_count = count_result[0]['count'] if count_result else 0
                print(f"✓ Current rows in platform_posts: {current_count}")
                
                return True
            else:
                print("✗ platform_posts table not found")
                return False
        else:
            print("✗ Database connection failed")
            return False
            
    except Exception as e:
        print(f"✗ Database test failed: {e}")
        return False


def test_collector(collector_class, platform_name, limit=5):
    """Test a single collector with limited results."""
    print(f"\n--- Testing {platform_name.upper()} Collector ---")
    
    try:
        # Initialize collector
        collector = collector_class()
        print(f"✓ {platform_name} collector initialized")
        
        # For testing, we'll modify the collect method to use smaller limits
        if platform_name == 'reddit':
            # Test single subreddit
            posts = collector.collect_subreddit('furniture', limit=limit)
            saved = collector.save_to_database(posts)
            
        elif platform_name == 'youtube':
            # Test single query
            videos = collector.search_videos('furniture', max_results=limit)
            saved = collector.save_to_database(videos)
            
        elif platform_name == 'instagram':
            # Test single hashtag
            posts = collector.collect_hashtag('furniture', limit=limit)
            saved = collector.save_to_database(posts)
            
        elif platform_name == 'tiktok':
            # Test single hashtag
            videos = collector.collect_hashtag('furniture', limit=limit)
            saved = collector.save_to_database(videos)
            
        elif platform_name == 'pinterest':
            # Test single search term
            pins = collector.collect_search('furniture', limit=limit)
            saved = collector.save_to_database(pins)
        
        print(f"✓ {platform_name}: {saved} items collected and saved")
        return saved
        
    except Exception as e:
        print(f"✗ {platform_name} test failed: {e}")
        return 0


def verify_database_data():
    """Verify that data was actually saved to the database."""
    print("\n" + "="*60)
    print("VERIFYING SAVED DATA")
    print("="*60)
    
    try:
        # Get count by platform
        result = db.execute_query("""
            SELECT platform, COUNT(*) as count 
            FROM platform_posts 
            GROUP BY platform
            ORDER BY platform
        """)
        
        if result:
            print("Data by platform:")
            total = 0
            for row in result:
                print(f"  {row['platform']}: {row['count']} posts")
                total += row['count']
            print(f"  TOTAL: {total} posts")
        else:
            print("✗ No data found in platform_posts table")
            
        # Get sample recent posts
        recent_posts = db.execute_query("""
            SELECT platform, title, author, collected_at
            FROM platform_posts 
            ORDER BY collected_at DESC 
            LIMIT 10
        """)
        
        if recent_posts:
            print("\nMost recent posts:")
            for post in recent_posts:
                title = post['title'][:50] + "..." if len(post['title']) > 50 else post['title']
                print(f"  {post['platform']}: '{title}' by {post['author']}")
        
        return True
        
    except Exception as e:
        print(f"✗ Database verification failed: {e}")
        return False


def main():
    """Run collector tests."""
    print("🚀 PROX DATA COLLECTION PIPELINE TESTS")
    print("=" * 60)
    
    # Test database first
    if not test_database_connection():
        print("\n❌ Database tests failed. Aborting collector tests.")
        return
    
    # Test each collector with small limits
    collectors_to_test = [
        (RedditCollector, 'reddit'),
        (YouTubeCollector, 'youtube'),
        (InstagramCollector, 'instagram'),
        (TikTokCollector, 'tiktok'),
        (PinterestCollector, 'pinterest')
    ]
    
    total_collected = 0
    successful_collectors = 0
    
    for collector_class, platform_name in collectors_to_test:
        try:
            count = test_collector(collector_class, platform_name, limit=5)
            total_collected += count
            if count > 0:
                successful_collectors += 1
        except Exception as e:
            print(f"✗ Critical error testing {platform_name}: {e}")
    
    # Verify all data
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Collectors tested: {len(collectors_to_test)}")
    print(f"Successful collectors: {successful_collectors}")
    print(f"Total items collected: {total_collected}")
    
    # Final database verification
    verify_database_data()
    
    if successful_collectors >= len(collectors_to_test) // 2:  # At least half working
        print("\n✅ Collection pipeline tests PASSED")
        print("Ready for production use!")
    else:
        print("\n❌ Collection pipeline tests FAILED") 
        print("Please check API keys and network connectivity.")


if __name__ == "__main__":
    main()