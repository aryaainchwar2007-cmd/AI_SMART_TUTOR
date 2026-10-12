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
from sqlalchemy.orm import Session

router = APIRouter(prefix="/conversations", tags=["AI Tutor"])


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
