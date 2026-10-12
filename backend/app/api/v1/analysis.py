from uuid import UUID

from app.api.dependencies import get_current_user
from app.db.models.entities import AnalysisRun, User
from app.db.session import get_db
from app.schemas.analysis import (
    AnalysisRunResponse,
    CleanDataRequest,
    CleanDataResponse,
    StatisticsRequest,
    StatisticsResponse,
    VisualizationRequest,
    VisualizationResponse,
)
from app.services.cleaning_service import CleaningService
from app.services.dataset_service import DatasetService
from app.services.statistics_service import StatisticsService
from app.services.visualization_service import VisualizationService
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/datasets", tags=["Analysis"])


@router.post("/{dataset_id}/clean", response_model=CleanDataResponse)
def clean_dataset(
    dataset_id: UUID,
    req: CleanDataRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return CleaningService.clean_dataset(db, dataset_id, current_user, req)


@router.post("/{dataset_id}/visualizations", response_model=VisualizationResponse)
def create_visualization(
    dataset_id: UUID,
    req: VisualizationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return VisualizationService.generate_chart(db, dataset_id, current_user, req)


@router.post("/{dataset_id}/statistics", response_model=StatisticsResponse)
def compute_statistics(
    dataset_id: UUID,
    req: StatisticsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StatisticsService.compute_statistics(db, dataset_id, current_user, req)


@router.get("/{dataset_id}/analysis-runs", response_model=list[AnalysisRunResponse])
def get_analysis_runs(
    dataset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Ensure ownership
    DatasetService.get_dataset(db, dataset_id, current_user)
    runs = (
        db.query(AnalysisRun)
        .filter(AnalysisRun.dataset_id == dataset_id)
        .order_by(AnalysisRun.created_at.desc())
        .all()
    )
    return runs
