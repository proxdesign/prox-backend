#!/usr/bin/env python3
"""Test startup to debug Railway routing issue."""

import os
import sys

def test_imports():
    print("🔍 Testing imports...")
    
    try:
        print("Testing database connection...")
        from database.connection import db
        print("✅ Database connection imported")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    try:
        print("Testing auth service...")
        from services.auth_service import auth_service
        print("✅ Auth service imported")
    except Exception as e:
        print(f"❌ Auth service failed: {e}")
        return False
    
    try:
        print("Testing FastAPI app...")
        from api.main import app
        print("✅ FastAPI app imported")
        
        # Check routes
        total_routes = len([r for r in app.routes if hasattr(r, 'path')])
        auth_routes = len([r for r in app.routes if hasattr(r, 'path') and 'auth' in str(r.path)])
        health_routes = len([r for r in app.routes if hasattr(r, 'path') and 'health' in str(r.path)])
        
        print(f"Total routes: {total_routes}")
        print(f"Auth routes: {auth_routes}")
        print(f"Health routes: {health_routes}")
        
        if auth_routes == 0:
            print("❌ No auth routes found!")
            return False
            
        if health_routes == 0:
            print("❌ No health routes found!")
            return False
            
        print("✅ All routes properly registered")
        return True
        
    except Exception as e:
        print(f"❌ FastAPI app failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Railway Startup Test")
    print("=" * 30)
    
    success = test_imports()
    
    if success:
        print("\n✅ All tests passed - routes should be working!")
    else:
        print("\n❌ Tests failed - this explains the 404 errors")
        
    sys.exit(0 if success else 1)