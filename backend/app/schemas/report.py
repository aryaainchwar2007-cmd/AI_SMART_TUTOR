from typing import Any
from uuid import UUID

from pydantic import BaseModel


class GenerateReportRequest(BaseModel):
    include_cleaning: bool = True
    include_eda: bool = True
    include_visualizations: bool = True
    include_statistics: bool = True
    include_models: bool = True
    notes: str | None = None


class ReportResponse(BaseModel):
    report_id: str
    dataset_name: str
    dataset_id: UUID
    generated_at: str
    student_email: str
    sections: dict[str, Any]
    download_url: str | None = None
