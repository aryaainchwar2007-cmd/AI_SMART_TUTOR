from uuid import UUID

from app.api.dependencies import check_rate_limit, get_current_user
from app.core.config import settings
from app.db.models.entities import User
from app.db.session import get_db
from app.schemas.dataset import (
    DatasetPreviewResponse,
    DatasetResponse,
    DatasetSummaryResponse,
)
from app.services.dataset_service import DatasetService
from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/datasets", tags=["Datasets"])


@router.post("", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
def upload_dataset(
    file: UploadFile = File(...),
    name: str | None = Form(None),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request:
        client_ip = request.client.host if request.client else "unknown"
        check_rate_limit(f"upload_{client_ip}", max_requests=settings.RATE_LIMIT_UPLOAD_PER_MINUTE)

    return DatasetService.upload_dataset(db, current_user, file, custom_name=name)


@router.get("", response_model=list[DatasetResponse])
def list_datasets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return DatasetService.get_user_datasets(db, current_user)


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(
    dataset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return DatasetService.get_dataset(db, dataset_id, current_user)


@router.delete("/{dataset_id}", status_code=status.HTTP_200_OK)
def delete_dataset(
    dataset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    DatasetService.delete_dataset(db, dataset_id, current_user)
    return {"message": "Dataset deleted successfully."}


@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def preview_dataset(
    dataset_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=15, ge=5, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return DatasetService.get_preview(db, dataset_id, current_user, page=page, page_size=page_size)


@router.get("/{dataset_id}/summary", response_model=DatasetSummaryResponse)
def summarize_dataset(
    dataset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return DatasetService.get_summary(db, dataset_id, current_user)
