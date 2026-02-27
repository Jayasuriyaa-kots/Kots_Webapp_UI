from pydantic import BaseModel
from typing import List, Optional

class CoOccupant(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: str = "assets/images/user-avatar.svg"

class OccupancyResponse(BaseModel):
    success: bool
    max_occupancy: Optional[str] = None
    co_occupants: List[CoOccupant] = []
    message: Optional[str] = None
