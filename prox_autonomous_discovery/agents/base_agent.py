"""Base class for all autonomous agents."""
import logging
import json
from datetime import datetime
from database.connection import db

class BaseAgent:
    """Base class for autonomous agents with logging and error tracking."""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"agent.{name}")
        self.start_time = None
        self.items_processed = 0
        self.items_affected = 0
        self.errors = []
        
        # Set up logging format
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                f'%(asctime)s - AGENT[{self.name}] - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
    
    def run(self) -> dict:
        """Override this method in subclasses to implement agent logic."""
        raise NotImplementedError(f"Agent {self.name} must implement run() method")
    
    def execute(self) -> dict:
        """Wrapper that handles logging and error tracking."""
        self.start_time = datetime.now()
        self.items_processed = 0
        self.items_affected = 0
        self.errors = []
        
        self.logger.info(f"Starting agent {self.name}")
        
        try:
            result = self.run()
            self._log_run(success=True, result=result)
            self.logger.info(f"Agent {self.name} completed successfully")
            return result
            
        except Exception as e:
            error_msg = str(e)
            self.errors.append(error_msg)
            self.logger.error(f"Agent {self.name} failed: {error_msg}")
            self._log_run(success=False, result={"error": error_msg})
            raise
    
    def _log_run(self, success: bool, result: dict):
        """Log agent run to database."""
        if self.start_time is None:
            duration = 0
        else:
            duration = (datetime.now() - self.start_time).total_seconds()
        
        try:
            db.execute_query("""
                INSERT INTO agent_logs 
                (agent_name, action_type, details, items_processed, items_affected, 
                 errors, started_at, completed_at, duration_seconds, success)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s)
            """, (
                self.name,
                'scheduled_run',
                json.dumps(result) if result else None,
                self.items_processed,
                self.items_affected,
                json.dumps(self.errors) if self.errors else None,
                self.start_time,
                duration,
                success
            ), fetch=False)
        
        except Exception as log_error:
            self.logger.error(f"Failed to log agent run: {log_error}")
        
        # Log summary to console
        self.logger.info(
            f"Agent {self.name} summary: "
            f"processed={self.items_processed}, "
            f"affected={self.items_affected}, "
            f"duration={duration:.1f}s, "
            f"success={success}"
        )
    
    def log_info(self, message: str):
        """Helper method for logging info messages."""
        self.logger.info(message)
    
    def log_warning(self, message: str):
        """Helper method for logging warning messages."""
        self.logger.warning(message)
    
    def log_error(self, message: str):
        """Helper method for logging error messages."""
        self.logger.error(message)
        self.errors.append(message)


if __name__ == "__main__":
    # Test the base agent
    class TestAgent(BaseAgent):
        def run(self):
            self.items_processed = 5
            self.items_affected = 2
            return {"test": "successful", "processed": self.items_processed}
    
    logging.basicConfig(level=logging.INFO)
    agent = TestAgent("test_agent")
    result = agent.execute()
    print(f"Test result: {result}")