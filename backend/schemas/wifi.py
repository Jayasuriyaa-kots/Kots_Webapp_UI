from pydantic import BaseModel
from typing import Optional

class WifiResponse(BaseModel):
    success: bool
    wifi_id: Optional[str] = None
    wifi_password: Optional[str] = None
    message: Optional[str] = None
