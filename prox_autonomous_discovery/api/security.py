#!/usr/bin/env python3
"""API security, rate limiting, and protection middleware."""

import time
import logging
from typing import Dict, Any, Optional, Callable
from functools import wraps
from collections import defaultdict, deque
from datetime import datetime, timedelta
import hashlib
import json
import redis
from fastapi import Request, Response, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RateLimiter:
    """Rate limiting implementation with sliding window."""
    
    def __init__(self, redis_url: str = None):
        self.redis_client = None
        self.memory_store = defaultdict(deque)
        
        # Try to initialize Redis
        if redis_url:
            try:
                import redis
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                self.redis_client.ping()
                logger.info("Rate limiter using Redis backend")
            except Exception as e:
                logger.warning(f"Redis not available for rate limiting, using memory: {e}")
    
    def _get_client_key(self, request: Request) -> str:
        """Generate unique key for client identification."""
        
        # Try to identify client by various methods
        client_ip = "unknown"
        
        # Check for forwarded headers (proxy/load balancer)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        elif request.client:
            client_ip = request.client.host
        
        # Include User-Agent for additional differentiation
        user_agent = request.headers.get("user-agent", "unknown")
        user_agent_hash = hashlib.md5(user_agent.encode()).hexdigest()[:8]
        
        return f"rate_limit:{client_ip}:{user_agent_hash}"
    
    def _cleanup_memory_store(self, key: str, window_seconds: int):
        """Clean old entries from memory store."""
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        
        while self.memory_store[key] and self.memory_store[key][0] < cutoff_time:
            self.memory_store[key].popleft()
    
    def is_allowed(self, request: Request, limit: int, window_seconds: int) -> Dict[str, Any]:
        """Check if request is within rate limit."""
        
        client_key = self._get_client_key(request)
        current_time = time.time()
        
        try:
            if self.redis_client:
                return self._redis_rate_limit(client_key, limit, window_seconds, current_time)
            else:
                return self._memory_rate_limit(client_key, limit, window_seconds, current_time)
                
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Fail open - allow request if rate limiter fails
            return {
                "allowed": True,
                "requests_made": 0,
                "requests_remaining": limit,
                "reset_time": current_time + window_seconds
            }
    
    def _redis_rate_limit(self, key: str, limit: int, window_seconds: int, current_time: float) -> Dict[str, Any]:
        """Redis-based rate limiting with sliding window."""
        
        # Remove expired entries
        cutoff_time = current_time - window_seconds
        self.redis_client.zremrangebyscore(key, 0, cutoff_time)
        
        # Count current requests
        current_requests = self.redis_client.zcard(key)
        
        # Check if limit exceeded
        if current_requests >= limit:
            # Get oldest request time for reset calculation
            oldest_request = self.redis_client.zrange(key, 0, 0, withscores=True)
            reset_time = oldest_request[0][1] + window_seconds if oldest_request else current_time + window_seconds
            
            return {
                "allowed": False,
                "requests_made": current_requests,
                "requests_remaining": 0,
                "reset_time": reset_time
            }
        
        # Add current request
        self.redis_client.zadd(key, {str(current_time): current_time})
        self.redis_client.expire(key, window_seconds + 1)  # Cleanup old keys
        
        return {
            "allowed": True,
            "requests_made": current_requests + 1,
            "requests_remaining": limit - current_requests - 1,
            "reset_time": current_time + window_seconds
        }
    
    def _memory_rate_limit(self, key: str, limit: int, window_seconds: int, current_time: float) -> Dict[str, Any]:
        """Memory-based rate limiting with sliding window."""
        
        # Clean old entries
        self._cleanup_memory_store(key, window_seconds)
        
        # Check current requests
        current_requests = len(self.memory_store[key])
        
        if current_requests >= limit:
            # Calculate reset time based on oldest request
            reset_time = self.memory_store[key][0] + window_seconds if self.memory_store[key] else current_time + window_seconds
            
            return {
                "allowed": False,
                "requests_made": current_requests,
                "requests_remaining": 0,
                "reset_time": reset_time
            }
        
        # Add current request
        self.memory_store[key].append(current_time)
        
        return {
            "allowed": True,
            "requests_made": current_requests + 1,
            "requests_remaining": limit - current_requests - 1,
            "reset_time": current_time + window_seconds
        }

