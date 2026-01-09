#!/usr/bin/env python3
"""
Single Data Collection Run
Cron-compatible script for running data collection once.
Suitable for scheduled jobs and manual execution.
"""

import sys
import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from collectors.scheduler import CollectionScheduler
from database.connection import db
from config.settings import settings

# Setup logging
log_dir = Path(__file__).parent.parent / 'logs'
log_dir.mkdir(exist_ok=True)

# Create dated log file for each run
log_file = log_dir / f'collection_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


class CollectionRunner:
    """Runs a single data collection cycle with comprehensive logging and error handling."""
    
    def __init__(self):
        self.run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.start_time = datetime.now()
        self.results = {}
        
    def log_run_start(self):
        """Log collection run start details."""
        logger.info("=" * 70)
        logger.info(f"PROX DATA COLLECTION RUN: {self.run_id}")
        logger.info("=" * 70)
        logger.info(f"Start time: {self.start_time}")
        logger.info(f"Environment: {os.getenv('PROX_ENV', 'development')}")
        logger.info(f"Log file: {log_file}")
        logger.info("")
        
    def check_last_run(self):
        """Check when last collection was run to avoid excessive API calls."""
        try:
            # Check if we've run recently (within last 4 hours)
            four_hours_ago = datetime.now() - timedelta(hours=4)
            
            # You could store last run time in database or file
            # For now, we'll check log files
            recent_logs = []
            for log_path in log_dir.glob('collection_*.log'):
                try:
                    # Extract timestamp from filename
                    timestamp_str = log_path.stem.split('_', 1)[1]
                    log_time = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
                    if log_time > four_hours_ago:
                        recent_logs.append(log_time)
                except:
                    continue
                    
            if recent_logs:
                latest = max(recent_logs)
                logger.warning(f"Recent collection found: {latest}")
                logger.warning("Consider spacing collections at least 4 hours apart for API limits")
                
                # Don't prevent run, just warn
                response = input("Continue anyway? (y/N): ").strip().lower()
                if response != 'y':
                    logger.info("Collection cancelled by user")
                    return False
                    
            return True
            
        except Exception as e:
            logger.warning(f"Could not check last run: {e}")
            return True
            
    def run_collection(self):
        """Execute the collection process."""
        try:
            logger.info("Initializing collection scheduler...")
            scheduler = CollectionScheduler()
            
            logger.info("Starting data collection...")
            self.results = scheduler.collect_all_platforms()
            
            return True
            
        except Exception as e:
            logger.error(f"Collection failed: {e}", exc_info=True)
            self.results = {"error": str(e)}
            return False
            
    def analyze_results(self):
        """Analyze and log collection results."""
        if "error" in self.results:
            logger.error(f"Collection failed with error: {self.results['error']}")
            return False
            
        # Calculate totals
        total_collected = sum(r.get('count', 0) for r in self.results.values() if isinstance(r, dict))
        successful_platforms = sum(1 for r in self.results.values() if isinstance(r, dict) and r.get('status') == 'success')
        failed_platforms = len(self.results) - successful_platforms
        
        # Log summary
        logger.info("")
        logger.info("COLLECTION RESULTS SUMMARY")
        logger.info("-" * 40)
        logger.info(f"Total items collected: {total_collected}")
        logger.info(f"Successful platforms: {successful_platforms}")
        logger.info(f"Failed platforms: {failed_platforms}")
        logger.info("")
        
        # Log per-platform results
        logger.info("PLATFORM BREAKDOWN")
        logger.info("-" * 40)
        for platform, result in self.results.items():
            if isinstance(result, dict):
                if result.get('status') == 'success':
                    logger.info(f"✓ {platform:12} | {result.get('count', 0):4} items collected")
                else:
                    logger.error(f"✗ {platform:12} | Error: {result.get('error', 'Unknown error')}")
            else:
                logger.warning(f"? {platform:12} | Unexpected result format")
                
        return total_collected > 0
        
    def save_results_to_database(self):
        """Save collection run results to database for tracking."""
        try:
            # Create collection_runs table if it doesn't exist
            create_table_query = """
                CREATE TABLE IF NOT EXISTS collection_runs (
                    id SERIAL PRIMARY KEY,
                    run_id VARCHAR(50) UNIQUE NOT NULL,
                    start_time TIMESTAMP NOT NULL,
                    end_time TIMESTAMP NOT NULL,
                    total_collected INTEGER DEFAULT 0,
                    successful_platforms INTEGER DEFAULT 0,
                    failed_platforms INTEGER DEFAULT 0,
                    results JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """
            
            db.execute_query(create_table_query)
            
            # Calculate summary stats
            total_collected = sum(r.get('count', 0) for r in self.results.values() if isinstance(r, dict))
            successful_platforms = sum(1 for r in self.results.values() if isinstance(r, dict) and r.get('status') == 'success')
            failed_platforms = len(self.results) - successful_platforms
            
            # Insert run record
            insert_query = """
                INSERT INTO collection_runs 
                (run_id, start_time, end_time, total_collected, successful_platforms, failed_platforms, results)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (run_id) DO NOTHING
            """
            
            db.execute_query(insert_query, (
                self.run_id,
                self.start_time,
                datetime.now(),
                total_collected,
                successful_platforms,
                failed_platforms,
                json.dumps(self.results)
            ))
            
            logger.info(f"✓ Collection run {self.run_id} saved to database")
            
        except Exception as e:
            logger.warning(f"Could not save results to database: {e}")
            
    def cleanup_old_logs(self, keep_days=30):
        """Clean up old log files to prevent disk space issues."""
        try:
            cutoff_date = datetime.now() - timedelta(days=keep_days)
            cleaned = 0
            
            for log_path in log_dir.glob('collection_*.log'):
                try:
                    # Extract timestamp from filename
                    timestamp_str = log_path.stem.split('_', 1)[1]
                    log_time = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
                    
                    if log_time < cutoff_date:
                        log_path.unlink()
                        cleaned += 1
                        
                except:
                    continue
                    
            if cleaned > 0:
                logger.info(f"✓ Cleaned {cleaned} old log files (older than {keep_days} days)")
                
        except Exception as e:
            logger.warning(f"Could not clean old logs: {e}")
            
    def run(self, check_recent=True):
        """Execute full collection run."""
        self.log_run_start()
        
        # Check if we should run (respects recent runs)
        if check_recent and not self.check_last_run():
            return False
            
        # Run collection
        success = self.run_collection()
        
        # Analyze and log results
        if success:
            success = self.analyze_results()
            
        # Save results to database
        self.save_results_to_database()
        
        # Clean up old logs
        self.cleanup_old_logs()
        
        # Final log
        duration = datetime.now() - self.start_time
        logger.info("")
        logger.info("=" * 70)
        if success:
            logger.info(f"✓ COLLECTION RUN {self.run_id} COMPLETED SUCCESSFULLY")
        else:
            logger.error(f"✗ COLLECTION RUN {self.run_id} FAILED")
        logger.info(f"Duration: {duration.total_seconds():.1f} seconds")
        logger.info(f"Log saved: {log_file}")
        logger.info("=" * 70)
        
        return success


