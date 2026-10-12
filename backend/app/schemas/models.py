from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TrainModelRequest(BaseModel):
    target_column: str
    feature_columns: list[str] = Field(..., min_length=1)
    task_type: str = Field(..., pattern="^(classification|regression)$")
    algorithm: str = Field(..., pattern="^(random_forest|linear_baseline)$")
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    random_state: int = Field(default=42)


class TrainModelResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    task_type: str
    algorithm: str
    target_column: str
    feature_columns: list[str]
    metrics: dict[str, Any]
    feature_importances: dict[str, float] | None = None
    leakage_warnings: list[str] = []
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PredictRequest(BaseModel):
    inputs: list[dict[str, Any]] = Field(..., min_length=1, max_length=100)


class PredictResponse(BaseModel):
    model_id: UUID
    predictions: list[float | int | str]
