import requests
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

SECRET = os.getenv("JWT_SECRET")
URL = "http://localhost:8000/api/bookings"
TEST_PHONE = "7010239245" # Using a number that might exist in the db

try:
    print(f"Testing API: {URL}?phone={TEST_PHONE}")
    response = requests.get(f"{URL}?phone={TEST_PHONE}")
    data = response.json()
    
    if data.get("success") and data.get("bookings"):
        booking = data["bookings"][0]
        token = booking.get("sso_token")
        
        if token:
            print(f"✅ Token found: {token[:20]}...")
            decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
            print(f"✅ Token decoded successfully!")
            print(f"   Payload: {decoded}")
        else:
            print("❌ No sso_token found in booking response.")
    else:
        print(f"⚠️ No bookings found or request failed: {data.get('message')}")

except Exception as e:
    print(f"❌ Error: {e}")
