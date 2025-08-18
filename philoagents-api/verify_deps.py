#!/usr/bin/env python3
"""
Dependency verification script for philoagents API
Run this to verify all required dependencies are properly installed
"""

import sys
import importlib.util

def check_import(module_name, package_name=None):
    """Check if a module can be imported"""
    try:
        if importlib.util.find_spec(module_name) is not None:
            __import__(module_name)
            print(f"✓ {module_name} imported successfully")
            return True
        else:
            print(f"✗ {module_name} not found")
            return False
    except ImportError as e:
        print(f"✗ {module_name} import failed: {e}")
        if package_name:
            print(f"  Try: pip install {package_name}")
        return False

def main():
    """Verify all critical dependencies"""
    print("PhiloAgents API Dependency Verification")
    print("=" * 40)
    
    critical_deps = [
        ("fastapi", "fastapi"),
        ("langchain_core", "langchain-core"),
        ("langchain_groq", "langchain-groq"),
        ("langgraph", "langgraph"),
        ("pymongo", "pymongo"),
        ("clerk_backend_api", "clerk-backend-api"),
        ("pydantic", "pydantic"),
        ("pydantic_settings", "pydantic-settings"),
    ]
    
    failed = []
    
    for module, package in critical_deps:
        if not check_import(module, package):
            failed.append((module, package))
    
    print("\n" + "=" * 40)
    if failed:
        print(f"✗ {len(failed)} critical dependencies failed to import:")
        for module, package in failed:
            print(f"  - {module} (install with: pip install {package})")
        print("\nTo install all dependencies:")
        print("  pip install -r requirements.txt")
        print("  OR: uv pip install -e .")
        sys.exit(1)
    else:
        print("✓ All critical dependencies verified successfully!")
        
        # Test specific clerk import
        try:
            from clerk_backend_api import Clerk
            print("✓ Clerk backend API ready for use")
        except Exception as e:
            print(f"✗ Clerk backend API import issue: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()