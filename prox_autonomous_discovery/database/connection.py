"""Database connection handler with connection pooling."""
import os
import psycopg
from psycopg_pool import ConnectionPool
from contextlib import contextmanager
from dotenv import load_dotenv
import logging
import json

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Database:
    """PostgreSQL database connection manager."""
    
    def __init__(self):
        self.connection_pool = None
        self.database_url = os.getenv('DATABASE_URL')
        self._initialize_pool()
    
    def _initialize_pool(self):
        """Initialize connection pool."""
        try:
            self.connection_pool = ConnectionPool(
                self.database_url,
                min_size=1,
                max_size=20
            )
            logger.info("Database connection pool initialized")
        except ImportError:
            # Fallback to simple connection if pool not available
            logger.warning("Connection pool not available, using simple connections")
            self.connection_pool = None
        except Exception as e:
            logger.error(f"Failed to initialize connection pool: {e}")
            self.connection_pool = None
    
    @contextmanager
    def get_connection(self):
        """Get connection from pool with context manager."""
        if self.connection_pool:
            with self.connection_pool.connection() as conn:
                yield conn
        else:
            # Simple connection fallback
            conn = psycopg.connect(self.database_url)
            try:
                yield conn
            finally:
                conn.close()
    
    def execute_query(self, query, params=None, fetch=True):
        """Execute a query and return results."""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    cursor.execute(query, params)
                    conn.commit()
                    
                    if fetch and cursor.description:
                        columns = [desc[0] for desc in cursor.description]
                        results = cursor.fetchall()
                        return [dict(zip(columns, row)) for row in results]
                    return None
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Query execution failed: {e}")
                    raise
    
    def execute_many(self, query, data_list):
        """Execute same query with multiple parameter sets."""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    cursor.executemany(query, data_list)
                    conn.commit()
                    logger.info(f"Batch insert: {len(data_list)} rows")
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Batch execution failed: {e}")
                    raise
    
    def fetch_all(self, query, params=None):
        """Fetch all results from query."""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
    
    def fetch_one(self, query, params=None):
        """Fetch one result from query."""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchone()
    
    def execute(self, query, params=None):
        """Execute query without fetching results."""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                try:
                    cursor.execute(query, params)
                    conn.commit()
                    return cursor.rowcount
                except Exception as e:
                    conn.rollback()
                    logger.error(f"Query execution failed: {e}")
                    raise
    
    def test_connection(self):
        """Test database connection."""
        try:
            result = self.execute_query("SELECT 1 as test")
            logger.info("Database connection successful")
            return True
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return False
    
    def close_all(self):
        """Close all connections in pool."""
        if self.connection_pool:
            self.connection_pool.close()
            logger.info("All database connections closed")


# Global database instance
db = Database()


if __name__ == "__main__":
    # Test connection
    if db.test_connection():
        print("✓ Database connection successful")
    else:
        print("✗ Database connection failed")
