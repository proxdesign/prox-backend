#!/usr/bin/env python3
"""
Automated Data Collection Scheduler
Starts the CollectionScheduler to run data collection every 6 hours.
"""

import sys
import os
import signal
import logging
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from collectors.scheduler import CollectionScheduler
from config.settings import settings

# Setup logging
log_dir = Path(__file__).parent.parent / 'logs'
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'scheduler.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


class SchedulerManager:
    """Manages the collection scheduler with proper startup and shutdown."""
    
    def __init__(self):
        self.scheduler = None
        self.running = False
        
    def setup_signal_handlers(self):
        """Setup graceful shutdown on SIGINT and SIGTERM."""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, shutting down gracefully...")
            self.shutdown()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
    def start(self):
        """Start the collection scheduler."""
        try:
            logger.info("=" * 60)
            logger.info("Starting Prox Autonomous Data Collection Scheduler")
            logger.info("=" * 60)
            logger.info(f"Start time: {datetime.now()}")
            logger.info(f"Collection frequency: Every {settings.COLLECTION_FREQUENCY_HOURS} hours")
            logger.info(f"Log level: {settings.LOG_LEVEL}")
            logger.info(f"Environment: {os.getenv('PROX_ENV', 'development')}")
            
            # Setup signal handlers for graceful shutdown
            self.setup_signal_handlers()
            
            # Initialize and start scheduler
            self.scheduler = CollectionScheduler()
            self.running = True
            
            logger.info("Scheduler initialized successfully")
            logger.info("Starting scheduled collection (runs immediately + every 6 hours)")
            logger.info("Press Ctrl+C to stop gracefully")
            logger.info("=" * 60)
            
            # Start the scheduler (this blocks)
            self.scheduler.start_scheduled_collection()
            
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
            self.shutdown()
            
        except Exception as e:
            logger.error(f"Fatal error starting scheduler: {e}", exc_info=True)
            self.shutdown()
            sys.exit(1)
            
    def shutdown(self):
        """Gracefully shutdown the scheduler."""
        if self.running and self.scheduler:
            logger.info("Shutting down scheduler...")
            try:
                self.scheduler.shutdown()
                logger.info("Scheduler stopped successfully")
            except Exception as e:
                logger.error(f"Error during shutdown: {e}")
            finally:
                self.running = False
                
    def run_once(self):
        """Run a single collection cycle (for testing)."""
        logger.info("Running single collection cycle...")
        try:
            scheduler = CollectionScheduler()
            results = scheduler.run_single_collection()
            
            # Log results
            total_collected = sum(r.get('count', 0) for r in results.values())
            success_count = sum(1 for r in results.values() if r['status'] == 'success')
            
            logger.info(f"Collection complete:")
            logger.info(f"  Total items collected: {total_collected}")
            logger.info(f"  Successful platforms: {success_count}/{len(results)}")
            
            for platform, result in results.items():
                if result['status'] == 'success':
                    logger.info(f"  {platform}: ✓ {result['count']} items")
                else:
                    logger.error(f"  {platform}: ✗ {result['error']}")
                    
            return total_collected > 0
            
        except Exception as e:
            logger.error(f"Error in single collection: {e}", exc_info=True)
            return False


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Prox Autonomous Data Collection Scheduler',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python start_scheduler.py              # Start continuous scheduler
  python start_scheduler.py --once       # Run single collection cycle
  python start_scheduler.py --test       # Test scheduler without running
        """
    )
    
    parser.add_argument(
        '--once',
        action='store_true',
        help='Run single collection cycle instead of continuous scheduling'
    )
    
    parser.add_argument(
        '--test',
        action='store_true',
        help='Test scheduler initialization without running'
    )
    
    args = parser.parse_args()
    
    manager = SchedulerManager()
    
    if args.test:
        # Test initialization
        try:
            logger.info("Testing scheduler initialization...")
            test_scheduler = CollectionScheduler()
            logger.info("✓ Scheduler initialization successful")
            logger.info(f"✓ Found {len(test_scheduler.collectors)} collectors")
            for name in test_scheduler.collectors.keys():
                logger.info(f"  • {name}")
            return 0
        except Exception as e:
            logger.error(f"✗ Scheduler initialization failed: {e}")
            return 1
            
    elif args.once:
        # Run single collection
        logger.info("Running single collection cycle...")
        success = manager.run_once()
        return 0 if success else 1
        
    else:
        # Start continuous scheduler
        manager.start()
        return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)