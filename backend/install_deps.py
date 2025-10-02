#!/usr/bin/env python3
"""
Install additional dependencies for PostgreSQL
"""
import subprocess
import sys

def install_dependencies():
    """Install PostgreSQL dependencies"""
    dependencies = [
        "asyncpg",
        "psycopg2-binary",
        "passlib[bcrypt]"
    ]
    
    print("📦 Installing PostgreSQL dependencies...")
    
    for dep in dependencies:
        try:
            print(f"Installing {dep}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
            print(f"✅ {dep} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {dep}: {e}")
            return False
    
    print("🎉 All dependencies installed successfully!")
    return True

if __name__ == "__main__":
    success = install_dependencies()
    sys.exit(0 if success else 1)