#!/usr/bin/env python3
"""
Alert Management Script for Prox Data Collection
Handles sending alerts via email, Slack, and other channels.
"""

import os
import json
import smtplib
import requests
import logging
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


class AlertManager:
    """Manages sending alerts via various channels."""
    
    def __init__(self):
        self.email_enabled = bool(os.getenv('SMTP_HOST'))
        self.slack_enabled = bool(os.getenv('SLACK_WEBHOOK_URL'))
        
    def send_email_alert(self, subject, message, to_emails=None):
        """Send email alert."""
        if not self.email_enabled:
            logger.warning("Email not configured, skipping email alert")
            return False
            
        try:
            smtp_host = os.getenv('SMTP_HOST')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            smtp_user = os.getenv('SMTP_USER')
            smtp_password = os.getenv('SMTP_PASSWORD')
            from_email = os.getenv('ALERT_FROM_EMAIL', smtp_user)
            
            if not to_emails:
                to_emails = os.getenv('ALERT_TO_EMAILS', '').split(',')
                to_emails = [email.strip() for email in to_emails if email.strip()]
                
            if not to_emails:
                logger.error("No recipient emails configured")
                return False
                
            # Create message
            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = f"[Prox Alert] {subject}"
            
            # Add timestamp to message
            timestamped_message = f"""
Alert Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
System: Prox Data Collection

{message}

---
This is an automated alert from the Prox data collection system.
            """.strip()
            
            msg.attach(MIMEText(timestamped_message, 'plain'))
            
            # Send email
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                text = msg.as_string()
                server.sendmail(from_email, to_emails, text)
                
            logger.info(f"Email alert sent to {len(to_emails)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False
            
    def send_slack_alert(self, message, level="warning"):
        """Send Slack alert."""
        if not self.slack_enabled:
            logger.warning("Slack not configured, skipping Slack alert")
            return False
            
        try:
            webhook_url = os.getenv('SLACK_WEBHOOK_URL')
            
            # Choose emoji based on level
            emoji_map = {
                'critical': '🚨',
                'warning': '⚠️',
                'info': 'ℹ️',
                'success': '✅'
            }
            
            emoji = emoji_map.get(level, '📊')
            
            # Format message for Slack
            slack_message = {
                "text": f"Prox Alert - {level.title()}",
                "attachments": [
                    {
                        "color": "danger" if level == "critical" else "warning" if level == "warning" else "good",
                        "fields": [
                            {
                                "title": f"{emoji} Prox Data Collection Alert",
                                "value": message,
                                "short": False
                            },
                            {
                                "title": "Timestamp",
                                "value": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                "short": True
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(
                webhook_url, 
                json=slack_message,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("Slack alert sent successfully")
                return True
            else:
                logger.error(f"Slack alert failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
            return False
            
    def send_webhook_alert(self, message, level="warning"):
        """Send alert to custom webhook."""
        webhook_url = os.getenv('CUSTOM_WEBHOOK_URL')
        
        if not webhook_url:
            logger.debug("No custom webhook configured")
            return False
            
        try:
            payload = {
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "message": message,
                "system": "prox-data-collection"
            }
            
            response = requests.post(
                webhook_url,
                json=payload,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [200, 201, 202]:
                logger.info("Custom webhook alert sent successfully")
                return True
            else:
                logger.error(f"Custom webhook alert failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send custom webhook alert: {e}")
            return False
            
    def send_alert(self, subject, message, level="warning", channels=None):
        """Send alert via all configured channels."""
        if channels is None:
            channels = ['email', 'slack', 'webhook']
            
        results = {}
        
        if 'email' in channels:
            results['email'] = self.send_email_alert(subject, message)
            
        if 'slack' in channels:
            results['slack'] = self.send_slack_alert(message, level)
            
        if 'webhook' in channels:
            results['webhook'] = self.send_webhook_alert(message, level)
            
        # Log overall results
        successful_channels = [ch for ch, success in results.items() if success]
        failed_channels = [ch for ch, success in results.items() if not success]
        
        if successful_channels:
            logger.info(f"Alert sent successfully via: {', '.join(successful_channels)}")
            
        if failed_channels:
            logger.warning(f"Alert failed via: {', '.join(failed_channels)}")
            
        return any(results.values())


def send_health_alert(health_report_file):
    """Send alert based on health report."""
    try:
        with open(health_report_file, 'r') as f:
            report = json.load(f)
            
        status = report.get('status', 'unknown')
        alerts = report.get('alerts', [])
        
        if status == 'healthy' and not alerts:
            logger.info("System healthy, no alerts to send")
            return True
            
        # Prepare alert message
        alert_manager = AlertManager()
        
        if status == 'critical':
            level = 'critical'
            subject = 'CRITICAL: Prox Data Collection Issues'
        elif status == 'warning':
            level = 'warning'
            subject = 'WARNING: Prox Data Collection Warnings'
        else:
            level = 'info'
            subject = 'INFO: Prox Data Collection Status'
            
        # Format message
        message_lines = [
            f"System Status: {status.upper()}",
            ""
        ]
        
        if alerts:
            message_lines.append("Active Alerts:")
            for alert in alerts:
                alert_level = alert.get('level', 'unknown').upper()
                alert_msg = alert.get('message', 'No message')
                message_lines.append(f"  • [{alert_level}] {alert_msg}")
            message_lines.append("")
            
        # Add check summary
        checks = report.get('checks', [])
        passed = sum(1 for c in checks if c.get('status') == 'pass')
        failed = sum(1 for c in checks if c.get('status') == 'fail')
        
        message_lines.extend([
            f"Health Checks: {passed} passed, {failed} failed",
            "",
            f"Report generated: {report.get('timestamp', 'unknown')}"
        ])
        
        message = '\n'.join(message_lines)
        
        # Send alert
        return alert_manager.send_alert(subject, message, level)
        
    except Exception as e:
        logger.error(f"Failed to process health report: {e}")
        return False


def main():
    """Main entry point for alert management."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Alert Management for Prox Data Collection',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python send_alerts.py --test-email                    # Test email configuration
  python send_alerts.py --test-slack                    # Test Slack configuration
  python send_alerts.py --health-report health.json    # Send alert from health report
  python send_alerts.py --message "Test alert"         # Send custom alert
        """
    )
    
    parser.add_argument(
        '--test-email',
        action='store_true',
        help='Send test email'
    )
    
    parser.add_argument(
        '--test-slack',
        action='store_true',
        help='Send test Slack message'
    )
    
    parser.add_argument(
        '--health-report',
        help='Send alert based on health report JSON file'
    )
    
    parser.add_argument(
        '--message',
        help='Send custom alert message'
    )
    
    parser.add_argument(
        '--level',
        choices=['info', 'warning', 'critical'],
        default='info',
        help='Alert level for custom messages'
    )
    
    parser.add_argument(
        '--channels',
        nargs='+',
        choices=['email', 'slack', 'webhook'],
        help='Specific channels to send alert to'
    )
    
    args = parser.parse_args()
    
    alert_manager = AlertManager()
    
    if args.test_email:
        logger.info("Testing email configuration...")
        success = alert_manager.send_email_alert(
            "Test Alert",
            "This is a test email from the Prox alert system."
        )
        return 0 if success else 1
        
    elif args.test_slack:
        logger.info("Testing Slack configuration...")
        success = alert_manager.send_slack_alert(
            "This is a test message from the Prox alert system.",
            "info"
        )
        return 0 if success else 1
        
    elif args.health_report:
        if not Path(args.health_report).exists():
            logger.error(f"Health report file not found: {args.health_report}")
            return 1
            
        success = send_health_alert(args.health_report)
        return 0 if success else 1
        
    elif args.message:
        success = alert_manager.send_alert(
            f"Custom Alert - {args.level.title()}",
            args.message,
            args.level,
            args.channels
        )
        return 0 if success else 1
        
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)