"""Database setup and initialization script."""
import os
import sys
import psycopg
from dotenv import load_dotenv

load_dotenv()


def setup_database():
    """Initialize database with schema."""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("✗ DATABASE_URL not found in .env file")
        print("  Please copy .env.example to .env and fill in your database credentials")
        return False
    
    try:
        # Connect to database
        conn = psycopg.connect(database_url)
        cursor = conn.cursor()
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Execute schema
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✓ Database schema created successfully")
        
        # Verify tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"✓ Created {len(tables)} tables:")
        for table in tables:
            print(f"  - {table[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Database setup failed: {e}")
        return False


def test_connection():
    """Test database connection."""
    try:
        from database.connection import db
        result = db.test_connection()
        if result:
            print("✓ Database connection test passed")
        return result
    except Exception as e:
        print(f"✗ Connection test failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("Prox Autonomous Discovery - Database Setup")
    print("=" * 50)
    print()
    
    # Setup database
    if setup_database():
        print()
        # Test connection
        test_connection()
        print()
        print("✓ Setup complete!")
        print()
        print("Next steps:")
        print("1. Test collectors: python collectors/reddit_collector.py")
        print("2. Check database: psql $DATABASE_URL")
    else:
        print()
        print("✗ Setup failed. Please check your configuration.")
        sys.exit(1)
