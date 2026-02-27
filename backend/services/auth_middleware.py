from fastapi import Request, HTTPException, Depends
from services.auth_service import verify_token

def get_current_user_phone(request: Request):
    """
    Dependency to get the current user's phone from the session_token cookie.
    """
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(token)
    if not payload or payload.get("type") != "session":
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return payload.get("phone")
