import requests
import time

try:
    print("Testing /api/health...")
    response = requests.get("http://localhost:8000/api/health", timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Health check failed: {e}")

try:
    print("\nTesting /api/referrals/dashboard (expecting 422 Unprocessable Entity due to missing param)...")
    response = requests.get("http://localhost:8000/api/referrals/dashboard", timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Dashboard check failed: {e}")
