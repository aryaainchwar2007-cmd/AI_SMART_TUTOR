from typing import Any

from app.api.dependencies import get_current_user
from app.db.models.entities import User
from app.db.session import get_db
from app.schemas.progress import ProgressRecordCreate, ProgressResponse
from app.services.progress_service import ProgressService
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/progress", tags=["Learning Progress"])


@router.get("", response_model=list[ProgressResponse])
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ProgressService.get_progress(db, current_user)


@router.post("", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED)
def record_progress(
    req: ProgressRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ProgressService.record_progress(db, current_user, req)


@router.get("/dashboard", response_model=dict[str, Any])
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ProgressService.get_dashboard_stats(db, current_user)
