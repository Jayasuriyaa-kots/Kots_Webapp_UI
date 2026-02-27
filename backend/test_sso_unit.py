import jwt
import os
from dotenv import load_dotenv
from services.auth_service import create_sso_token
from config import get_settings

load_dotenv()

def test_sso_token_generation():
    print("Testing SSO Token Generation...")
    phone = "919999999999"
    booking_id = "test-booking-123"
    
    token = create_sso_token(phone, booking_id)
    print(f"Generated Token: {token[:30]}...")
    
    # Verify the token
    settings = get_settings()
    decoded = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    
    print(f"Decoded Payload: {decoded}")
    
    assert decoded["phone"] == phone
    assert decoded["booking_id"] == booking_id
    assert "exp" in decoded
    print("✅ Unit Test Passed!")

if __name__ == "__main__":
    test_sso_token_generation()
