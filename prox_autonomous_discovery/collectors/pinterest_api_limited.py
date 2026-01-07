"""Pinterest content collector using Pinterest Developer API with limited scopes."""
import logging
import json
import requests
from datetime import datetime
from config.settings import settings
from database.connection import db

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class PinterestLimitedCollector:
    """Collect Pinterest pins using official Pinterest Developer API with available scopes only."""
    
    def __init__(self):
        self.app_id = settings.PINTEREST_APP_ID
        self.app_secret = settings.PINTEREST_APP_SECRET
        self.access_token = settings.PINTEREST_ACCESS_TOKEN
        self.base_url = "https://api.pinterest.com/v5"
        
        # Request headers
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
            'User-Agent': 'ProxDiscovery/1.0'
        }
        
        logger.info("Pinterest Limited API collector initialized")
    
    def get_user_boards(self):
        """Get user's boards (available with current scopes)."""
        try:
            url = f"{self.base_url}/boards"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            boards = data.get('items', [])
            
            logger.info(f"Found {len(boards)} user boards")
            return boards
            
        except Exception as e:
            logger.error(f"Failed to get user boards: {e}")
            return []
    
    def get_board_pins(self, board_id, limit=50):
        """Get pins from a specific board."""
        try:
            url = f"{self.base_url}/boards/{board_id}/pins"
            params = {
                'page_size': min(limit, 100),  # Pinterest API limit
                'pin_metrics': 'SAVE,PIN_CLICK'
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            pins = data.get('items', [])
            
            logger.info(f"Found {len(pins)} pins in board {board_id}")
            return pins
            
        except Exception as e:
            logger.error(f"Failed to get pins from board {board_id}: {e}")
            return []
    
    def get_user_pins(self, limit=50):
        """Get user's own pins (available with current scopes)."""
        try:
            url = f"{self.base_url}/pins"
            params = {
                'page_size': min(limit, 100),
                'pin_metrics': 'SAVE,PIN_CLICK'
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            pins = data.get('items', [])
            
            logger.info(f"Found {len(pins)} user pins")
            return pins
            
        except Exception as e:
            logger.error(f"Failed to get user pins: {e}")
            return []
    
    def _extract_pin_data(self, pin_item, source_context="user_account"):
        """Extract relevant data from Pinterest API response."""
        try:
            pin_id = pin_item.get('id')
            if not pin_id:
                return None
            
            # Extract basic information
            title = pin_item.get('title', '') or ''
            description = pin_item.get('description', '') or ''
            content = f"{title} {description}".strip()
            
            # Extract creator information
            creator = pin_item.get('creator', {}) or {}
            username = creator.get('username', 'unknown')
            
            # Extract dates
            created_at_str = pin_item.get('created_at')
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                except:
                    created_at = datetime.now()
            else:
                created_at = datetime.now()
            
            # Extract engagement metrics
            pin_metrics = pin_item.get('pin_metrics', {})
            
            # Extract media information
            media = pin_item.get('media', {})
            image_url = None
            if media.get('media_type') == 'image':
                images = media.get('images', {})
                if 'originals' in images:
                    image_url = images['originals'].get('url')
                elif '600x' in images:
                    image_url = images['600x'].get('url')
            
            # Extract board information
            board = pin_item.get('board', {}) or {}
            
            # Extract link information
            link = pin_item.get('link')
            domain = pin_item.get('domain')
            
            return {
                'post_id': f"pinterest_{pin_id}",
                'platform': 'pinterest',
                'title': title[:255] if title else '',
                'content': content,
                'author': username,
                'url': f"https://www.pinterest.com/pin/{pin_id}/",
                'created_at': created_at,
                'engagement_data': {
                    'save_count': pin_metrics.get('save') or 0,
                    'pin_click_count': pin_metrics.get('pin_click') or 0,
                    'source_context': source_context,
                    'impression_count': pin_metrics.get('impression', 0)
                },
                'metadata': {
                    'pin_id': pin_id,
                    'board_id': board.get('id'),
                    'board_name': board.get('name'),
                    'image_url': image_url,
                    'link': link,
                    'domain': domain,
                    'media_type': media.get('media_type'),
                    'alt_text': pin_item.get('alt_text'),
                    'note': pin_item.get('note'),
                    'color': pin_item.get('dominant_color'),
                    'is_owner': pin_item.get('is_owner', False),
                    'is_standard': pin_item.get('is_standard', True),
                    'collection_method': 'limited_api'
                }
            }
            
        except Exception as e:
            logger.warning(f"Could not extract data from Pinterest pin: {e}")
            return None
    
    def save_to_database(self, pins):
        """Save collected pins to database."""
        if not pins:
            return 0
        
        query = """
            INSERT INTO platform_posts 
            (post_id, platform, title, content, author, url, created_at, 
             collected_at, engagement_data, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s::jsonb, %s::jsonb)
            ON CONFLICT (post_id) DO UPDATE SET
                engagement_data = EXCLUDED.engagement_data,
                metadata = EXCLUDED.metadata,
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
            for p in pins
        ]
        
        try:
            db.execute_many(query, data)
            logger.info(f"Saved {len(pins)} Pinterest pins to database")
            return len(pins)
        except Exception as e:
            logger.error(f"Failed to save Pinterest pins: {e}")
            return 0
    
    def collect_all(self):
        """Collect pins using available API endpoints."""
        total_pins = []
        
        # Method 1: Collect user's own pins
        logger.info("Collecting user's own pins...")
        user_pins = self.get_user_pins(limit=50)
        for raw_pin in user_pins:
            pin_data = self._extract_pin_data(raw_pin, "user_pins")
            if pin_data:
                total_pins.append(pin_data)
        
        # Method 2: Collect pins from user's boards
        logger.info("Collecting pins from user boards...")
        boards = self.get_user_boards()
        for board in boards:
            board_id = board.get('id')
            board_name = board.get('name', 'Unknown')
            
            if board_id:
                logger.info(f"Collecting from board: {board_name}")
                board_pins = self.get_board_pins(board_id, limit=25)
                
                for raw_pin in board_pins:
                    pin_data = self._extract_pin_data(raw_pin, f"board_{board_name}")
                    if pin_data:
                        total_pins.append(pin_data)
                
                # Rate limiting
                import time
                time.sleep(1)
        
        # Remove duplicates by post_id
        unique_pins = {}
        for pin in total_pins:
            pin_id = pin['post_id']
            if pin_id not in unique_pins:
                unique_pins[pin_id] = pin
        
        final_pins = list(unique_pins.values())
        
        saved = self.save_to_database(final_pins)
        logger.info(f"Pinterest Limited API collection complete: {saved} unique pins saved")
        return saved
    
    def test_connection(self):
        """Test Pinterest API connection."""
        try:
            url = f"{self.base_url}/user_account"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            user_data = response.json()
            username = user_data.get('username', 'Unknown')
            pin_count = user_data.get('pin_count', 0)
            
            logger.info(f"✅ Pinterest API connection successful - User: {username}, Pins: {pin_count}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Pinterest API connection failed: {e}")
            return False


def main():
    """Run Pinterest Limited API collector."""
    collector = PinterestLimitedCollector()
    
    # Test connection first
    if not collector.test_connection():
        print("❌ Pinterest API connection failed")
        return
    
    # Collect data
    count = collector.collect_all()
    print(f"✅ Collected {count} Pinterest pins via Limited API")


if __name__ == "__main__":
    main()