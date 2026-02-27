from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReferralInviteRequest(BaseModel):
    referee_name: str
    referee_phone: str
    referee_email: Optional[str] = None

class ReferralResponse(BaseModel):
    success: bool
    message: str
    referral_id: Optional[int] = None
    invite_link: Optional[str] = None

class ReferralStats(BaseModel):
    total_earned: float
    goal_amount: float
    total_invites: int
    successful_invites: int
    pending_invites: int
    referral_code: str
    referral_link: str

class ReferralItem(BaseModel):
    id: int
    name: str
    phone: str
    status: str
    clicked_count: int
    referral_code: Optional[str] = None
    created_at: datetime
    
class DashboardResponse(BaseModel):
    success: bool
    stats: ReferralStats
    invites: List[ReferralItem]
