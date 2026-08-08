from pydantic import BaseModel, Field
class SubscriptionChangeRequest(BaseModel):
    plan_code: str = Field(
        min_length=1,
        max_length=50,
    )
from datetime import datetime
from pydantic import BaseModel


class SubscriptionUsageResponse(BaseModel):
    plan: str
    analysis_limit: int | None
    used: int
    remaining: int | None
    reset_at: datetime