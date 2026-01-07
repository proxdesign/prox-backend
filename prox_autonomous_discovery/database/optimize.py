#!/usr/bin/env python3
"""Database optimization script with indexing and query tuning."""

import logging
import time
from datetime import datetime
from typing import Dict, List, Any
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """Comprehensive database optimization."""
    
    def __init__(self):
        self.optimization_results = {}
    
    def create_essential_indexes(self) -> Dict[str, Any]:
        """Create essential indexes for performance."""
        
        logger.info("Creating essential database indexes...")
        
        indexes = {
            # Product search optimization - using standard CREATE INDEX
            'products_price': "CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);",
            'products_rating': "CREATE INDEX IF NOT EXISTS idx_products_rating ON products(rating DESC);",
            'products_brand': "CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);",
            'products_trend_score': "CREATE INDEX IF NOT EXISTS idx_products_trend_score ON products(trend_score DESC);",
            
            # Full-text search indexes
            'products_name_fts': "CREATE INDEX IF NOT EXISTS idx_products_name_fts ON products USING GIN(to_tsvector('english', product_name));",
            'products_desc_fts': "CREATE INDEX IF NOT EXISTS idx_products_desc_fts ON products USING GIN(to_tsvector('english', description));",
            
            # Composite indexes for complex queries
            'products_rating_trend': "CREATE INDEX IF NOT EXISTS idx_products_rating_trend ON products(rating DESC, trend_score DESC);",
            'products_price_rating': "CREATE INDEX IF NOT EXISTS idx_products_price_rating ON products(price, rating DESC);",
            
            # AI and analysis tables
            'problems_created': "CREATE INDEX IF NOT EXISTS idx_problems_created ON problems(created_at DESC);",
            'solutions_problem': "CREATE INDEX IF NOT EXISTS idx_solutions_problem ON solutions(problem_id);", 
            'user_sessions_id': "CREATE INDEX IF NOT EXISTS idx_user_sessions_id ON user_sessions(session_id);",
            'user_sessions_created': "CREATE INDEX IF NOT EXISTS idx_user_sessions_created ON user_sessions(created_at DESC);",
            
            # Social media data
            'posts_platform': "CREATE INDEX IF NOT EXISTS idx_posts_platform ON platform_posts(platform);",
            'posts_created': "CREATE INDEX IF NOT EXISTS idx_posts_created ON platform_posts(created_at DESC);",
            'posts_engagement': "CREATE INDEX IF NOT EXISTS idx_posts_engagement ON platform_posts(engagement_score DESC);"
        }
        
        results = {}
        created_count = 0
        
        for index_name, sql in indexes.items():
            try:
                start_time = time.time()
                
                # Check if index exists first
                check_query = """
                    SELECT indexname FROM pg_indexes 
                    WHERE indexname = %s AND tablename IN 
                    (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
                """
                existing = db.fetch_one(check_query, [f"idx_{index_name}"])
                
                if existing:
                    results[index_name] = {'status': 'exists', 'time': 0}
                    continue
                
                # Create index
                db.execute(sql)
                duration = time.time() - start_time
                
                results[index_name] = {'status': 'created', 'time': duration}
                created_count += 1
                
                logger.info(f"Created index {index_name} in {duration:.2f}s")
                
            except Exception as e:
                results[index_name] = {'status': 'failed', 'error': str(e)}
                logger.error(f"Failed to create index {index_name}: {e}")
        
        logger.info(f"Index creation complete: {created_count} new indexes created")
        return results
    
    def optimize_table_statistics(self) -> Dict[str, Any]:
        """Update table statistics for query planning."""
        
        logger.info("Updating table statistics...")
        
        tables = [
            'products', 'problems', 'solutions', 'platform_posts', 
            'user_sessions', 'saved_searches', 'content_snippets'
        ]
        
        results = {}
        
        for table in tables:
            try:
                start_time = time.time()
                
                # Update table statistics
                db.execute(f"ANALYZE {table};")
                
                # Get table info
                info_query = f"""
                    SELECT 
                        schemaname, relname, 
                        n_tup_ins, n_tup_upd, n_tup_del,
                        n_live_tup, n_dead_tup
                    FROM pg_stat_user_tables 
                    WHERE relname = %s
                """
                
                table_info = db.fetch_one(info_query, [table])
                duration = time.time() - start_time
                
                if table_info:
                    results[table] = {
                        'status': 'analyzed',
                        'time': duration,
                        'live_tuples': table_info[3],
                        'dead_tuples': table_info[4],
                        'inserts': table_info[2],
                        'updates': table_info[3],
                        'deletes': table_info[4]
                    }
                else:
                    results[table] = {'status': 'not_found', 'time': duration}
                
                logger.info(f"Analyzed table {table} in {duration:.2f}s")
                
            except Exception as e:
                results[table] = {'status': 'failed', 'error': str(e)}
                logger.error(f"Failed to analyze table {table}: {e}")
        
        return results
    
    def check_query_performance(self) -> Dict[str, Any]:
        """Check performance of common queries."""
        
        logger.info("Testing query performance...")
        
        test_queries = {
            'product_search_basic': """
                SELECT product_name, price, rating 
                FROM products 
                WHERE price < 200 
                ORDER BY rating DESC 
                LIMIT 10
            """,
            
            'product_search_filtered': """
                SELECT product_name, price, rating, brand 
                FROM products 
                WHERE price BETWEEN 50 AND 200 
                AND rating >= 4.0 
                ORDER BY trend_score DESC 
                LIMIT 20
            """,
            
            'product_search_text': """
                SELECT product_name, price 
                FROM products 
                WHERE to_tsvector('english', product_name) @@ to_tsquery('english', 'chair')
                ORDER BY rating DESC 
                LIMIT 15
            """,
            
            'trending_products': """
                SELECT product_name, trend_score, rating, price
                FROM products
                ORDER BY trend_score DESC, rating DESC
                LIMIT 10
            """,
            
            'recent_sessions': """
                SELECT session_id, conversation_data
                FROM user_sessions
                ORDER BY id DESC
                LIMIT 20
            """
        }
        
        results = {}
        
        for query_name, sql in test_queries.items():
            try:
                # Test query performance
                start_time = time.time()
                
                # Use EXPLAIN ANALYZE to get detailed performance info
                explain_query = f"EXPLAIN (ANALYZE, BUFFERS) {sql}"
                plan = db.fetch_all(explain_query)
                
                duration = time.time() - start_time
                
                # Extract execution time from explain output
                execution_time = None
                for row in plan:
                    if 'Execution Time:' in row[0]:
                        execution_time = float(row[0].split('Execution Time:')[1].split('ms')[0].strip())
                        break
                
                results[query_name] = {
                    'status': 'success',
                    'total_time': duration,
                    'execution_time_ms': execution_time,
                    'plan_lines': len(plan)
                }
                
                logger.info(f"Query {query_name}: {execution_time}ms execution time")
                
            except Exception as e:
                results[query_name] = {'status': 'failed', 'error': str(e)}
                logger.error(f"Query performance test failed for {query_name}: {e}")
        
        return results
    
    def vacuum_and_reindex(self) -> Dict[str, Any]:
        """Perform vacuum and reindex operations."""
        
        logger.info("Performing database maintenance...")
        
        tables = ['products', 'problems', 'solutions', 'platform_posts', 'user_sessions']
        results = {}
        
        for table in tables:
            try:
                start_time = time.time()
                
                # Just analyze for now (vacuum requires special handling)
                db.execute(f"ANALYZE {table};")
                
                duration = time.time() - start_time
                results[table] = {'status': 'vacuumed', 'time': duration}
                
                logger.info(f"Vacuumed table {table} in {duration:.2f}s")
                
            except Exception as e:
                results[table] = {'status': 'failed', 'error': str(e)}
                logger.error(f"Failed to vacuum table {table}: {e}")
        
        return results
    
    def get_database_size_info(self) -> Dict[str, Any]:
        """Get database size and usage information."""
        
        try:
            # Database size
            db_size_query = """
                SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
            """
            db_size = db.fetch_one(db_size_query)[0]
            
            # Table sizes
            table_sizes_query = """
                SELECT 
                    relname as tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size,
                    pg_total_relation_size(schemaname||'.'||relname) as bytes
                FROM pg_stat_user_tables 
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
            """
            table_sizes = db.fetch_all(table_sizes_query)
            
            # Index usage
            index_usage_query = """
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes
                ORDER BY idx_scan DESC
            """
            index_usage = db.fetch_all(index_usage_query)
            
            return {
                'database_size': db_size,
                'table_sizes': [
                    {'table': row[0], 'size': row[1], 'bytes': row[2]} 
                    for row in table_sizes
                ],
                'index_usage': [
                    {
                        'schema': row[0], 'table': row[1], 'index': row[2],
                        'scans': row[3], 'tuples_read': row[4], 'tuples_fetched': row[5]
                    }
                    for row in index_usage
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get database size info: {e}")
            return {'error': str(e)}
    
    def run_full_optimization(self) -> Dict[str, Any]:
        """Run complete database optimization."""
        
        logger.info("🚀 Starting comprehensive database optimization...")
        start_time = time.time()
        
        results = {
            'started_at': datetime.now().isoformat(),
            'optimization_steps': {}
        }
        
        # Step 1: Create indexes
        logger.info("Step 1: Creating essential indexes...")
        results['optimization_steps']['indexes'] = self.create_essential_indexes()
        
        # Step 2: Update statistics
        logger.info("Step 2: Updating table statistics...")
        results['optimization_steps']['statistics'] = self.optimize_table_statistics()
        
        # Step 3: Test query performance
        logger.info("Step 3: Testing query performance...")
        results['optimization_steps']['query_performance'] = self.check_query_performance()
        
        # Step 4: Vacuum and maintenance
        logger.info("Step 4: Database maintenance...")
        results['optimization_steps']['maintenance'] = self.vacuum_and_reindex()
        
        # Step 5: Get size information
        logger.info("Step 5: Gathering database size info...")
        results['optimization_steps']['database_info'] = self.get_database_size_info()
        
        total_time = time.time() - start_time
        results['completed_at'] = datetime.now().isoformat()
        results['total_optimization_time'] = total_time
        
        logger.info(f"✅ Database optimization completed in {total_time:.2f} seconds")
        
        return results

def main():
    """Run database optimization."""
    optimizer = DatabaseOptimizer()
    results = optimizer.run_full_optimization()
    
    # Print summary
    print("\n" + "="*60)
    print("DATABASE OPTIMIZATION SUMMARY")
    print("="*60)
    
    # Index summary
    indexes = results['optimization_steps'].get('indexes', {})
    created = len([r for r in indexes.values() if r.get('status') == 'created'])
    existing = len([r for r in indexes.values() if r.get('status') == 'exists'])
    failed = len([r for r in indexes.values() if r.get('status') == 'failed'])
    
    print(f"\n📊 INDEXES:")
    print(f"  Created: {created}")
    print(f"  Already existed: {existing}")
    print(f"  Failed: {failed}")
    
    # Query performance summary
    queries = results['optimization_steps'].get('query_performance', {})
    successful_queries = [q for q in queries.values() if q.get('status') == 'success']
    
    if successful_queries:
        avg_time = sum(q.get('execution_time_ms', 0) for q in successful_queries) / len(successful_queries)
        print(f"\n⚡ QUERY PERFORMANCE:")
        print(f"  Average execution time: {avg_time:.1f}ms")
        print(f"  Queries tested: {len(queries)}")
    
    # Database size
    db_info = results['optimization_steps'].get('database_info', {})
    if 'database_size' in db_info:
        print(f"\n💾 DATABASE SIZE: {db_info['database_size']}")
    
    print(f"\n⏱️  Total optimization time: {results['total_optimization_time']:.1f} seconds")
    print("="*60)

if __name__ == "__main__":
    main()