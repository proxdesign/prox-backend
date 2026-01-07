#!/usr/bin/env python3
"""Comprehensive error handling and logging system."""

import logging
import traceback
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from functools import wraps
import json
from fastapi import HTTPException, Request, Response
from fastapi.responses import JSONResponse
import time

# Configure comprehensive logging
class ProxLogger:
    """Enhanced logging system for Prox."""
    
    def __init__(self, name: str = "prox_api"):
        self.name = name
        self.logger = logging.getLogger(name)
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup comprehensive logging configuration."""
        
        # Set base level
        self.logger.setLevel(logging.INFO)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s | %(name)s | %(levelname)s | %(module)s:%(lineno)d | %(funcName)s() | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        simple_formatter = logging.Formatter(
            '%(asctime)s | %(levelname)s | %(message)s',
            datefmt='%H:%M:%S'
        )
        
        # Console handler
        if not self.logger.handlers:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.INFO)
            console_handler.setFormatter(simple_formatter)
            self.logger.addHandler(console_handler)
            
            # File handler for detailed logs
            try:
                file_handler = logging.FileHandler('logs/prox_api.log')
                file_handler.setLevel(logging.DEBUG)
                file_handler.setFormatter(detailed_formatter)
                self.logger.addHandler(file_handler)
            except:
                pass  # File logging optional
        
        self.logger.propagate = False
    
    def info(self, message: str, extra: Dict = None):
        """Log info message with optional extra data."""
        if extra:
            message = f"{message} | Extra: {json.dumps(extra, default=str)}"
        self.logger.info(message)
    
    def warning(self, message: str, extra: Dict = None):
        """Log warning message."""
        if extra:
            message = f"{message} | Extra: {json.dumps(extra, default=str)}"
        self.logger.warning(message)
    
    def error(self, message: str, error: Exception = None, extra: Dict = None):
        """Log error message with full context."""
        if error:
            message = f"{message} | Error: {str(error)} | Type: {type(error).__name__}"
        if extra:
            message = f"{message} | Extra: {json.dumps(extra, default=str)}"
        self.logger.error(message)
        if error:
            self.logger.debug(traceback.format_exc())
    
    def debug(self, message: str, extra: Dict = None):
        """Log debug message."""
        if extra:
            message = f"{message} | Extra: {json.dumps(extra, default=str)}"
        self.logger.debug(message)

# Global logger instance
logger = ProxLogger()

class ErrorCategories:
    """Error category definitions."""
    DATABASE = "database"
    API = "api"
    AI = "ai_service"
    VALIDATION = "validation"
    EXTERNAL = "external_service"
    AUTHENTICATION = "authentication"
    RATE_LIMIT = "rate_limit"
    INTERNAL = "internal"

class ProxError(Exception):
    """Base exception class for Prox errors."""
    
    def __init__(
        self, 
        message: str, 
        category: str = ErrorCategories.INTERNAL,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Dict[str, Any] = None
    ):
        self.message = message
        self.category = category
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        self.timestamp = datetime.now().isoformat()
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for API response."""
        return {
            "error": {
                "message": self.message,
                "code": self.error_code,
                "category": self.category,
                "timestamp": self.timestamp,
                "details": self.details
            }
        }

class DatabaseError(ProxError):
    """Database-related errors."""
    def __init__(self, message: str, details: Dict = None):
        super().__init__(
            message=message,
            category=ErrorCategories.DATABASE,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details
        )

class AIServiceError(ProxError):
    """AI service-related errors."""
    def __init__(self, message: str, details: Dict = None):
        super().__init__(
            message=message,
            category=ErrorCategories.AI,
            status_code=503,
            error_code="AI_SERVICE_ERROR",
            details=details
        )

class ValidationError(ProxError):
    """Input validation errors."""
    def __init__(self, message: str, details: Dict = None):
        super().__init__(
            message=message,
            category=ErrorCategories.VALIDATION,
            status_code=400,
            error_code="VALIDATION_ERROR",
            details=details
        )

class RateLimitError(ProxError):
    """Rate limiting errors."""
    def __init__(self, message: str = "Rate limit exceeded", details: Dict = None):
        super().__init__(
            message=message,
            category=ErrorCategories.RATE_LIMIT,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details
        )

