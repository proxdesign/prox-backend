"""Central configuration settings for Prox Autonomous Discovery."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings and configuration."""
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    # API Keys
    REDDIT_CLIENT_ID = os.getenv('REDDIT_CLIENT_ID')
    REDDIT_CLIENT_SECRET = os.getenv('REDDIT_CLIENT_SECRET')
    REDDIT_USER_AGENT = os.getenv('REDDIT_USER_AGENT')
    
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    
    # Pinterest Developer API
    PINTEREST_APP_ID = os.getenv('PINTEREST_APP_ID')
    PINTEREST_APP_SECRET = os.getenv('PINTEREST_APP_SECRET')
    PINTEREST_ACCESS_TOKEN = os.getenv('PINTEREST_ACCESS_TOKEN')
    
    # Apify (optional for legacy scraping)
    APIFY_API_TOKEN = os.getenv('APIFY_API_TOKEN')
    
    AMAZON_ACCESS_KEY = os.getenv('AMAZON_ACCESS_KEY')
    AMAZON_SECRET_KEY = os.getenv('AMAZON_SECRET_KEY')
    AMAZON_PARTNER_TAG = os.getenv('AMAZON_PARTNER_TAG')
    
    CJ_API_KEY = os.getenv('CJ_API_KEY')
    
    # Collection Settings
    REDDIT_SUBREDDITS = [
        # Keep existing strong performers:
        'InteriorDesign', 'organization', 'HomeDecorating',
        'furniture', 'declutter', 'minimalism',
        'ApartmentTherapy', 'malelivingspace', 'femalelivingspace',
        'DesignMyRoom', 'homeorganization', 'OrganizationPorn', 'organizationhacks',
        
        # ADD these problem-rich subreddits:
        'Organizing',              # More active than 'organization'
        'konmari',                 # Specific organization method discussions
        'OfficeChairs',            # Furniture-specific problems
        'Workspaces',              # Home office pain points
        'StudioApartments',        # Space constraint problems
        'TinyHouses',              # Extreme space challenges
        'BuyItForLife',            # Quality/durability concerns
        'IKEA',                    # Assembly/quality discussions
        'FirstTimeHomeBuyer',      # New homeowner challenges
    ]
    
    COLLECTION_BATCH_SIZE = 100
    COLLECTION_FREQUENCY_HOURS = 6
    
    # Agent Settings
    LINK_CHECK_FREQUENCY_HOURS = int(os.getenv('LINK_CHECK_FREQUENCY_HOURS', 6))
    DAILY_BUDGET_USD = float(os.getenv('DAILY_BUDGET_USD', 15))
    COST_ALERT_THRESHOLD = float(os.getenv('COST_ALERT_THRESHOLD', 1.2))
    
    QUALITY_THRESHOLD = -5  # Demote products below this score
    TREND_DECAY_THRESHOLD = -0.5  # 50% decline triggers demotion
    
    # Frontend URLs
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    API_URL = os.getenv('API_URL', 'http://localhost:8000')
    
    # Rate Limits
    CLAUDE_REQUESTS_PER_HOUR = 100
    APIFY_REQUESTS_PER_DAY = 1000
    
    @classmethod
    def validate(cls):
        """Validate that required settings are present."""
        required = [
            'DATABASE_URL',
            'REDDIT_CLIENT_ID',
            'ANTHROPIC_API_KEY',
            'PINTEREST_ACCESS_TOKEN'
        ]
        
        missing = [key for key in required if not getattr(cls, key)]
        
        if missing:
            raise ValueError(f"Missing required settings: {', '.join(missing)}")
        
        return True


settings = Settings()


if __name__ == "__main__":
    try:
        settings.validate()
        print("✓ All required settings present")
    except ValueError as e:
        print(f"✗ Configuration error: {e}")
