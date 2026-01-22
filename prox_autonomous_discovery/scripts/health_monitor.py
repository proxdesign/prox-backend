#!/usr/bin/env python3
"""
Health Monitoring Script for Prox Data Collection
Provides comprehensive health checks and alerting capabilities.
"""

import sys
import os
import json
import smtplib
import logging
import requests
from datetime import datetime, timedelta
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from database.connection import db
from config.settings import settings

# Setup logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


class HealthMonitor:
    """Comprehensive health monitoring for the Prox system."""
    
    def __init__(self):
        self.checks = []
        self.alerts = []
        self.status = "healthy"
        
    def check_database_health(self):
        """Check database connectivity and basic queries."""
        try:
            # Test basic connection
            result = db.fetch_one("SELECT 1")
            if not result or result[0] != 1:
                self.add_alert("critical", "Database connection test failed")
                return False
                
            # Check recent data collection
            recent_posts = db.fetch_one("""
                SELECT COUNT(*) FROM platform_posts 
                WHERE created_at >= NOW() - INTERVAL '2 hours'
            """)
            
            post_count = recent_posts[0] if recent_posts else 0
            
            if post_count == 0:
                self.add_alert("warning", "No posts collected in last 2 hours")
            elif post_count < 10:
                self.add_alert("warning", f"Low data collection: only {post_count} posts in 2 hours")
            else:
                logger.info(f"✓ Database healthy: {post_count} posts in last 2 hours")
                
            # Check database size growth
            try:
                db_size = db.fetch_one("""
                    SELECT pg_size_pretty(pg_database_size(current_database()))
                """)
                
                if db_size:
                    logger.info(f"Database size: {db_size[0]}")
            except Exception as e:
                logger.warning(f"Could not get database size: {e}")
                
            self.checks.append({
                "name": "database_health",
                "status": "pass",
                "details": f"Connected, {post_count} recent posts"
            })
            return True
            
        except Exception as e:
            self.add_alert("critical", f"Database health check failed: {e}")
            self.checks.append({
                "name": "database_health", 
                "status": "fail",
                "error": str(e)
            })
            return False
            
    def check_collection_status(self):
        """Check the status of data collection processes."""
        try:
            # Check collection runs table if it exists
            collection_runs = db.fetch_all("""
                SELECT
                    start_time,
                    end_time,
                    total_collected,
                    EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds,
                    successful_platforms,
                    failed_platforms
                FROM collection_runs
                ORDER BY start_time DESC
                LIMIT 5
            """)
            
            if collection_runs:
                latest_run = collection_runs[0]
                run_time = latest_run[0]
                end_time = latest_run[1]
                posts_collected = latest_run[2] or 0
                duration = latest_run[3] or 0
                successful_platforms = latest_run[4] or 0
                failed_platforms = latest_run[5] or 0

                # Check if last run was successful (has end_time and no failed platforms)
                if end_time is None:
                    self.add_alert("warning", "Last collection run did not complete")
                elif failed_platforms > 0:
                    self.add_alert("warning", f"Last collection run had {failed_platforms} failed platforms")
                    
                # Check if last run was recent enough (within 7 hours for 6-hour schedule)
                time_since_run = datetime.now() - run_time
                if time_since_run > timedelta(hours=7):
                    self.add_alert("warning", f"Last collection run was {time_since_run} ago")
                    
                # Check posts collected amount
                if posts_collected < 10:
                    self.add_alert("warning", f"Low collection volume: {posts_collected} posts")
                    
                duration_str = f"{duration:.1f}s" if duration else "unknown"
                self.checks.append({
                    "name": "collection_status",
                    "status": "pass",
                    "details": f"Last run: {posts_collected} posts, {duration_str} duration, {successful_platforms} platforms OK"
                })
                
                logger.info(f"✓ Collection status: {posts_collected} posts collected")
                return True
                
            else:
                self.add_alert("warning", "No collection runs found in database")
                self.checks.append({
                    "name": "collection_status",
                    "status": "warning", 
                    "details": "No run history"
                })
                return False
                
        except Exception as e:
            # Table might not exist, try alternative check
            logger.warning(f"Collection runs table check failed: {e}")
            
            # Alternative: check posts by creation date
            try:
                recent_posts_by_platform = db.fetch_all("""
                    SELECT 
                        platform,
                        COUNT(*) as posts,
                        MAX(created_at) as latest
                    FROM platform_posts 
                    WHERE created_at >= NOW() - INTERVAL '8 hours'
                    GROUP BY platform
                """)
                
                if recent_posts_by_platform:
                    total_recent = sum(row[1] for row in recent_posts_by_platform)
                    if total_recent > 0:
                        self.checks.append({
                            "name": "collection_status",
                            "status": "pass",
                            "details": f"{total_recent} recent posts across platforms"
                        })
                        return True
                    else:
                        self.add_alert("warning", "No recent posts found")
                        
            except Exception as e2:
                self.add_alert("critical", f"Collection status check failed: {e2}")
                
            self.checks.append({
                "name": "collection_status",
                "status": "fail",
                "error": str(e)
            })
            return False
            
    def check_api_health(self):
        """Check API endpoint health if available."""
        try:
            # Try to check local API health endpoint
            api_urls = [
                "http://localhost:8000/health",
                "http://api:8000/health",
                os.getenv("API_HEALTH_URL")
            ]
            
            for url in api_urls:
                if not url:
                    continue
                    
                try:
                    response = requests.get(url, timeout=10)
                    if response.status_code == 200:
                        self.checks.append({
                            "name": "api_health",
                            "status": "pass",
                            "details": f"API responding at {url}"
                        })
                        logger.info(f"✓ API health: {url} responding")
                        return True
                except requests.RequestException:
                    continue
                    
            # No API endpoints responded
            self.add_alert("info", "API health endpoint not accessible (may be normal)")
            self.checks.append({
                "name": "api_health",
                "status": "skip",
                "details": "No accessible API endpoints"
            })
            return True  # Not critical
            
        except Exception as e:
            self.checks.append({
                "name": "api_health",
                "status": "fail", 
                "error": str(e)
            })
            return False
            
    def check_disk_space(self):
        """Check available disk space."""
        try:
            import shutil
            
            project_root = Path(__file__).parent.parent
            total, used, free = shutil.disk_usage(project_root)
            
            # Convert to GB
            total_gb = total / (1024**3)
            free_gb = free / (1024**3)
            used_percent = (used / total) * 100
            
            if used_percent > 90:
                self.add_alert("critical", f"Disk space critical: {used_percent:.1f}% used")
            elif used_percent > 80:
                self.add_alert("warning", f"Disk space low: {used_percent:.1f}% used")
                
            self.checks.append({
                "name": "disk_space",
                "status": "pass",
                "details": f"{free_gb:.1f}GB free of {total_gb:.1f}GB"
            })
            
            logger.info(f"✓ Disk space: {used_percent:.1f}% used, {free_gb:.1f}GB free")
            return True
            
        except Exception as e:
            self.checks.append({
                "name": "disk_space",
                "status": "fail",
                "error": str(e)
            })
            return False
            
    def check_log_files(self):
        """Check log file sizes and recent entries."""
        try:
            logs_dir = Path(__file__).parent.parent / 'logs'
            
            if not logs_dir.exists():
                self.add_alert("warning", "Logs directory does not exist")
                return False
                
            log_files = list(logs_dir.glob('*.log'))
            total_log_size = sum(f.stat().st_size for f in log_files)
            
            # Convert to MB
            total_mb = total_log_size / (1024**2)
            
            if total_mb > 1000:  # 1GB
                self.add_alert("warning", f"Log files large: {total_mb:.1f}MB")
            elif total_mb > 5000:  # 5GB  
                self.add_alert("critical", f"Log files very large: {total_mb:.1f}MB")
                
            # Check for recent log entries
            recent_logs = 0
            for log_file in log_files:
                if log_file.stat().st_mtime > (datetime.now() - timedelta(hours=2)).timestamp():
                    recent_logs += 1
                    
            self.checks.append({
                "name": "log_files",
                "status": "pass",
                "details": f"{len(log_files)} files, {total_mb:.1f}MB, {recent_logs} recent"
            })
            
            logger.info(f"✓ Log files: {len(log_files)} files, {total_mb:.1f}MB total")
            return True
            
        except Exception as e:
            self.checks.append({
                "name": "log_files",
                "status": "fail",
                "error": str(e)
            })
            return False
            
    def add_alert(self, level, message):
        """Add an alert to the alerts list."""
        self.alerts.append({
            "level": level,
            "message": message,
            "timestamp": datetime.now()
        })
        
        # Update overall status
        if level == "critical":
            self.status = "critical"
        elif level == "warning" and self.status == "healthy":
            self.status = "warning"
            
        logger.log(
            logging.ERROR if level == "critical" else 
            logging.WARNING if level == "warning" else 
            logging.INFO,
            f"ALERT[{level.upper()}]: {message}"
        )
        
    def run_health_checks(self):
        """Run all health checks."""
        logger.info("=" * 60)
        logger.info("HEALTH MONITORING CHECK")
        logger.info("=" * 60)
        
        check_functions = [
            self.check_database_health,
            self.check_collection_status,
            self.check_api_health,
            self.check_disk_space,
            self.check_log_files
        ]
        
        for check_func in check_functions:
            try:
                check_func()
            except Exception as e:
                self.add_alert("critical", f"Health check {check_func.__name__} crashed: {e}")
                
        # Generate summary
        self.generate_summary()
        
        return self.status == "healthy"
        
    def generate_summary(self):
        """Generate and log health check summary."""
        logger.info("")
        logger.info("HEALTH CHECK SUMMARY")
        logger.info("-" * 40)
        
        # Status counts
        passed = sum(1 for c in self.checks if c.get("status") == "pass")
        failed = sum(1 for c in self.checks if c.get("status") == "fail") 
        warnings = sum(1 for c in self.checks if c.get("status") == "warning")
        skipped = sum(1 for c in self.checks if c.get("status") == "skip")
        
        logger.info(f"Overall Status: {self.status.upper()}")
        logger.info(f"Checks: {passed} passed, {failed} failed, {warnings} warnings, {skipped} skipped")
        
        # Alert summary
        critical_alerts = [a for a in self.alerts if a["level"] == "critical"]
        warning_alerts = [a for a in self.alerts if a["level"] == "warning"]
        
        if critical_alerts:
            logger.error(f"🚨 {len(critical_alerts)} CRITICAL ALERTS:")
            for alert in critical_alerts:
                logger.error(f"   • {alert['message']}")
                
        if warning_alerts:
            logger.warning(f"⚠️  {len(warning_alerts)} WARNING ALERTS:")
            for alert in warning_alerts:
                logger.warning(f"   • {alert['message']}")
                
        if not self.alerts:
            logger.info("✅ No alerts - system healthy")
            
    def export_health_report(self, format="json"):
        """Export health report in specified format."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "status": self.status,
            "checks": self.checks,
            "alerts": [
                {
                    **alert,
                    "timestamp": alert["timestamp"].isoformat()
                } 
                for alert in self.alerts
            ]
        }
        
        if format == "json":
            return json.dumps(report, indent=2)
        elif format == "text":
            lines = [
                f"Health Report - {report['timestamp']}",
                f"Status: {report['status'].upper()}",
                "",
                "Checks:"
            ]
            
            for check in self.checks:
                status_icon = "✅" if check["status"] == "pass" else "❌" if check["status"] == "fail" else "⚠️"
                lines.append(f"  {status_icon} {check['name']}: {check.get('details', check.get('error', 'unknown'))}")
                
            if self.alerts:
                lines.append("\nAlerts:")
                for alert in self.alerts:
                    level_icon = "🚨" if alert["level"] == "critical" else "⚠️" if alert["level"] == "warning" else "ℹ️"
                    lines.append(f"  {level_icon} {alert['message']}")
                    
            return "\n".join(lines)
            
        return report


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Health Monitoring for Prox Data Collection',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python health_monitor.py                    # Run health checks
  python health_monitor.py --export json     # Export JSON report
  python health_monitor.py --export text     # Export text report
  python health_monitor.py --alert-email     # Send email on alerts
        """
    )
    
    parser.add_argument(
        '--export',
        choices=['json', 'text'],
        help='Export health report in specified format'
    )
    
    parser.add_argument(
        '--alert-email',
        action='store_true',
        help='Send email alert if issues found'
    )
    
    parser.add_argument(
        '--output',
        help='Output file for report (default: stdout)'
    )
    
    args = parser.parse_args()
    
    # Run health monitoring
    monitor = HealthMonitor()
    is_healthy = monitor.run_health_checks()
    
    # Export report if requested
    if args.export:
        report = monitor.export_health_report(args.export)
        
        if args.output:
            with open(args.output, 'w') as f:
                f.write(report)
            logger.info(f"Report saved to {args.output}")
        else:
            print(report)
            
    # Send email alert if configured and there are alerts
    if args.alert_email and monitor.alerts:
        # Email implementation would go here
        logger.info("Email alerting not yet implemented")
        
    # Exit with appropriate code
    return 0 if is_healthy else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)