#!/usr/bin/env python3
"""
Migration script to create magic_links table in Railway PostgreSQL database.
Run this script to add magic link authentication support.
"""

import os
import sys
import psycopg
from psycopg.rows import dict_row

def get_database_url():
    """Get database URL from environment or Railway settings."""
    # Try Railway environment variable first
    db_url = os.getenv('DATABASE_URL')
    
    if not db_url:
        print("❌ DATABASE_URL not found in environment variables")
        print("Please set DATABASE_URL or run this script with Railway environment")
        print("You can find the DATABASE_URL in Railway dashboard → PostgreSQL service → Variables")
        sys.exit(1)
    
    return db_url

def create_magic_links_table():
    """Create magic_links table and indexes."""
    
    # SQL migration script
    migration_sql = """
    -- Create magic_links table for passwordless authentication
    CREATE TABLE IF NOT EXISTS magic_links (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
    CREATE INDEX IF NOT EXISTS idx_magic_links_email ON magic_links(email);
    CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON magic_links(expires_at);
    """
    
    # Verification query
    verify_sql = """
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'magic_links' 
    ORDER BY ordinal_position;
    """
    
    db_url = get_database_url()
    
    try:
        print("🔗 Connecting to Railway PostgreSQL database...")
        print(f"🔗 Database URL: {db_url[:30]}...")
        
        with psycopg.connect(db_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                print("✅ Connected successfully!")
                print()
                
                print("🔧 Creating magic_links table and indexes...")
                cur.execute(migration_sql)
                conn.commit()
                print("✅ Migration executed successfully!")
                print()
                
                print("🔍 Verifying table structure...")
                cur.execute(verify_sql)
                columns = cur.fetchall()
                
                if columns:
                    print("✅ magic_links table created successfully!")
                    print()
                    print("📋 Table structure:")
                    print("=" * 50)
                    for col in columns:
                        print(f"  {col['column_name']:12} | {col['data_type']}")
                    print("=" * 50)
                    print()
                    print("🎉 Magic link authentication is ready!")
                    print("   You can now deploy your backend with magic link support.")
                else:
                    print("❌ Table verification failed - no columns found")
                    sys.exit(1)
                
    except psycopg.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚂 Railway Magic Links Migration")
    print("=" * 40)
    print()
    
    create_magic_links_table()
    
    print()
    print("🚀 Next steps:")
    print("1. Deploy your updated backend code to Railway")
    print("2. Test magic link authentication at https://proxdesign.co")
    print("3. Verify email delivery and user authentication flow")