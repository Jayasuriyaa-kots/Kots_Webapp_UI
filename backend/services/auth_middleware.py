from fastapi import Request, HTTPException, Depends
from services.auth_service import verify_token

def get_current_user_phone(request: Request):
    """
    Dependency to get the current user's phone from:
    1. session_token cookie (preferred)
    2. Authorization: Bearer <token> header (fallback for cross-origin with self-signed SSL)
    """
    # Try cookie first
    token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return payload.get("phone")
