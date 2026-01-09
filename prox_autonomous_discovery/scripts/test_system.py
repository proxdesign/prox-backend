"""Test script to verify Prox Autonomous Discovery setup."""
import sys
import os


def test_imports():
    """Test that all required packages are installed."""
    print("Testing package imports...")
    required_packages = [
        ('praw', 'Reddit API client'),
        ('psycopg2', 'PostgreSQL driver'),
        ('anthropic', 'Claude API client'),
        ('fastapi', 'Web framework'),
        ('dotenv', 'Environment variables'),
    ]
    
    failed = []
    for package, description in required_packages:
        try:
            __import__(package)
            print(f"  ✓ {package} ({description})")
        except ImportError:
            print(f"  ✗ {package} - NOT INSTALLED")
            failed.append(package)
    
    if failed:
        print(f"\n✗ Missing packages: {', '.join(failed)}")
        print("  Run: pip install -r requirements.txt")
        return False
    
    print("✓ All required packages installed\n")
    return True


def test_env_file():
    """Test that .env file exists and has required keys."""
    print("Testing environment configuration...")
    
    if not os.path.exists('.env'):
        print("  ✗ .env file not found")
        print("    Run: cp .env.example .env")
        print("    Then edit .env with your API keys")
        return False
    
    print("  ✓ .env file exists")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    required_keys = [
        'DATABASE_URL',
        'REDDIT_CLIENT_ID',
        'ANTHROPIC_API_KEY'
    ]
    
    missing = []
    for key in required_keys:
        value = os.getenv(key)
        if not value or value.startswith('your_'):
            missing.append(key)
            print(f"  ✗ {key} - NOT SET")
        else:
            print(f"  ✓ {key}")
    
    if missing:
        print(f"\n✗ Missing required keys: {', '.join(missing)}")
        print("  Edit .env and add your API keys")
        return False
    
    print("✓ Environment configured\n")
    return True


def test_database():
    """Test database connection."""
    print("Testing database connection...")
    
    try:
        from database.connection import db
        if db.test_connection():
            print("  ✓ Database connection successful")
            
            # Check if tables exist
            result = db.execute_query("""
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            
            table_count = result[0]['count'] if result else 0
            
            if table_count > 0:
                print(f"  ✓ Found {table_count} tables")
                print("✓ Database ready\n")
                return True
            else:
                print("  ✗ No tables found")
                print("    Run: python scripts/setup_database.py")
                return False
        else:
            print("  ✗ Connection failed")
            print("    Check DATABASE_URL in .env")
            return False
            
    except Exception as e:
        print(f"  ✗ Database test failed: {e}")
        print("    Make sure PostgreSQL is running")
        print("    Run: python scripts/setup_database.py")
        return False


def test_collectors():
    """Test that collectors can be imported."""
    print("Testing collectors...")
    
    try:
        from collectors.reddit_collector import RedditCollector
        print("  ✓ Reddit collector imported")
        print("✓ Collectors ready\n")
        return True
    except Exception as e:
        print(f"  ✗ Collector import failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Prox Autonomous Discovery - System Test")
    print("=" * 60)
    print()
    
    tests = [
        ("Package Installation", test_imports),
        ("Environment Configuration", test_env_file),
        ("Database Connection", test_database),
        ("Collectors", test_collectors)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"✗ {name} failed with error: {e}\n")
            results.append((name, False))
    
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {name}")
    
    print()
    print(f"Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! System ready.")
        print("\nNext steps:")
        print("1. Test data collection: python collectors/reddit_collector.py")
        print("2. View collected data: psql $DATABASE_URL -c 'SELECT * FROM platform_posts LIMIT 5;'")
        return 0
    else:
        print("\n✗ Some tests failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
