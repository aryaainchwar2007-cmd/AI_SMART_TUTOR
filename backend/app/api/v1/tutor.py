from uuid import UUID

from app.api.dependencies import check_rate_limit, get_current_user
from app.core.config import settings
from app.db.models.entities import User
from app.db.session import get_db
from app.schemas.tutor import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.tutor_service import TutorService
from fastapi import APIRouter, Depends, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

router = APIRouter(prefix="/conversations", tags=["AI Tutor"])


class ConfigureProviderRequest(BaseModel):
    api_key: str = Field(..., min_length=5)
    provider: str = Field(default="deepseek")  # "deepseek", "gemini", "openai"
    model: str = Field(default="deepseek-chat")


@router.get("/provider/status")
def get_provider_status(
    current_user: User = Depends(get_current_user),
):
    key = settings.effective_api_key
    masked_key = f"{key[:4]}...{key[-4:]}" if len(key) >= 8 else ("configured" if key else "")
    return {
        "provider": settings.effective_provider,
        "model": settings.effective_model,
        "has_api_key": bool(key),
        "masked_key": masked_key,
        "is_live": bool(key and settings.effective_provider != "mock"),
    }


@router.post("/provider/configure")
def configure_provider(
    req: ConfigureProviderRequest,
    current_user: User = Depends(get_current_user),
):
    key = req.api_key.strip()
    prov = req.provider.strip().lower()

    if prov == "deepseek":
        settings.DEEPSEEK_API_KEY = key
        settings.LLM_API_KEY = key
        settings.LLM_PROVIDER = "deepseek"
        settings.LLM_MODEL = req.model.strip() or "deepseek-chat"
    elif prov == "gemini":
        settings.GEMINI_API_KEY = key
        settings.LLM_API_KEY = key
        settings.LLM_PROVIDER = "gemini"
        settings.LLM_MODEL = req.model.strip() or "gemini-1.5-flash"
    else:
        settings.LLM_API_KEY = key
        settings.LLM_PROVIDER = prov
        settings.LLM_MODEL = req.model.strip()

    return {
        "message": f"{prov.capitalize()} AI Provider configured successfully.",
        "provider": settings.effective_provider,
        "model": settings.effective_model,
        "is_live": True,
    }


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    req: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TutorService.create_conversation(db, current_user, title=req.title)


@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    convs = TutorService.get_conversations(db, current_user)
    # Count messages
    res = []
    for c in convs:
        resp = ConversationResponse.model_validate(c)
        resp.message_count = len(c.messages)
        res.append(resp)
    return res


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
def get_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TutorService.get_messages(db, conversation_id, current_user)


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: UUID,
    req: MessageCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"tutor_msg_{client_ip}", max_requests=settings.RATE_LIMIT_AI_PER_MINUTE)
    return await TutorService.send_message(db, conversation_id, current_user, req)


@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    TutorService.delete_conversation(db, conversation_id, current_user)
    return {"message": "Conversation deleted successfully."}
