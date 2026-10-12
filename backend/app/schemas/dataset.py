from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DatasetResponse(BaseModel):
    id: UUID
    owner_id: UUID
    name: str
    original_filename: str
    file_format: str
    file_size: int
    row_count: int
    column_count: int
    column_metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DatasetPreviewResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    total_rows: int
    page: int
    page_size: int


class DatasetSummaryResponse(BaseModel):
    id: UUID
    name: str
    row_count: int
    column_count: int
    duplicate_rows: int
    missing_values: dict[str, int]
    dtypes: dict[str, str]
    numeric_summary: dict[str, dict[str, Any]]
    categorical_summary: dict[str, dict[str, Any]]
    potential_outliers: dict[str, int]
