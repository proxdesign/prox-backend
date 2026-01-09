#!/usr/bin/env python3
"""
Integrated Monitoring and Alerting Script
Runs health checks and sends alerts when issues are detected.
"""

import sys
import os
import time
import logging
import tempfile
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from scripts.health_monitor import HealthMonitor
from scripts.send_alerts import AlertManager, send_health_alert

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path(__file__).parent.parent / 'logs' / 'monitoring.log')
    ]
)

logger = logging.getLogger(__name__)


class MonitoringDaemon:
    """Integrated monitoring daemon that runs health checks and sends alerts."""
    
    def __init__(self, alert_on_warnings=True, alert_on_critical=True):
        self.health_monitor = HealthMonitor()
        self.alert_manager = AlertManager()
        self.alert_on_warnings = alert_on_warnings
        self.alert_on_critical = alert_on_critical
        self.last_alert_time = {}  # Track alert frequency
        
    def should_send_alert(self, alert_type, cooldown_minutes=30):
        """Check if we should send an alert based on cooldown period."""
        now = datetime.now()
        last_sent = self.last_alert_time.get(alert_type)
        
        if last_sent is None:
            return True
            
        minutes_since_last = (now - last_sent).total_seconds() / 60
        return minutes_since_last >= cooldown_minutes
        
    def run_monitoring_cycle(self):
        """Run one complete monitoring cycle."""
        logger.info("=" * 60)
        logger.info("MONITORING CYCLE START")
        logger.info("=" * 60)
        
        try:
            # Run health checks
            is_healthy = self.health_monitor.run_health_checks()
            
            # Determine if alerts should be sent
            status = self.health_monitor.status
            alerts = self.health_monitor.alerts
            
            should_alert = False
            alert_level = 'info'
            
            if status == 'critical' and self.alert_on_critical:
                if self.should_send_alert('critical', cooldown_minutes=15):
                    should_alert = True
                    alert_level = 'critical'
                    
            elif status == 'warning' and self.alert_on_warnings:
                if self.should_send_alert('warning', cooldown_minutes=60):
                    should_alert = True
                    alert_level = 'warning'
                    
            # Send alerts if needed
            if should_alert and alerts:
                logger.info(f"Sending {alert_level} alert...")
                
                # Generate alert message
                subject = f"Prox System {status.title()}"
                
                message_lines = [
                    f"System Status: {status.upper()}",
                    f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    ""
                ]
                
                # Add alert details
                critical_alerts = [a for a in alerts if a['level'] == 'critical']
                warning_alerts = [a for a in alerts if a['level'] == 'warning']
                
                if critical_alerts:
                    message_lines.append("🚨 CRITICAL ISSUES:")
                    for alert in critical_alerts:
                        message_lines.append(f"  • {alert['message']}")
                    message_lines.append("")
                    
                if warning_alerts:
                    message_lines.append("⚠️  WARNINGS:")
                    for alert in warning_alerts:
                        message_lines.append(f"  • {alert['message']}")
                    message_lines.append("")
                    
                # Add system summary
                checks = self.health_monitor.checks
                passed = sum(1 for c in checks if c.get('status') == 'pass')
                failed = sum(1 for c in checks if c.get('status') == 'fail')
                
                message_lines.extend([
                    f"Health Checks: {passed} passed, {failed} failed",
                    "",
                    "This is an automated alert from the Prox monitoring system."
                ])
                
                message = '\n'.join(message_lines)
                
                # Send alert
                success = self.alert_manager.send_alert(subject, message, alert_level)
                
                if success:
                    self.last_alert_time[alert_level] = datetime.now()
                    logger.info(f"✅ {alert_level.title()} alert sent successfully")
                else:
                    logger.error(f"❌ Failed to send {alert_level} alert")
                    
            elif alerts:
                logger.info(f"Alerts present but cooldown active for {status} alerts")
                
            else:
                logger.info("✅ System healthy, no alerts needed")
                
            # Log summary
            logger.info(f"Monitoring cycle completed - Status: {status}")
            
            return is_healthy
            
        except Exception as e:
            logger.error(f"Monitoring cycle failed: {e}", exc_info=True)
            
            # Send critical alert about monitoring failure
            if self.should_send_alert('monitoring_failure', cooldown_minutes=60):
                self.alert_manager.send_alert(
                    "Monitoring System Failure",
                    f"The Prox monitoring system encountered an error: {e}",
                    'critical'
                )
                self.last_alert_time['monitoring_failure'] = datetime.now()
                
            return False
            
    def run_daemon(self, interval_minutes=30):
        """Run monitoring daemon continuously."""
        logger.info(f"Starting monitoring daemon (interval: {interval_minutes} minutes)")
        
        try:
            while True:
                start_time = time.time()
                
                # Run monitoring cycle
                self.run_monitoring_cycle()
                
                # Calculate sleep time
                cycle_duration = time.time() - start_time
                sleep_time = max(0, (interval_minutes * 60) - cycle_duration)
                
                logger.info(f"Monitoring cycle took {cycle_duration:.1f}s, sleeping for {sleep_time:.0f}s")
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                    
        except KeyboardInterrupt:
            logger.info("Monitoring daemon stopped by user")
            
        except Exception as e:
            logger.error(f"Monitoring daemon crashed: {e}", exc_info=True)
            raise
            
    def run_once_with_report(self, output_file=None):
        """Run monitoring once and optionally save report."""
        # Run health checks
        is_healthy = self.health_monitor.run_health_checks()
        
        # Generate report
        report = self.health_monitor.export_health_report('json')
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            logger.info(f"Health report saved to {output_file}")
            
        # Send alerts if configured
        if not is_healthy:
            logger.warning("System not healthy, checking alert conditions...")
            
            status = self.health_monitor.status
            if (status == 'critical' and self.alert_on_critical) or \
               (status == 'warning' and self.alert_on_warnings):
                
                # Use temporary file for alert processing
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    f.write(report)
                    temp_file = f.name
                    
                try:
                    send_health_alert(temp_file)
                finally:
                    os.unlink(temp_file)
                    
        return is_healthy


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Integrated Monitoring and Alerting',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python monitor_and_alert.py                           # Run once
  python monitor_and_alert.py --daemon                  # Run continuously
  python monitor_and_alert.py --daemon --interval 15    # Run every 15 minutes
  python monitor_and_alert.py --no-warnings             # Only alert on critical issues
  python monitor_and_alert.py --report health.json     # Save report to file
        """
    )
    
    parser.add_argument(
        '--daemon',
        action='store_true',
        help='Run as daemon (continuous monitoring)'
    )
    
    parser.add_argument(
        '--interval',
        type=int,
        default=30,
        help='Monitoring interval in minutes (daemon mode only)'
    )
    
    parser.add_argument(
        '--no-warnings',
        action='store_true',
        help='Only send alerts for critical issues'
    )
    
    parser.add_argument(
        '--no-critical',
        action='store_true',
        help='Disable critical alerts (for testing)'
    )
    
    parser.add_argument(
        '--report',
        help='Save health report to file'
    )
    
    parser.add_argument(
        '--test-alert',
        choices=['info', 'warning', 'critical'],
        help='Send test alert'
    )
    
    args = parser.parse_args()
    
    # Create monitoring daemon
    daemon = MonitoringDaemon(
        alert_on_warnings=not args.no_warnings,
        alert_on_critical=not args.no_critical
    )
    
    try:
        if args.test_alert:
            # Send test alert
            logger.info(f"Sending test {args.test_alert} alert...")
            success = daemon.alert_manager.send_alert(
                f"Test {args.test_alert.title()} Alert",
                f"This is a test {args.test_alert} alert from the Prox monitoring system.",
                args.test_alert
            )
            return 0 if success else 1
            
        elif args.daemon:
            # Run as daemon
            daemon.run_daemon(args.interval)
            return 0
            
        else:
            # Run once
            is_healthy = daemon.run_once_with_report(args.report)
            return 0 if is_healthy else 1
            
    except KeyboardInterrupt:
        logger.info("Monitoring stopped by user")
        return 0
        
    except Exception as e:
        logger.error(f"Monitoring failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    # Ensure logs directory exists
    logs_dir = Path(__file__).parent.parent / 'logs'
    logs_dir.mkdir(exist_ok=True)
    
    exit_code = main()
    sys.exit(exit_code)