def handle_errors(category: str = ErrorCategories.INTERNAL):
    """Decorator for comprehensive error handling."""
    
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                logger.debug(f"Starting {func.__name__}", {
                    "function": func.__name__,
                    "args_count": len(args),
                    "kwargs_keys": list(kwargs.keys())
                })
                
                result = await func(*args, **kwargs)
                
                duration = time.time() - start_time
                logger.info(f"Completed {func.__name__} in {duration:.2f}s")
                
                return result
                
            except ProxError as e:
                duration = time.time() - start_time
                logger.error(f"ProxError in {func.__name__} after {duration:.2f}s", e, {
                    "function": func.__name__,
                    "error_category": e.category,
                    "error_code": e.error_code
                })
                raise e
                
            except HTTPException as e:
                duration = time.time() - start_time
                logger.error(f"HTTPException in {func.__name__} after {duration:.2f}s", e, {
                    "function": func.__name__,
                    "status_code": e.status_code
                })
                raise e
                
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"Unexpected error in {func.__name__} after {duration:.2f}s", e, {
                    "function": func.__name__,
                    "error_type": type(e).__name__
                })
                
                # Convert to ProxError
                prox_error = ProxError(
                    message=f"Internal error in {func.__name__}: {str(e)}",
                    category=category,
                    details={
                        "function": func.__name__,
                        "original_error": str(e),
                        "error_type": type(e).__name__
                    }
                )
                raise prox_error
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                logger.debug(f"Starting {func.__name__}", {
                    "function": func.__name__,
                    "args_count": len(args),
                    "kwargs_keys": list(kwargs.keys())
                })
                
                result = func(*args, **kwargs)
                
                duration = time.time() - start_time
                logger.info(f"Completed {func.__name__} in {duration:.2f}s")
                
                return result
                
            except ProxError as e:
                duration = time.time() - start_time
                logger.error(f"ProxError in {func.__name__} after {duration:.2f}s", e, {
                    "function": func.__name__,
                    "error_category": e.category,
                    "error_code": e.error_code
                })
                raise e
                
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"Unexpected error in {func.__name__} after {duration:.2f}s", e, {
                    "function": func.__name__,
                    "error_type": type(e).__name__
                })
                
                # Convert to ProxError
                prox_error = ProxError(
                    message=f"Internal error in {func.__name__}: {str(e)}",
                    category=category,
                    details={
                        "function": func.__name__,
                        "original_error": str(e),
                        "error_type": type(e).__name__
                    }
                )
                raise prox_error
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for FastAPI."""
    
    # Handle ProxError specifically
    if isinstance(exc, ProxError):
        logger.error(f"ProxError on {request.url.path}", exc, {
            "method": request.method,
            "url": str(request.url),
            "client": getattr(request.client, 'host', 'unknown') if request.client else 'unknown'
        })
        
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict()
        )
    
    # Handle HTTPException
    if isinstance(exc, HTTPException):
        logger.error(f"HTTPException on {request.url.path}", exc, {
            "method": request.method,
            "url": str(request.url),
            "status_code": exc.status_code
        })
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "message": exc.detail,
                    "code": "HTTP_ERROR",
                    "category": ErrorCategories.API,
                    "timestamp": datetime.now().isoformat()
                }
            }
        )
    
    # Handle unexpected exceptions
    logger.error(f"Unhandled exception on {request.url.path}", exc, {
        "method": request.method,
        "url": str(request.url),
        "client": getattr(request.client, 'host', 'unknown') if request.client else 'unknown',
        "error_type": type(exc).__name__
    })
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "An unexpected error occurred",
                "code": "INTERNAL_SERVER_ERROR",
                "category": ErrorCategories.INTERNAL,
                "timestamp": datetime.now().isoformat(),
                "details": {
                    "error_type": type(exc).__name__
                }
            }
        }
    )

def validate_required_fields(data: Dict, required_fields: list, field_name: str = "request"):
    """Validate that required fields are present."""
    missing_fields = []
    
    for field in required_fields:
        if field not in data or data[field] is None:
            missing_fields.append(field)
    
    if missing_fields:
        raise ValidationError(
            message=f"Missing required fields in {field_name}",
            details={
                "missing_fields": missing_fields,
                "required_fields": required_fields,
                "provided_fields": list(data.keys())
            }
        )

def validate_data_types(data: Dict, type_specs: Dict[str, type]):
    """Validate data types of fields."""
    type_errors = []
    
    for field, expected_type in type_specs.items():
        if field in data and data[field] is not None:
            if not isinstance(data[field], expected_type):
                type_errors.append({
                    "field": field,
                    "expected_type": expected_type.__name__,
                    "actual_type": type(data[field]).__name__,
                    "value": str(data[field])[:100]  # Truncate long values
                })
    
    if type_errors:
        raise ValidationError(
            message="Invalid data types provided",
            details={"type_errors": type_errors}
        )

class HealthChecker:
    """System health monitoring."""
    
    @staticmethod
    async def check_database() -> Dict[str, Any]:
        """Check database connectivity."""
        try:
            from database.connection import db
            
            # Simple connectivity test
            result = db.fetch_one("SELECT 1 as test")
            if result and result[0] == 1:
                return {"status": "healthy", "details": "Database connection successful"}
            else:
                return {"status": "unhealthy", "details": "Database query failed"}
                
        except Exception as e:
            return {
                "status": "unhealthy", 
                "details": f"Database connection failed: {str(e)}"
            }
    
    @staticmethod
    async def check_ai_service() -> Dict[str, Any]:
        """Check AI service availability."""
        try:
            # Test Claude API availability
            import anthropic
            import os
            
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                return {"status": "unhealthy", "details": "ANTHROPIC_API_KEY not configured"}
            
            # Simple test (this would cost a small amount)
            # In production, might want to use a different health check
            return {"status": "healthy", "details": "AI service configured"}
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "details": f"AI service check failed: {str(e)}"
            }
    
    @staticmethod
    async def check_overall_health() -> Dict[str, Any]:
        """Check overall system health."""
        health_checks = {
            "database": await HealthChecker.check_database(),
            "ai_service": await HealthChecker.check_ai_service(),
            "timestamp": datetime.now().isoformat()
        }
        
        # Determine overall status
        all_healthy = all(
            check["status"] == "healthy" 
            for check in health_checks.values() 
            if isinstance(check, dict) and "status" in check
        )
        
        health_checks["overall_status"] = "healthy" if all_healthy else "degraded"
        
        return health_checks

# Request/Response logging middleware
async def log_requests(request: Request, call_next):
    """Log all requests and responses."""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request started: {request.method} {request.url.path}", {
        "method": request.method,
        "url": str(request.url),
        "client": getattr(request.client, 'host', 'unknown') if request.client else 'unknown',
        "user_agent": request.headers.get('user-agent', 'unknown')
    })
    
    # Process request
    response = await call_next(request)
    
    # Log response
    duration = time.time() - start_time
    logger.info(f"Request completed: {request.method} {request.url.path} - {response.status_code} in {duration:.2f}s", {
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "duration": duration
    })
    
    return response