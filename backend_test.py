#!/usr/bin/env python3
"""
Backend API Testing for Voice Agent Application
Since this appears to be a frontend-only React application, this test will focus on
checking if there are any backend endpoints and testing the frontend functionality.
"""

import requests
import sys
from datetime import datetime

class VoiceAgentTester:
    def __init__(self, frontend_url="http://localhost:3002"):
        self.frontend_url = frontend_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, test_func):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            success = test_func()
            if success:
                self.tests_passed += 1
                print(f"✅ Passed")
            else:
                print(f"❌ Failed")
            return success
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_frontend_accessibility(self):
        """Test if frontend is accessible"""
        try:
            response = requests.get(self.frontend_url, timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    def test_static_assets(self):
        """Test if static assets are loading"""
        try:
            # Test common static asset paths
            assets_to_test = [
                f"{self.frontend_url}/favicon.ico",
                f"{self.frontend_url}/manifest.json"
            ]
            
            for asset in assets_to_test:
                try:
                    response = requests.get(asset, timeout=5)
                    if response.status_code == 200:
                        return True
                except:
                    continue
            return False
        except Exception:
            return False

    def test_retell_api_connectivity(self):
        """Test if Retell AI API is accessible (without making actual calls)"""
        try:
            # Just test if the Retell API endpoint is reachable
            response = requests.get("https://api.retellai.com", timeout=10)
            # Any response (even 404) means the API is reachable
            return True
        except Exception:
            return False

    def check_environment_setup(self):
        """Check if environment variables are properly set"""
        print("\n🔧 Environment Setup Check:")
        
        # Since we can't directly access the .env file from the running app,
        # we'll check if the file exists and has the required variables
        try:
            with open('/app/.env', 'r') as f:
                env_content = f.read()
                
            has_api_key = 'VITE_RETELL_API_KEY' in env_content
            has_agent_id = 'VITE_RETELL_AGENT_ID' in env_content
            
            print(f"  - VITE_RETELL_API_KEY: {'✅ Present' if has_api_key else '❌ Missing'}")
            print(f"  - VITE_RETELL_AGENT_ID: {'✅ Present' if has_agent_id else '❌ Missing'}")
            
            return has_api_key and has_agent_id
            
        except Exception as e:
            print(f"  ❌ Error reading .env file: {str(e)}")
            return False

def main():
    print("🎯 Voice Agent Application Backend Testing")
    print("=" * 50)
    
    # Setup
    tester = VoiceAgentTester()
    
    # Check environment setup first
    env_ok = tester.check_environment_setup()
    
    # Run tests
    tester.run_test("Frontend Accessibility", tester.test_frontend_accessibility)
    tester.run_test("Static Assets Loading", tester.test_static_assets)
    tester.run_test("Retell AI API Connectivity", tester.test_retell_api_connectivity)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"  - Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"  - Environment setup: {'✅ OK' if env_ok else '❌ Issues found'}")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    if tester.tests_passed == tester.tests_run and env_ok:
        print("  ✅ Backend infrastructure looks good. Focus on frontend voice agent testing.")
    else:
        print("  ⚠️ Some issues found. Check the failed tests above.")
        
    if not env_ok:
        print("  🔧 Environment variables need attention for voice agent functionality.")
    
    return 0 if (tester.tests_passed == tester.tests_run and env_ok) else 1

if __name__ == "__main__":
    sys.exit(main())