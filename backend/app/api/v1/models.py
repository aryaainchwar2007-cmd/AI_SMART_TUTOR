from uuid import UUID

from app.api.dependencies import get_current_user
from app.db.models.entities import User
from app.db.session import get_db
from app.schemas.models import (
    PredictRequest,
    PredictResponse,
    TrainModelRequest,
    TrainModelResponse,
)
from app.services.ml_service import MLService
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["Machine Learning"])


@router.post("/datasets/{dataset_id}/models/train", response_model=TrainModelResponse, status_code=status.HTTP_201_CREATED)
def train_model(
    dataset_id: UUID,
    req: TrainModelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    model = MLService.train(db, dataset_id, current_user, req)
    return model


@router.get("/models", response_model=list[TrainModelResponse])
def list_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return MLService.get_models(db, current_user)


@router.get("/models/{model_id}", response_model=TrainModelResponse)
def get_model(
    model_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return MLService.get_model(db, model_id, current_user)


@router.post("/models/{model_id}/predict", response_model=PredictResponse)
def predict(
    model_id: UUID,
    req: PredictRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return MLService.predict(db, model_id, current_user, req)
