#!/usr/bin/env python3
"""Performance caching layer for API responses."""

import logging
import json
import hashlib
import time
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from functools import wraps
import redis
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CacheConfig:
    """Cache configuration settings."""
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    default_ttl: int = 300  # 5 minutes
    long_ttl: int = 3600   # 1 hour
    short_ttl: int = 60    # 1 minute
    max_memory_cache_size: int = 1000

class CacheManager:
    """Manages caching with Redis fallback to in-memory."""
    
    def __init__(self, config: CacheConfig = None):
        self.config = config or CacheConfig()
        self.redis_client = None
        self.memory_cache = {}
        self.memory_cache_timestamps = {}
        
        # Try to connect to Redis
        self._init_redis()
        
    def _init_redis(self):
        """Initialize Redis connection with fallback."""
        try:
            import redis
            self.redis_client = redis.Redis(
                host=self.config.redis_host,
                port=self.config.redis_port,
                db=self.config.redis_db,
                decode_responses=True,
                socket_timeout=2
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.warning(f"Redis not available, using memory cache: {e}")
            self.redis_client = None
    
    def _generate_cache_key(self, prefix: str, params: Dict[str, Any]) -> str:
        """Generate consistent cache key from parameters."""
        # Sort params for consistent hashing
        sorted_params = json.dumps(params, sort_keys=True)
        param_hash = hashlib.md5(sorted_params.encode()).hexdigest()[:12]
        return f"{prefix}:{param_hash}"
    
    def _cleanup_memory_cache(self):
        """Remove expired entries from memory cache."""
        if len(self.memory_cache) < self.config.max_memory_cache_size:
            return
            
        current_time = time.time()
        expired_keys = []
        
        for key, timestamp in self.memory_cache_timestamps.items():
            if current_time - timestamp > self.config.default_ttl:
                expired_keys.append(key)
        
        for key in expired_keys:
            self.memory_cache.pop(key, None)
            self.memory_cache_timestamps.pop(key, None)
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            # Try Redis first
            if self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            
            # Fallback to memory cache
            if key in self.memory_cache:
                timestamp = self.memory_cache_timestamps.get(key, 0)
                if time.time() - timestamp < self.config.default_ttl:
                    return self.memory_cache[key]
                else:
                    # Remove expired entry
                    self.memory_cache.pop(key, None)
                    self.memory_cache_timestamps.pop(key, None)
            
            return None
            
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache with TTL."""
        try:
            ttl = ttl or self.config.default_ttl
            json_value = json.dumps(value, default=str)
            
            # Try Redis first
            if self.redis_client:
                self.redis_client.setex(key, ttl, json_value)
                logger.debug(f"Cached to Redis: {key}")
                return True
            
            # Fallback to memory cache
            self._cleanup_memory_cache()
            self.memory_cache[key] = value
            self.memory_cache_timestamps[key] = time.time()
            logger.debug(f"Cached to memory: {key}")
            return True
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        try:
            if self.redis_client:
                self.redis_client.delete(key)
            
            self.memory_cache.pop(key, None)
            self.memory_cache_timestamps.pop(key, None)
            return True
            
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> bool:
        """Clear all keys matching pattern."""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            
            # Clear from memory cache
            memory_keys = [k for k in self.memory_cache.keys() if pattern.replace('*', '') in k]
            for key in memory_keys:
                self.memory_cache.pop(key, None)
                self.memory_cache_timestamps.pop(key, None)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
            return False

# Global cache instance
cache = CacheManager()

def cache_response(prefix: str, ttl: int = None, key_params: List[str] = None):
    """Decorator to cache function responses."""
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from specified parameters
            if key_params:
                cache_params = {k: v for k, v in kwargs.items() if k in key_params}
            else:
                cache_params = kwargs.copy()
                
            cache_key = cache._generate_cache_key(prefix, cache_params)
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {func.__name__}: {cache_key}")
                return cached_result
            
            # Execute function
            logger.debug(f"Cache miss for {func.__name__}: {cache_key}")
            result = func(*args, **kwargs)
            
            # Cache the result
            cache.set(cache_key, result, ttl)
            
            return result
            
        return wrapper
    return decorator

class DatabaseQueryOptimizer:
    """Optimizes common database queries."""
    
    @staticmethod
    def create_performance_indexes():
        """Create indexes for better query performance."""
        
        indexes = [
            # Product search indexes
            "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);",
            "CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);", 
            "CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);",
            "CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating);",
            "CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);",
            "CREATE INDEX IF NOT EXISTS idx_products_trend_score ON products(trend_score);",
            "CREATE INDEX IF NOT EXISTS idx_products_style ON products(style);",
            "CREATE INDEX IF NOT EXISTS idx_products_material ON products(material);",
            "CREATE INDEX IF NOT EXISTS idx_products_room_types ON products USING GIN(room_types);",
            
            # Text search indexes
            "CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING GIN(to_tsvector('english', product_name));",
            "CREATE INDEX IF NOT EXISTS idx_products_desc_search ON products USING GIN(to_tsvector('english', description));",
            
            # Composite indexes for common queries
            "CREATE INDEX IF NOT EXISTS idx_products_cat_price ON products(category, price);",
            "CREATE INDEX IF NOT EXISTS idx_products_rating_trend ON products(rating DESC, trend_score DESC);",
            "CREATE INDEX IF NOT EXISTS idx_products_price_rating ON products(price, rating DESC);",
            
            # Chat and analysis indexes
            "CREATE INDEX IF NOT EXISTS idx_problems_created ON problems(created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_solutions_problem ON solutions(problem_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_id ON user_sessions(session_id);",
            "CREATE INDEX IF NOT EXISTS idx_user_sessions_created ON user_sessions(created_at DESC);",
            
            # Platform posts indexes
            "CREATE INDEX IF NOT EXISTS idx_posts_platform ON platform_posts(platform);",
            "CREATE INDEX IF NOT EXISTS idx_posts_created ON platform_posts(created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_posts_engagement ON platform_posts(engagement_score DESC);"
        ]
        
        try:
            for index_sql in indexes:
                db.execute(index_sql)
                logger.info(f"Created index: {index_sql.split('idx_')[1].split(' ')[0]}")
                
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")
    
    @staticmethod 
    def analyze_table_stats():
        """Analyze table statistics for query optimization."""
        
        try:
            # Update table statistics
            tables = ['products', 'problems', 'solutions', 'platform_posts', 'user_sessions']
            
            for table in tables:
                db.execute(f"ANALYZE {table};")
                
            # Get table sizes and row counts
            stats_query = """
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats 
                WHERE schemaname = 'public' 
                AND tablename IN ('products', 'problems', 'solutions')
                ORDER BY tablename, attname;
            """
            
            stats = db.fetch_all(stats_query)
            
            logger.info("Database table statistics updated")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to analyze table stats: {e}")
            return []

class PerformanceMonitor:
    """Monitors API performance and response times."""
    
    def __init__(self):
        self.request_times = {}
        self.slow_queries = []
    
    def log_request_time(self, endpoint: str, duration: float):
        """Log request duration for monitoring."""
        
        if endpoint not in self.request_times:
            self.request_times[endpoint] = []
            
        self.request_times[endpoint].append({
            'duration': duration,
            'timestamp': datetime.now()
        })
        
        # Keep only last 100 requests per endpoint
        if len(self.request_times[endpoint]) > 100:
            self.request_times[endpoint] = self.request_times[endpoint][-100:]
        
        # Log slow requests
        if duration > 2.0:  # Slower than 2 seconds
            self.slow_queries.append({
                'endpoint': endpoint,
                'duration': duration,
                'timestamp': datetime.now()
            })
            logger.warning(f"Slow request: {endpoint} took {duration:.2f}s")
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics."""
        
        stats = {}
        
        for endpoint, times in self.request_times.items():
            if not times:
                continue
                
            durations = [t['duration'] for t in times]
            stats[endpoint] = {
                'avg_response_time': sum(durations) / len(durations),
                'max_response_time': max(durations),
                'min_response_time': min(durations),
                'request_count': len(durations),
                'slow_requests': len([d for d in durations if d > 1.0])
            }
        
        # Overall stats
        all_durations = []
        for times in self.request_times.values():
            all_durations.extend([t['duration'] for t in times])
        
        if all_durations:
            stats['overall'] = {
                'total_requests': len(all_durations),
                'avg_response_time': sum(all_durations) / len(all_durations),
                'slow_request_percentage': len([d for d in all_durations if d > 1.0]) / len(all_durations) * 100
            }
        
        return stats

# Global performance monitor
performance_monitor = PerformanceMonitor()

def monitor_performance(endpoint_name: str):
    """Decorator to monitor endpoint performance."""
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                performance_monitor.log_request_time(endpoint_name, duration)
                
        return wrapper
    return decorator