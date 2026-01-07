"""YouTube content collector for furniture and organization videos."""
import logging
import json
from datetime import datetime, timedelta
from googleapiclient.discovery import build
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class YouTubeCollector:
    """Collect videos from YouTube about furniture and home organization."""
    
    def __init__(self):
        self.youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
        self.search_queries = [
            # Keep existing (already good):
            'furniture organization',
            'home storage solutions',
            'small space furniture',
            'furniture review',
            'home organization tips',
            
            # ADD these problem-focused queries:
            'furniture assembly problems',
            'storage solutions for small apartments',
            'awkward space furniture',
            'furniture regrets',
            'IKEA hacks',
            'budget furniture review',
            'apartment organization',
            'closet organization fails',
        ]
        logger.info("YouTube collector initialized")
    
    def search_videos(self, query, max_results=50):
        """Search for videos by query."""
        try:
            # Search for videos published in last 30 days
            published_after = (datetime.now() - timedelta(days=30)).isoformat() + 'Z'
            
            search_response = self.youtube.search().list(
                q=query,
                part='id,snippet',
                maxResults=max_results,
                order='relevance',
                type='video',
                publishedAfter=published_after,
                regionCode='US',
                relevanceLanguage='en'
            ).execute()
            
            videos = []
            for item in search_response['items']:
                video_data = self._extract_video_data(item, query)
                videos.append(video_data)
            
            logger.info(f"Found {len(videos)} videos for query: {query}")
            return videos
            
        except Exception as e:
            logger.error(f"Failed to search YouTube for '{query}': {e}")
            return []
    
    def _extract_video_data(self, video_item, search_query):
        """Extract relevant data from YouTube video."""
        snippet = video_item['snippet']
        video_id = video_item['id']['videoId']
        
        # Get additional stats
        stats = self._get_video_stats(video_id)
        
        return {
            'post_id': f"youtube_{video_id}",
            'platform': 'youtube',
            'title': snippet['title'],
            'content': snippet['description'][:2000],  # Limit description length
            'author': snippet['channelTitle'],
            'url': f"https://www.youtube.com/watch?v={video_id}",
            'created_at': datetime.fromisoformat(snippet['publishedAt'].replace('Z', '+00:00')),
            'engagement_data': {
                'view_count': stats.get('viewCount', 0),
                'like_count': stats.get('likeCount', 0),
                'comment_count': stats.get('commentCount', 0),
                'search_query': search_query
            },
            'metadata': {
                'channel_id': snippet['channelId'],
                'video_id': video_id,
                'thumbnails': snippet.get('thumbnails', {}),
                'tags': snippet.get('tags', [])
            }
        }
    
    def _get_video_stats(self, video_id):
        """Get detailed statistics for a video."""
        try:
            response = self.youtube.videos().list(
                part='statistics',
                id=video_id
            ).execute()
            
            if response['items']:
                return response['items'][0]['statistics']
            return {}
            
        except Exception as e:
            logger.warning(f"Could not get stats for video {video_id}: {e}")
            return {}
    
    def save_to_database(self, videos):
        """Save collected videos to database."""
        if not videos:
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
                v['post_id'],
                v['platform'],
                v['title'],
                v['content'],
                v['author'],
                v['url'],
                v['created_at'],
                json.dumps(v['engagement_data']),
                json.dumps(v['metadata'])
            )
            for v in videos
        ]
        
        try:
            db.execute_many(query, data)
            logger.info(f"Saved {len(videos)} videos to database")
            return len(videos)
        except Exception as e:
            logger.error(f"Failed to save videos: {e}")
            return 0
    
    def collect_all(self):
        """Collect videos for all search queries."""
        total_videos = []
        
        for query in self.search_queries:
            videos = self.search_videos(query, max_results=50)
            total_videos.extend(videos)
        
        saved = self.save_to_database(total_videos)
        logger.info(f"YouTube collection complete: {saved} videos saved")
        return saved


def main():
    """Run YouTube collector."""
    collector = YouTubeCollector()
    count = collector.collect_all()
    print(f"✓ Collected {count} YouTube videos")


if __name__ == "__main__":
    main()