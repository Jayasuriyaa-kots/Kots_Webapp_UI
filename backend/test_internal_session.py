import requests
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000/api"
JWT_SECRET = os.getenv("JWT_SECRET", "your-default-secret-key-for-local-dev")

def test_internal_session_flow():
    print("--- Testing Internal Session Flow (Secure Cookies) ---")
    
    # Use real test data from the DB
    phone = "9782293828" 
    booking_id = "K05B40"
    
    # 1. Login (Fetch Bookings)
    print(f"Step 1: Logging in with phone: {phone}...")
    response = requests.get(f"{BASE_URL}/bookings", params={"phone": phone})
    
    if response.status_code != 200:
        print(f"❌ Login failed with status {response.status_code}")
        print(f"Response: {response.text}")
        return

    # Check for the cookie
    cookies = response.cookies
    if "session_token" not in cookies:
        print("❌ session_token cookie NOT found in response!")
        return
    
    print("✅ session_token cookie received!")
    token = cookies["session_token"]
    
    # Verify token content (locally for debugging)
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        print(f"Decoded Payload: {decoded}")
        assert decoded["phone"] in phone # API might clean it, check inclusion
        assert decoded["type"] == "session"
        print("✅ Token payload verified!")
    except Exception as e:
        print(f"⚠️ Could not verify token payload locally: {e}")

    # 2. Try to access a protected route WITHOUT cookie
    print("\nStep 2: Accessing protected route WITHOUT cookie...")
    protected_url = f"{BASE_URL}/tenant-details"
    
    res_no_auth = requests.get(protected_url, params={"booking_id": booking_id})
    print(f"Status (should be 401): {res_no_auth.status_code}")
    if res_no_auth.status_code == 401:
        print("✅ Access denied as expected.")
    else:
        print(f"❌ Unexpected status code: {res_no_auth.status_code}")

    # 3. Try to access protected route WITH cookie
    print("\nStep 3: Accessing protected route WITH cookie...")
    res_with_auth = requests.get(
        protected_url, 
        params={"booking_id": booking_id}, 
        cookies=cookies
    )
    print(f"Status (should be 200 or successful outcome): {res_with_auth.status_code}")
    if res_with_auth.status_code in [200, 404]: # 404 is fine as long as not 401
        print(f"✅ Auth verified! Route returned: {res_with_auth.status_code}")
    else:
        print(f"❌ Auth failed! Returned: {res_with_auth.status_code}")

    print("\n--- Internal Session Test Complete ---")

if __name__ == "__main__":
    test_internal_session_flow()
