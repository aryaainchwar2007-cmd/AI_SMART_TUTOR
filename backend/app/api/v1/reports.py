import json
from uuid import UUID

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.models.entities import User
from app.db.session import get_db
from app.schemas.report import GenerateReportRequest, ReportResponse
from app.services.report_service import ReportService
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

router = APIRouter(tags=["Reports"])


@router.post("/datasets/{dataset_id}/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    dataset_id: UUID,
    req: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return ReportService.generate_report(db, dataset_id, current_user, req)


@router.get("/reports/{report_id}")
def get_report_json(
    report_id: str,
    current_user: User = Depends(get_current_user),
):
    report_path = settings.REPORT_DIR / f"{report_id}.json"
    if not report_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Ownership check
    if data.get("student_email") != current_user.email and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
    return data


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
):
    report_path = settings.REPORT_DIR / f"{report_id}.json"
    if not report_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("student_email") != current_user.email and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )

    return FileResponse(
        path=report_path,
        filename=f"academic_report_{report_id[:8]}.json",
        media_type="application/json",
    )
