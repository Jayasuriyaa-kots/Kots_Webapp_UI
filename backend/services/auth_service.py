import jwt
from datetime import datetime, timedelta, timezone
from config import get_settings

def create_sso_token(phone: str, booking_id: str) -> str:
    """
    Creates a signed JWT for SSO with Site B.
    Payload contains phone, booking_id, and expiration.
    """
    settings = get_settings()
    
    # Set expiration to 7 days from now
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    
    payload = {
        "phone": phone,
        "booking_id": booking_id,
        "exp": int(exp.timestamp())
    }
    
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return token

def create_session_token(phone: str) -> str:
    """
    Creates a signed JWT for internal Site A session.
    Payload contains phone and expiration (longer than SSO).
    """
    settings = get_settings()
    
    # Set expiration to 7 days from now
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    
    payload = {
        "phone": phone,
        "exp": int(exp.timestamp()),
        "type": "session"
    }
    
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return token

def verify_token(token: str):
    """
    Verifies a JWT token and returns the payload.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
