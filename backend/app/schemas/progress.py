from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProgressRecordCreate(BaseModel):
    topic: str = Field(..., min_length=2, max_length=128)
    activity_type: str = Field(..., pattern="^(quiz|lab|viva|tutorial|model_training)$")
    score: float | None = Field(default=None, ge=0.0, le=100.0)


class ProgressResponse(BaseModel):
    id: UUID
    topic: str
    activity_type: str
    score: float | None
    completed_at: datetime

    model_config = ConfigDict(from_attributes=True)
