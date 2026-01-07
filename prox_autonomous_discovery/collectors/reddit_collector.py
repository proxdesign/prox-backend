"""Reddit content collector for furniture and organization discussions."""
import praw
import logging
import json
from datetime import datetime
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class RedditCollector:
    """Collect posts from furniture-related subreddits."""
    
    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT
        )
        logger.info("Reddit collector initialized")
    
    def collect_subreddit(self, subreddit_name, limit=100, time_filter='week'):
        """Collect posts from a single subreddit."""
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            posts = []
            
            # Get hot posts
            for post in subreddit.hot(limit=limit):
                post_data = self._extract_post_data(post, subreddit_name)
                posts.append(post_data)
            
            logger.info(f"Collected {len(posts)} posts from r/{subreddit_name}")
            return posts
            
        except Exception as e:
            logger.error(f"Failed to collect from r/{subreddit_name}: {e}")
            return []
    
    def _extract_post_data(self, post, subreddit_name):
        """Extract relevant data from Reddit post."""
        return {
            'post_id': f"reddit_{post.id}",
            'platform': 'reddit',
            'title': post.title,
            'content': post.selftext,
            'author': str(post.author) if post.author else '[deleted]',
            'url': f"https://reddit.com{post.permalink}",
            'created_at': datetime.fromtimestamp(post.created_utc),
            'engagement_data': {
                'upvotes': post.ups,
                'upvote_ratio': post.upvote_ratio,
                'num_comments': post.num_comments,
                'subreddit': subreddit_name
            },
            'metadata': {
                'is_self': post.is_self,
                'link_flair_text': post.link_flair_text,
                'over_18': post.over_18
            }
        }
    
    def save_to_database(self, posts):
        """Save collected posts to database."""
        if not posts:
            return 0
        
        query = """
            INSERT INTO platform_posts 
            (post_id, platform, title, content, author, url, created_at, 
             collected_at, engagement_data, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s::jsonb, %s::jsonb)
            ON CONFLICT (post_id) DO UPDATE SET
                engagement_data = EXCLUDED.engagement_data,
                collected_at = NOW()
        """
        
        data = [
            (
                p['post_id'],
                p['platform'],
                p['title'],
                p['content'],
                p['author'],
                p['url'],
                p['created_at'],
                json.dumps(p['engagement_data']),
                json.dumps(p['metadata'])
            )
            for p in posts
        ]
        
        try:
            db.execute_many(query, data)
            logger.info(f"Saved {len(posts)} posts to database")
            return len(posts)
        except Exception as e:
            logger.error(f"Failed to save posts: {e}")
            return 0
    
    def collect_all(self):
        """Collect from all configured subreddits."""
        total_posts = []
        
        for subreddit in settings.REDDIT_SUBREDDITS:
            posts = self.collect_subreddit(subreddit, limit=50)
            total_posts.extend(posts)
        
        saved = self.save_to_database(total_posts)
        logger.info(f"Collection complete: {saved} posts saved")
        return saved


def main():
    """Run Reddit collector."""
    collector = RedditCollector()
    count = collector.collect_all()
    print(f"✓ Collected {count} Reddit posts")


if __name__ == "__main__":
    main()
