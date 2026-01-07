#!/usr/bin/env python3
"""Health check endpoints for monitoring and deployment."""

import time
import os
from datetime import datetime
from typing import Dict, Any
import psutil
from fastapi import APIRouter, HTTPException
from database.connection import db
from api.error_handler import HealthChecker, logger

router = APIRouter()

@router.get("/health")
async def basic_health() -> Dict[str, str]:
    """Basic health check for load balancers."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "prox-autonomous-discovery"
    }

@router.get("/health/detailed")
async def detailed_health() -> Dict[str, Any]:
    """Detailed health check with system information."""
    
    try:
        start_time = time.time()
        
        # Get individual component health
        db_health = await HealthChecker.check_database()
        ai_health = await HealthChecker.check_ai_service()
        
        # System metrics
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Process information
        process = psutil.Process()
        process_info = {
            "pid": process.pid,
            "memory_mb": round(process.memory_info().rss / 1024 / 1024, 2),
            "cpu_percent": process.cpu_percent(),
            "threads": process.num_threads(),
            "open_files": len(process.open_files()),
            "connections": len(process.connections()),
            "uptime_seconds": round(time.time() - process.create_time(), 2)
        }
        
        # Response time
        check_duration = round((time.time() - start_time) * 1000, 2)
        
        health_status = {
            "status": "healthy" if db_health["status"] == "healthy" and ai_health["status"] == "healthy" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": check_duration,
            "service": "prox-autonomous-discovery",
            "version": "1.0.0",
            "environment": os.getenv('PROX_ENV', 'development'),
            
            "components": {
                "database": db_health,
                "ai_service": ai_health
            },
            
            "system": {
                "memory": {
                    "total_gb": round(memory.total / 1024 / 1024 / 1024, 2),
                    "available_gb": round(memory.available / 1024 / 1024 / 1024, 2),
                    "used_percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / 1024 / 1024 / 1024, 2),
                    "free_gb": round(disk.free / 1024 / 1024 / 1024, 2),
                    "used_percent": round((disk.used / disk.total) * 100, 2)
                },
                "cpu_percent": psutil.cpu_percent(interval=1)
            },
            
            "process": process_info
        }
        
        logger.debug(f"Health check completed in {check_duration}ms")
        return health_status
        
    except Exception as e:
        logger.error("Health check failed", e)
        raise HTTPException(
            status_code=500,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

@router.get("/health/database")
async def database_health() -> Dict[str, Any]:
    """Database-specific health check."""
    
    try:
        start_time = time.time()
        
        # Basic connectivity
        basic_result = db.fetch_one("SELECT 1 as test")
        if not basic_result or basic_result[0] != 1:
            raise Exception("Database query failed")
        
        # Table counts
        tables_query = """
            SELECT 
                tablename,
                schemaname
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """
        tables = db.fetch_all(tables_query)
        
        # Get row counts for main tables
        table_counts = {}
        main_tables = ['products', 'problems', 'solutions', 'platform_posts', 'user_sessions']
        
        for table in main_tables:
            try:
                count_result = db.fetch_one(f"SELECT COUNT(*) FROM {table}")
                table_counts[table] = count_result[0] if count_result else 0
            except:
                table_counts[table] = "N/A"
        
        # Database version
        version_result = db.fetch_one("SELECT version()")
        db_version = version_result[0] if version_result else "Unknown"
        
        # Connection info
        connection_result = db.fetch_one("""
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity
        """)
        
        check_duration = round((time.time() - start_time) * 1000, 2)
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": check_duration,
            "database": {
                "version": db_version,
                "tables_count": len(tables),
                "table_rows": table_counts,
                "connections": {
                    "total": connection_result[0] if connection_result else 0,
                    "active": connection_result[1] if connection_result else 0,
                    "idle": connection_result[2] if connection_result else 0
                }
            }
        }
        
    except Exception as e:
        logger.error("Database health check failed", e)
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@router.get("/health/ai")
async def ai_service_health() -> Dict[str, Any]:
    """AI service health check."""
    
    try:
        api_key = os.getenv('ANTHROPIC_API_KEY')
        
        if not api_key:
            return {
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": "ANTHROPIC_API_KEY not configured"
            }
        
        # Check if API key is properly formatted
        if not api_key.startswith('sk-ant-'):
            return {
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": "Invalid ANTHROPIC_API_KEY format"
            }
        
        # In a real implementation, you might want to make a test API call
        # For now, we'll just verify the configuration
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "ai_service": {
                "provider": "Anthropic",
                "model": "claude-3-5-haiku-20241022",
                "api_key_configured": True,
                "api_key_format": "Valid"
            }
        }
        
    except Exception as e:
        logger.error("AI service health check failed", e)
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@router.get("/health/performance")
async def performance_health() -> Dict[str, Any]:
    """Performance metrics for monitoring."""
    
    try:
        start_time = time.time()
        
        # Test database query performance
        db_start = time.time()
        products_count = db.fetch_one("SELECT COUNT(*) FROM products")[0]
        db_duration = (time.time() - db_start) * 1000
        
        # Memory usage
        memory = psutil.virtual_memory()
        process = psutil.Process()
        
        # Disk I/O
        disk_io = psutil.disk_io_counters()
        
        check_duration = round((time.time() - start_time) * 1000, 2)
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": check_duration,
            "performance": {
                "database_query_ms": round(db_duration, 2),
                "total_products": products_count,
                "memory": {
                    "process_mb": round(process.memory_info().rss / 1024 / 1024, 2),
                    "system_available_gb": round(memory.available / 1024 / 1024 / 1024, 2),
                    "system_used_percent": memory.percent
                },
                "cpu": {
                    "process_percent": process.cpu_percent(),
                    "system_percent": psutil.cpu_percent(interval=1),
                    "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None
                },
                "disk": {
                    "read_bytes": disk_io.read_bytes if disk_io else 0,
                    "write_bytes": disk_io.write_bytes if disk_io else 0
                }
            }
        }
        
    except Exception as e:
        logger.error("Performance health check failed", e)
        return {
            "status": "degraded",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

@router.get("/health/readiness")
async def readiness_check() -> Dict[str, Any]:
    """Kubernetes-style readiness check."""
    
    try:
        # Check if application is ready to serve requests
        db_check = await HealthChecker.check_database()
        
        if db_check["status"] != "healthy":
            raise HTTPException(
                status_code=503,
                detail={
                    "ready": False,
                    "reason": "Database not available"
                }
            )
        
        return {
            "ready": True,
            "timestamp": datetime.now().isoformat(),
            "checks": {
                "database": "passed"
            }
        }
        
    except Exception as e:
        logger.error("Readiness check failed", e)
        raise HTTPException(
            status_code=503,
            detail={
                "ready": False,
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
        )

@router.get("/health/liveness")
async def liveness_check() -> Dict[str, str]:
    """Kubernetes-style liveness check."""
    
    # Simple check to verify the application is running
    return {
        "alive": True,
        "timestamp": datetime.now().isoformat(),
        "service": "prox-autonomous-discovery"
    }