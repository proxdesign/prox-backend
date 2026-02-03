"""Schedule and run autonomous agents."""
import logging
import sys
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.schedulers.background import BackgroundScheduler

# Import all agents
from agents.link_health_monitor import LinkHealthMonitor
from agents.quality_auditor import QualityAuditor
from agents.cost_optimizer import CostOptimizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AgentScheduler:
    """Schedules and orchestrates autonomous agents."""
    
    def __init__(self, blocking=True):
        if blocking:
            self.scheduler = BlockingScheduler()
        else:
            self.scheduler = BackgroundScheduler()
        
        self.agents = {
            'link_health_monitor': LinkHealthMonitor(),
            'quality_auditor': QualityAuditor(),
            'cost_optimizer': CostOptimizer()
        }
        
        logger.info(f"Agent scheduler initialized with {len(self.agents)} agents")
    
    def run_agent(self, agent_name: str) -> dict:
        """Run a specific agent."""
        if agent_name not in self.agents:
            raise ValueError(f"Unknown agent: {agent_name}. Available: {list(self.agents.keys())}")
        
        logger.info(f"Starting agent: {agent_name}")
        start_time = datetime.now()
        
        try:
            agent = self.agents[agent_name]
            result = agent.execute()
            duration = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"Agent {agent_name} completed successfully in {duration:.1f}s")
            result['execution_time'] = duration
            return result
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            error_msg = f"Agent {agent_name} failed after {duration:.1f}s: {e}"
            logger.error(error_msg)
            return {
                "error": str(e),
                "execution_time": duration,
                "success": False
            }
    
    def run_all(self) -> dict:
        """Run all agents once."""
        logger.info("=" * 60)
        logger.info("Starting autonomous agent cycle")
        logger.info("=" * 60)
        
        start_time = datetime.now()
        results = {}
        successful_agents = 0
        
        for agent_name in self.agents.keys():
            try:
                result = self.run_agent(agent_name)
                results[agent_name] = result
                
                if result.get('success', True):  # Default to True if not specified
                    successful_agents += 1
                
                # Small delay between agents
                import time
                time.sleep(1)
                
            except Exception as e:
                results[agent_name] = {
                    "error": str(e),
                    "success": False
                }
                logger.error(f"Failed to run agent {agent_name}: {e}")
        
        total_duration = (datetime.now() - start_time).total_seconds()
        
        # Log summary
        logger.info("=" * 60)
        logger.info("Autonomous agent cycle complete")
        logger.info(f"Duration: {total_duration:.1f} seconds")
        logger.info(f"Successful agents: {successful_agents}/{len(self.agents)}")
        logger.info("=" * 60)
        
        # Log individual results
        for agent_name, result in results.items():
            if result.get('success', True):
                processed = result.get('items_processed', result.get('audited', result.get('checked', result.get('analyzed', 0))))
                affected = result.get('items_affected', result.get('demoted', result.get('broken', result.get('total_affected', 0))))
                logger.info(f"  {agent_name}: ✓ processed={processed}, affected={affected}")
            else:
                logger.error(f"  {agent_name}: ✗ {result.get('error', 'Unknown error')}")
        
        return {
            "total_duration": total_duration,
            "successful_agents": successful_agents,
            "total_agents": len(self.agents),
            "results": results
        }
    
    def setup_schedule(self):
        """Configure agent schedules."""
        
        # Link health monitor - every 6 hours
        self.scheduler.add_job(
            lambda: self.run_agent('link_health_monitor'),
            'interval',
            hours=6,
            id='link_health_monitor',
            name='Link Health Monitor',
            max_instances=1
        )
        
        # Quality auditor - daily at 2 AM
        self.scheduler.add_job(
            lambda: self.run_agent('quality_auditor'),
            'cron',
            hour=2,
            minute=0,
            id='quality_auditor',
            name='Quality Auditor',
            max_instances=1
        )

        # Cost optimizer - daily at 11 PM
        self.scheduler.add_job(
            lambda: self.run_agent('cost_optimizer'),
            'cron',
            hour=23,
            minute=0,
            id='cost_optimizer',
            name='Cost Optimizer',
            max_instances=1
        )
        
        logger.info("Agent schedules configured:")
        logger.info("  - Link Health Monitor: every 6 hours")
        logger.info("  - Quality Auditor: daily at 2:00 AM")
        logger.info("  - Cost Optimizer: daily at 11:00 PM")
    
    def start(self):
        """Start the scheduler."""
        self.setup_schedule()
        
        # Run initial cycle
        logger.info("Running initial agent cycle...")
        self.run_all()
        
        logger.info("Starting agent scheduler... Press Ctrl+C to stop.")
        try:
            self.scheduler.start()
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            self.stop()
    
    def stop(self):
        """Stop the scheduler."""
        logger.info("Shutting down agent scheduler...")
        if self.scheduler.running:
            self.scheduler.shutdown(wait=True)
        logger.info("Agent scheduler stopped")
    
    def list_agents(self):
        """List available agents."""
        print("Available agents:")
        for agent_name, agent in self.agents.items():
            print(f"  - {agent_name}: {agent.__class__.__doc__}")


def main():
    """Main entry point for agent scheduler."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Prox Autonomous Agent Scheduler')
    parser.add_argument('--run-once', action='store_true', help='Run all agents once and exit')
    parser.add_argument('--agent', type=str, help='Run specific agent once')
    parser.add_argument('--list', action='store_true', help='List available agents')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon with scheduled jobs')
    
    args = parser.parse_args()
    
    scheduler = AgentScheduler(blocking=not args.run_once and not args.agent)
    
    if args.list:
        scheduler.list_agents()
    elif args.agent:
        try:
            result = scheduler.run_agent(args.agent)
            print(f"Agent {args.agent} result:", result)
        except ValueError as e:
            print(f"Error: {e}")
            sys.exit(1)
    elif args.run_once:
        result = scheduler.run_all()
        print(f"\nAgent cycle complete: {result['successful_agents']}/{result['total_agents']} agents successful")
    elif args.daemon:
        scheduler.start()
    else:
        # Default: run all once
        result = scheduler.run_all()
        print(f"\nAgent cycle complete: {result['successful_agents']}/{result['total_agents']} agents successful")


if __name__ == "__main__":
    main()