def main():
    """Main entry point for cron or manual execution."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Single Data Collection Run',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_collection.py                    # Normal collection run
  python run_collection.py --force            # Force run (ignore recent runs)
  python run_collection.py --platform reddit  # Run single platform only
  
Cron Examples:
  # Every 6 hours
  0 */6 * * * /usr/bin/python3 /path/to/run_collection.py
  
  # Daily at 2 AM
  0 2 * * * /usr/bin/python3 /path/to/run_collection.py
        """
    )
    
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force collection run even if recent run detected'
    )
    
    parser.add_argument(
        '--platform',
        help='Run collection for single platform only (reddit, youtube, pinterest)'
    )
    
    parser.add_argument(
        '--test',
        action='store_true',
        help='Test run without actually collecting data'
    )
    
    args = parser.parse_args()
    
    if args.test:
        # Test initialization
        try:
            logger.info("Testing collection system...")
            scheduler = CollectionScheduler()
            logger.info(f"✓ Found {len(scheduler.collectors)} collectors:")
            for name in scheduler.collectors.keys():
                logger.info(f"  • {name}")
            logger.info("✓ Test completed successfully")
            return 0
        except Exception as e:
            logger.error(f"✗ Test failed: {e}")
            return 1
            
    elif args.platform:
        # Single platform run
        try:
            logger.info(f"Running collection for {args.platform} only...")
            scheduler = CollectionScheduler()
            count = scheduler.run_single_platform(args.platform)
            if count is not None:
                logger.info(f"✓ Collected {count} items from {args.platform}")
                return 0
            else:
                logger.error(f"✗ Failed to collect from {args.platform}")
                return 1
        except Exception as e:
            logger.error(f"✗ Single platform collection failed: {e}")
            return 1
            
    else:
        # Full collection run
        runner = CollectionRunner()
        success = runner.run(check_recent=not args.force)
        return 0 if success else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)