class SecurityHeaders:
    """Security headers for API responses."""
    
    @staticmethod
    def get_security_headers() -> Dict[str, str]:
        """Get standard security headers."""
        return {
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            
            # XSS protection
            "X-XSS-Protection": "1; mode=block",
            
            # Content type sniffing protection
            "X-Content-Type-Options": "nosniff",
            
            # Force HTTPS in production
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Content Security Policy
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:",
            
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Permissions policy
            "Permissions-Policy": "camera=(), microphone=(), location=()",
            
            # Custom API headers
            "X-API-Version": "1.0",
            "X-Powered-By": "Prox-Autonomous-Discovery"
        }

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for FastAPI."""
    
    def __init__(self, app, rate_limiter: RateLimiter, requests_per_minute: int = 100):
        super().__init__(app)
        self.rate_limiter = rate_limiter
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Apply rate limiting to requests."""
        
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/health/", "/api/health"]:
            return await call_next(request)
        
        # Check rate limit
        rate_limit_result = self.rate_limiter.is_allowed(
            request, 
            self.requests_per_minute, 
            self.window_seconds
        )
        
        if not rate_limit_result["allowed"]:
            # Rate limit exceeded
            logger.warning(f"Rate limit exceeded for {request.client.host if request.client else 'unknown'}")
            
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "message": "Rate limit exceeded",
                        "code": "RATE_LIMIT_EXCEEDED",
                        "details": {
                            "requests_made": rate_limit_result["requests_made"],
                            "requests_remaining": rate_limit_result["requests_remaining"],
                            "reset_time": rate_limit_result["reset_time"],
                            "window_seconds": self.window_seconds
                        }
                    }
                },
                headers={
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": str(rate_limit_result["requests_remaining"]),
                    "X-RateLimit-Reset": str(int(rate_limit_result["reset_time"])),
                    "Retry-After": str(self.window_seconds)
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(rate_limit_result["requests_remaining"])
        response.headers["X-RateLimit-Reset"] = str(int(rate_limit_result["reset_time"]))
        
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Security headers middleware."""
    
    def __init__(self, app, environment: str = "production"):
        super().__init__(app)
        self.environment = environment
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add security headers to responses."""
        
        response = await call_next(request)
        
        # Get security headers
        headers = SecurityHeaders.get_security_headers()
        
        # Modify headers based on environment
        if self.environment == "development":
            # Relax some security headers for development
            headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https: http:; connect-src 'self' https: http: ws: wss:"
            del headers["Strict-Transport-Security"]  # Remove HTTPS requirement for dev
        
        # Add headers to response
        for header, value in headers.items():
            response.headers[header] = value
        
        return response

class APIKeyAuth:
    """API Key authentication."""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.security = HTTPBearer(auto_error=False) if api_key else None
    
    async def __call__(self, request: Request) -> Optional[str]:
        """Authenticate request using API key."""
        
        if not self.api_key:
            return None  # No authentication required
        
        # Check for API key in header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            provided_key = auth_header[7:]  # Remove "Bearer " prefix
            
            if provided_key == self.api_key:
                return provided_key
        
        # Check for API key in query parameter (less secure, but convenient)
        api_key_param = request.query_params.get("api_key")
        if api_key_param == self.api_key:
            return api_key_param
        
        # Authentication failed
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "message": "Invalid or missing API key",
                    "code": "INVALID_API_KEY"
                }
            }
        )

def require_api_key(api_key_auth: APIKeyAuth):
    """Decorator to require API key authentication."""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                raise HTTPException(status_code=500, detail="Request object not found")
            
            # Authenticate
            await api_key_auth(request)
            
            # Call original function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

class SecurityConfig:
    """Security configuration and utilities."""
    
    @staticmethod
    def validate_input_length(value: str, max_length: int = 1000, field_name: str = "input") -> str:
        """Validate input length to prevent DoS attacks."""
        if len(value) > max_length:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "message": f"{field_name} exceeds maximum length of {max_length} characters",
                        "code": "INPUT_TOO_LONG"
                    }
                }
            )
        return value
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal."""
        import os
        
        # Remove path components
        filename = os.path.basename(filename)
        
        # Remove dangerous characters
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')
        
        return filename[:255]  # Limit length
    
    @staticmethod
    def validate_json_size(json_data: str, max_size_mb: int = 1) -> Dict[str, Any]:
        """Validate JSON size to prevent DoS attacks."""
        max_size_bytes = max_size_mb * 1024 * 1024
        
        if len(json_data.encode('utf-8')) > max_size_bytes:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "message": f"JSON payload exceeds maximum size of {max_size_mb}MB",
                        "code": "PAYLOAD_TOO_LARGE"
                    }
                }
            )
        
        try:
            return json.loads(json_data)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "message": f"Invalid JSON: {str(e)}",
                        "code": "INVALID_JSON"
                    }
                }
            )

# Initialize global instances
rate_limiter = RateLimiter()

def create_security_middleware(config):
    """Create security middleware with configuration."""
    
    middlewares = []
    
    # Rate limiting
    if hasattr(config, 'security') and config.security.rate_limit_requests > 0:
        rate_limit_middleware = RateLimitMiddleware(
            app=None,  # Will be set by FastAPI
            rate_limiter=rate_limiter,
            requests_per_minute=config.security.rate_limit_requests
        )
        middlewares.append(rate_limit_middleware)
    
    # Security headers
    security_headers_middleware = SecurityHeadersMiddleware(
        app=None,  # Will be set by FastAPI
        environment=getattr(config, 'environment', 'production')
    )
    middlewares.append(security_headers_middleware)
    
    return middlewares

def get_api_key_auth(config) -> Optional[APIKeyAuth]:
    """Get API key authentication based on configuration."""
    
    if hasattr(config, 'security') and config.security.api_key:
        return APIKeyAuth(config.security.api_key)
    
    return APIKeyAuth()  # No authentication