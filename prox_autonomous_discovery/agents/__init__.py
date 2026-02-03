"""Prox Autonomous Agents.

This module contains autonomous agents that monitor and maintain the Prox system:

- LinkHealthMonitor: Checks affiliate links and deactivates broken products
- QualityAuditor: Reviews product quality based on user feedback and demotes poor performers
- CostOptimizer: Monitors API costs and provides budget alerts and recommendations
- AgentScheduler: Orchestrates and schedules all agents
"""

from agents.base_agent import BaseAgent
from agents.link_health_monitor import LinkHealthMonitor
from agents.quality_auditor import QualityAuditor
from agents.cost_optimizer import CostOptimizer
from agents.scheduler import AgentScheduler

__all__ = [
    'BaseAgent',
    'LinkHealthMonitor',
    'QualityAuditor',
    'CostOptimizer',
    'AgentScheduler'
]

__version__ = '1.0.0'