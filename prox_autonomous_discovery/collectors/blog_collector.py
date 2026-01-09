"""Blog/RSS content collector for home organization and furniture sites."""
import feedparser
import logging
import json
import re
import ssl
from datetime import datetime, timedelta
from urllib.parse import urlparse
from config.settings import settings
from database.connection import db

# Configure feedparser to handle SSL certificates more gracefully
if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class BlogCollector:
    """Collect articles from home organization and furniture blogs via RSS feeds."""
    
    def __init__(self):
        self.rss_feeds = [
            {
                'name': 'Apartment Therapy',
                'url': 'https://www.apartmenttherapy.com/feeds/all',
                'category': 'home_design'
            },
            {
                'name': 'The Spruce Organization',
                'url': 'https://www.thespruce.com/feeds/all',
                'category': 'home_organization'
            },
            {
                'name': 'Better Homes & Gardens',
                'url': 'https://feeds.bhg.com/bhg-decorating',
                'category': 'home_lifestyle'
            },
            {
                'name': 'Real Simple',
                'url': 'https://feeds.feedburner.com/realsimple/decorating',
                'category': 'organization'
            },
            {
                'name': 'IKEA Hackers',
                'url': 'https://www.ikeahackers.net/feed',
                'category': 'furniture_hacks'
            },
            {
                'name': 'The Container Store Blog',
                'url': 'https://blog.containerstore.com/feed/',
                'category': 'organization'
            }
        ]
        
        # Keywords that must be present in title/content for relevance filtering
        self.relevant_keywords = [
            # Storage and organization
            'storage', 'organization', 'organize', 'declutter', 'furniture',
            'small space', 'apartment', 'home office', 'closet',
            'kitchen storage', 'bathroom organization', 'bedroom',
            'shelf', 'cabinet', 'drawer', 'bin', 'basket', 'container',
            
            # Furniture types
            'desk', 'chair', 'table', 'sofa', 'bed', 'dresser',
            'bookshelf', 'ottoman', 'bench', 'nightstand',
            
            # Space-specific
            'living room', 'bedroom', 'kitchen', 'bathroom', 'office',
            'garage', 'basement', 'attic', 'entryway', 'mudroom',
            
            # Problems and solutions
            'compact', 'space-saving', 'multi-functional', 'storage solution',
            'organization hack', 'small apartment', 'tiny space'
        ]
        
        logger.info(f"Blog collector initialized with {len(self.rss_feeds)} RSS feeds")
    
    def collect_feed(self, feed_info, limit=50):
        """Collect articles from a single RSS feed."""
        try:
            feed_url = feed_info['url']
            feed_name = feed_info['name']
            
            logger.info(f"Collecting from {feed_name}: {feed_url}")
            
            # Set user agent to avoid blocking
            feedparser.USER_AGENT = "ProxDiscovery/1.0 (+https://proxdiscovery.com) feedparser/%s" % feedparser.__version__
            
            # Parse RSS feed with timeout
            feed = feedparser.parse(feed_url)
            
            if feed.bozo:
                logger.warning(f"Feed parsing issues for {feed_name}: {feed.bozo_exception}")
            
            articles = []
            
            # Process entries
            for entry in feed.entries[:limit]:
                if self._is_relevant_article(entry):
                    article_data = self._extract_article_data(entry, feed_info)
                    if article_data:
                        articles.append(article_data)
            
            logger.info(f"Collected {len(articles)} relevant articles from {feed_name}")
            return articles
            
        except Exception as e:
            logger.error(f"Failed to collect from {feed_info['name']}: {e}")
            return []
    
    def _is_relevant_article(self, entry):
        """Check if article is relevant to home/furniture/organization topics."""
        # Combine title and summary for keyword checking
        text_to_check = ""
        if hasattr(entry, 'title'):
            text_to_check += entry.title.lower() + " "
        if hasattr(entry, 'summary'):
            text_to_check += entry.summary.lower() + " "
        if hasattr(entry, 'description'):
            text_to_check += entry.description.lower() + " "
        
        # Check if any relevant keywords are present
        for keyword in self.relevant_keywords:
            if keyword.lower() in text_to_check:
                return True
        
        return False
    
    def _extract_article_data(self, entry, feed_info):
        """Extract relevant data from RSS entry."""
        try:
            # Get published date
            published_date = datetime.now()
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                try:
                    published_date = datetime(*entry.published_parsed[:6])
                except:
                    pass
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                try:
                    published_date = datetime(*entry.updated_parsed[:6])
                except:
                    pass
            
            # Skip articles older than 30 days
            if (datetime.now() - published_date).days > 30:
                return None
            
            # Extract content
            content = ""
            if hasattr(entry, 'summary'):
                content = entry.summary
            elif hasattr(entry, 'description'):
                content = entry.description
            
            # Clean HTML from content
            content = re.sub(r'<[^>]+>', '', content)
            content = content.strip()[:2000]  # Limit content length
            
            # Create unique post ID
            post_id = f"blog_{hash(entry.link)}_{int(published_date.timestamp())}"
            
            return {
                'post_id': post_id,
                'platform': 'blog',
                'title': entry.title,
                'content': content,
                'author': feed_info['name'],
                'url': entry.link,
                'created_at': published_date,
                'engagement_data': {
                    'source_feed': feed_info['url'],
                    'category': feed_info['category'],
                    'feed_name': feed_info['name']
                },
                'metadata': {
                    'feed_category': feed_info['category'],
                    'source_domain': urlparse(entry.link).netloc,
                    'has_tags': hasattr(entry, 'tags'),
                    'tags': [tag.term for tag in entry.tags] if hasattr(entry, 'tags') else []
                }
            }
            
        except Exception as e:
            logger.warning(f"Failed to extract data from entry: {e}")
            return None
    
    def save_to_database(self, articles):
        """Save collected articles to database."""
        if not articles:
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
                article['post_id'],
                article['platform'],
                article['title'],
                article['content'],
                article['author'],
                article['url'],
                article['created_at'],
                json.dumps(article['engagement_data']),
                json.dumps(article['metadata'])
            )
            for article in articles
        ]
        
        try:
            db.execute_many(query, data)
            logger.info(f"Saved {len(articles)} articles to database")
            return len(articles)
        except Exception as e:
            logger.error(f"Failed to save articles: {e}")
            return 0
    
    def collect_all(self, limit=100):
        """Collect articles from all RSS feeds."""
        total_articles = []
        
        for feed_info in self.rss_feeds:
            articles = self.collect_feed(feed_info, limit=limit//len(self.rss_feeds))
            total_articles.extend(articles)
        
        saved = self.save_to_database(total_articles)
        logger.info(f"Blog collection complete: {saved} articles saved")
        return saved


def main():
    """Run blog collector."""
    collector = BlogCollector()
    count = collector.collect_all()
    print(f"✓ Collected {count} blog articles")


if __name__ == "__main__":
    main()