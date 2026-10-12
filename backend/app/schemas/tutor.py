from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
    title: str | None = "New Study Session"


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int | None = 0

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)
    mode: str = Field(default="guided", pattern="^(guided|direct|quiz)$")
    dataset_id: UUID | None = None


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
