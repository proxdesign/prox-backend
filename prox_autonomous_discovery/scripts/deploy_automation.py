#!/usr/bin/env python3
"""
Production Deployment Automation Script
Sets up automated data collection for production environments.
"""

import sys
import os
import json
import subprocess
import logging
from pathlib import Path
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


class DeploymentAutomation:
    """Handles deployment automation setup for various platforms."""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.scripts_dir = self.project_root / 'scripts'
        
    def check_environment(self):
        """Check if environment is properly configured."""
        logger.info("Checking deployment environment...")
        
        required_env_vars = [
            'DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD',
            'ANTHROPIC_API_KEY'
        ]
        
        missing_vars = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_vars.append(var)
                
        if missing_vars:
            logger.error(f"Missing required environment variables: {missing_vars}")
            return False
            
        logger.info("✓ Environment variables configured")
        return True
        
    def test_scripts(self):
        """Test all automation scripts."""
        logger.info("Testing automation scripts...")
        
        scripts_to_test = [
            ('run_collection.py', ['--test']),
            ('run_trend_scoring.py', ['--test']),
            ('start_scheduler.py', ['--test'])
        ]
        
        for script_name, args in scripts_to_test:
            script_path = self.scripts_dir / script_name
            
            if not script_path.exists():
                logger.error(f"Script not found: {script_path}")
                return False
                
            try:
                logger.info(f"Testing {script_name}...")
                result = subprocess.run(
                    [sys.executable, str(script_path)] + args,
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if result.returncode == 0:
                    logger.info(f"✓ {script_name} test passed")
                else:
                    logger.error(f"✗ {script_name} test failed: {result.stderr}")
                    return False
                    
            except subprocess.TimeoutExpired:
                logger.error(f"✗ {script_name} test timed out")
                return False
            except Exception as e:
                logger.error(f"✗ {script_name} test error: {e}")
                return False
                
        logger.info("✓ All scripts tested successfully")
        return True
        
    def setup_railway_deployment(self):
        """Configure Railway deployment with automated jobs."""
        logger.info("Setting up Railway deployment automation...")
        
        railway_config = {
            "$schema": "https://railway.app/railway.schema.json",
            "build": {
                "builder": "nixpacks"
            },
            "deploy": {
                "startCommand": "uvicorn api.main:app --host 0.0.0.0 --port $PORT",
                "healthcheckPath": "/health",
                "healthcheckTimeout": 100,
                "restartPolicyType": "on-failure",
                "restartPolicyMaxRetries": 10
            },
            "environments": {
                "production": {
                    "variables": {
                        "PROX_ENV": "production",
                        "COLLECTION_FREQUENCY_HOURS": "6",
                        "LOG_LEVEL": "INFO"
                    }
                }
            },
            "cron": {
                "datacollection": {
                    "schedule": "0 */6 * * *",
                    "command": "python3 scripts/run_collection.py"
                },
                "trendscoring": {
                    "schedule": "30 */6 * * *", 
                    "command": "python3 scripts/run_trend_scoring.py"
                },
                "healthcheck": {
                    "schedule": "*/30 * * * *",
                    "command": "python3 scripts/run_collection.py --test"
                }
            }
        }
        
        # Write railway.json
        railway_file = self.project_root / 'railway.json'
        with open(railway_file, 'w') as f:
            json.dump(railway_config, f, indent=2)
            
        logger.info(f"✓ Railway configuration written to {railway_file}")
        
        # Create deployment guide
        guide_content = """
# Railway Deployment Guide

## 1. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy project
railway up

# Set environment variables in Railway dashboard:
# - DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD  
# - ANTHROPIC_API_KEY, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
# - YOUTUBE_DATA_API_KEY, PINTEREST_API_KEY
```

## 2. Automated Jobs

The railway.json includes automated cron jobs:
- Data collection every 6 hours
- Trend scoring 30 minutes after collection
- Health checks every 30 minutes

## 3. Monitoring

Check logs in Railway dashboard:
- Service logs for API health
- Cron logs for collection status
- Database for data verification

## 4. Manual Triggers

Force collection run:
```bash
railway run python3 scripts/run_collection.py --force
```
        """
        
        guide_file = self.project_root / 'RAILWAY-DEPLOYMENT.md'
        with open(guide_file, 'w') as f:
            f.write(guide_content)
            
        logger.info(f"✓ Deployment guide written to {guide_file}")
        return True
        
    def setup_docker_automation(self):
        """Configure Docker Compose with automation."""
        logger.info("Setting up Docker automation...")
        
        # Check if docker-compose.yml exists
        docker_compose_file = self.project_root / 'docker-compose.yml'
        
        if docker_compose_file.exists():
            logger.info("✓ Docker Compose file already exists")
            
            # Add scheduler service recommendation
            scheduler_service = """
# Add this service to your docker-compose.yml for automated collection:

  scheduler:
    build:
      context: .
      dockerfile: Dockerfile.api
    environment:
      - PROX_ENV=production
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=prox_discovery
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=${DATABASE_PASSWORD}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
    command: python3 scripts/start_scheduler.py
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
"""
            
            docker_guide = self.project_root / 'DOCKER-AUTOMATION.md'
            with open(docker_guide, 'w') as f:
                f.write("# Docker Automation Setup\n\n")
                f.write(scheduler_service)
                f.write("\n\n# Usage\n\n")
                f.write("```bash\n")
                f.write("# Start with scheduler\n")
                f.write("docker-compose up -d\n")
                f.write("\n# View scheduler logs\n")
                f.write("docker-compose logs -f scheduler\n")
                f.write("\n# Manual collection run\n")
                f.write("docker-compose exec scheduler python3 scripts/run_collection.py\n")
                f.write("```\n")
                
            logger.info(f"✓ Docker automation guide written to {docker_guide}")
            
        return True
        
    def create_local_automation_setup(self):
        """Create macOS launchd setup for local automation."""
        logger.info("Creating local automation setup...")
        
        # Create launchd plist template
        plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.prox.datacollection</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>{self.scripts_dir}/run_collection.py</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>{self.project_root}</string>
    
    <key>StartInterval</key>
    <integer>21600</integer> <!-- 6 hours -->
    
    <key>StandardOutPath</key>
    <string>{self.project_root}/logs/launchd_out.log</string>
    
    <key>StandardErrorPath</key>
    <string>{self.project_root}/logs/launchd_error.log</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <false/>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>"""
        
        plist_file = self.project_root / 'com.prox.datacollection.plist'
        with open(plist_file, 'w') as f:
            f.write(plist_content)
            
        # Create installation script
        install_script = f"""#!/bin/bash
# Install Prox Data Collection Automation (macOS)

PLIST_FILE="{plist_file}"
TARGET_LOCATION="/Library/LaunchDaemons/com.prox.datacollection.plist"

echo "Installing Prox data collection automation..."

# Copy plist file
sudo cp "$PLIST_FILE" "$TARGET_LOCATION"

# Set correct permissions
sudo chown root:wheel "$TARGET_LOCATION"
sudo chmod 644 "$TARGET_LOCATION"

# Load the service
sudo launchctl load "$TARGET_LOCATION"

echo "✓ Automation installed and started"
echo "  Collection runs every 6 hours"
echo "  Logs: {self.project_root}/logs/"
echo ""
echo "Management commands:"
echo "  Stop:   sudo launchctl stop com.prox.datacollection"
echo "  Start:  sudo launchctl start com.prox.datacollection"
echo "  Status: sudo launchctl list | grep prox"
echo "  Remove: sudo launchctl unload '$TARGET_LOCATION' && sudo rm '$TARGET_LOCATION'"
"""
        
        install_file = self.project_root / 'install_automation.sh'
        with open(install_file, 'w') as f:
            f.write(install_script)
            
        # Make executable
        os.chmod(install_file, 0o755)
        
        logger.info(f"✓ Local automation setup created:")
        logger.info(f"  • Plist file: {plist_file}")
        logger.info(f"  • Install script: {install_file}")
        logger.info(f"  • Run: ./install_automation.sh")
        
        return True
        
    def verify_deployment(self):
        """Verify deployment is working correctly."""
        logger.info("Verifying deployment setup...")
        
        # Check required files exist
        required_files = [
            'scripts/run_collection.py',
            'scripts/run_trend_scoring.py', 
            'scripts/start_scheduler.py',
            'railway.json'
        ]
        
        for file_path in required_files:
            full_path = self.project_root / file_path
            if not full_path.exists():
                logger.error(f"Missing required file: {file_path}")
                return False
                
        logger.info("✓ All required files present")
        
        # Test database connection
        try:
            sys.path.append(str(self.project_root))
            from database.connection import db
            result = db.fetch_one("SELECT 1 as test")
            if result and result[0] == 1:
                logger.info("✓ Database connection successful")
            else:
                logger.error("✗ Database connection failed")
                return False
        except Exception as e:
            logger.error(f"✗ Database test failed: {e}")
            return False
            
        logger.info("✓ Deployment verification completed")
        return True
        
    def run_deployment_setup(self):
        """Run complete deployment setup."""
        logger.info("=" * 60)
        logger.info("PROX DEPLOYMENT AUTOMATION SETUP")
        logger.info("=" * 60)
        
        steps = [
            ("Environment Check", self.check_environment),
            ("Script Testing", self.test_scripts),
            ("Railway Setup", self.setup_railway_deployment),
            ("Docker Setup", self.setup_docker_automation),
            ("Local Setup", self.create_local_automation_setup),
            ("Deployment Verification", self.verify_deployment)
        ]
        
        for step_name, step_function in steps:
            logger.info(f"\n🔄 {step_name}...")
            try:
                if not step_function():
                    logger.error(f"✗ {step_name} failed")
                    return False
                logger.info(f"✓ {step_name} completed")
            except Exception as e:
                logger.error(f"✗ {step_name} error: {e}")
                return False
                
        logger.info("\n" + "=" * 60)
        logger.info("🎉 DEPLOYMENT AUTOMATION SETUP COMPLETE!")
        logger.info("=" * 60)
        
        logger.info("\nNext Steps:")
        logger.info("1. Choose deployment platform:")
        logger.info("   • Railway: Deploy with railway.json (includes cron jobs)")
        logger.info("   • Docker: Use docker-compose with scheduler service")  
        logger.info("   • Local: Run ./install_automation.sh")
        logger.info("\n2. Configure environment variables on your platform")
        logger.info("\n3. Monitor logs and verify collection is working")
        
        return True


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Production Deployment Automation Setup',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        '--verify-only',
        action='store_true',
        help='Only verify existing setup without creating files'
    )
    
    args = parser.parse_args()
    
    deployer = DeploymentAutomation()
    
    if args.verify_only:
        success = deployer.verify_deployment()
    else:
        success = deployer.run_deployment_setup()
        
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)