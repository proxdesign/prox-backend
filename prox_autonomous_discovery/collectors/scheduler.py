"""Collection scheduler that runs all platform collectors on schedule."""
import logging
import time
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from config.settings import settings

# Import all collectors
from collectors.youtube_collector import YouTubeCollector
from collectors.pinterest_api_limited import PinterestLimitedCollector
from collectors.blog_collector import BlogCollector
# Note: Reddit collector disabled due to ToS restrictions

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)


class CollectionScheduler:
    """Schedule and orchestrate data collection from all platforms."""
    
    def __init__(self):
        self.scheduler = BlockingScheduler()
        self.collectors = {
            'youtube': YouTubeCollector(),      # Primary - most reliable
            'blog': BlogCollector(),            # Secondary - good product mentions  
            'pinterest': PinterestLimitedCollector()  # Optional - may have auth issues
        }
        logger.info("Collection scheduler initialized")
    
    def collect_all_platforms(self):
        """Run collection across all platforms with error handling."""
        start_time = datetime.now()
        results = {}
        total_collected = 0
        
        logger.info("=" * 60)
        logger.info("Starting scheduled collection cycle")
        logger.info("=" * 60)
        
        for platform_name, collector in self.collectors.items():
            try:
                logger.info(f"Starting {platform_name} collection...")
                collected_count = collector.collect_all()
                results[platform_name] = {
                    'status': 'success',
                    'count': collected_count,
                    'error': None
                }
                total_collected += collected_count
                logger.info(f"✓ {platform_name}: {collected_count} items collected")
                
                # Rate limiting - pause between platforms
                time.sleep(2)
                
            except Exception as e:
                error_msg = str(e)
                results[platform_name] = {
                    'status': 'error',
                    'count': 0,
                    'error': error_msg
                }
                logger.error(f"✗ {platform_name} collection failed: {error_msg}")
        
        # Log summary
        duration = datetime.now() - start_time
        success_count = sum(1 for r in results.values() if r['status'] == 'success')
        
        logger.info("=" * 60)
        logger.info("Collection cycle complete")
        logger.info(f"Duration: {duration.total_seconds():.1f} seconds")
        logger.info(f"Successful platforms: {success_count}/{len(self.collectors)}")
        logger.info(f"Total items collected: {total_collected}")
        logger.info("=" * 60)
        
        # Log individual results
        for platform, result in results.items():
            if result['status'] == 'success':
                logger.info(f"  {platform}: ✓ {result['count']} items")
            else:
                logger.error(f"  {platform}: ✗ {result['error']}")
        
        return results
    
    def start_scheduled_collection(self):
        """Start the scheduler with collection every 6 hours."""
        logger.info(f"Starting scheduled collection every {settings.COLLECTION_FREQUENCY_HOURS} hours")
        
        # Add job to scheduler
        self.scheduler.add_job(
            func=self.collect_all_platforms,
            trigger=IntervalTrigger(hours=settings.COLLECTION_FREQUENCY_HOURS),
            id='collect_all_platforms',
            name='Collect from all platforms',
            replace_existing=True,
            max_instances=1  # Prevent overlapping runs
        )
        
        # Run initial collection immediately
        logger.info("Running initial collection...")
        self.collect_all_platforms()
        
        # Start scheduler
        try:
            logger.info("Scheduler started. Press Ctrl+C to stop.")
            self.scheduler.start()
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            self.shutdown()
    
    def run_single_collection(self):
        """Run a single collection cycle (for testing)."""
        logger.info("Running single collection cycle")
        results = self.collect_all_platforms()
        return results
    
    def run_single_platform(self, platform_name):
        """Run collection for a single platform (for testing)."""
        if platform_name not in self.collectors:
            logger.error(f"Unknown platform: {platform_name}")
            return None
        
        try:
            logger.info(f"Running {platform_name} collection")
            collector = self.collectors[platform_name]
            count = collector.collect_all()
            logger.info(f"✓ Collected {count} items from {platform_name}")
            return count
        except Exception as e:
            logger.error(f"✗ {platform_name} collection failed: {e}")
            return None
    
    def shutdown(self):
        """Gracefully shutdown the scheduler."""
        logger.info("Shutting down scheduler...")
        if self.scheduler.running:
            self.scheduler.shutdown(wait=True)
        logger.info("Scheduler stopped")


def main():
    """Main entry point for scheduler."""
    import sys
    
    scheduler = CollectionScheduler()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == 'once':
            # Run single collection cycle
            scheduler.run_single_collection()
            
        elif command == 'platform' and len(sys.argv) > 2:
            # Run single platform
            platform = sys.argv[2]
            scheduler.run_single_platform(platform)
            
        elif command == 'schedule':
            # Start scheduled collection
            scheduler.start_scheduled_collection()
            
        else:
            print("Usage: python scheduler.py [once|platform <name>|schedule]")
            print("  once      - Run single collection cycle")
            print("  platform  - Run single platform (youtube|blog|pinterest)")
            print("  schedule  - Start scheduled collection every 6 hours")
            
    else:
        # Default: run scheduled collection
        scheduler.start_scheduled_collection()


if __name__ == "__main__":
    main()