from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CleanDataRequest(BaseModel):
    drop_duplicates: bool = True
    missing_numeric_strategy: str = Field(default="median", pattern="^(none|mean|median|drop)$")
    missing_categorical_strategy: str = Field(default="mode", pattern="^(none|mode|drop)$")
    remove_outliers: bool = False
    outlier_method: str = Field(default="iqr", pattern="^(iqr|zscore)$")
    outlier_columns: list[str] | None = None
    save_as_new: bool = False
    new_dataset_name: str | None = None


class CleanDataResponse(BaseModel):
    original_row_count: int
    cleaned_row_count: int
    duplicates_removed: int
    missing_imputed: dict[str, Any]
    outliers_removed: int
    new_dataset_id: UUID | None = None
    summary_message: str


class VisualizationRequest(BaseModel):
    chart_type: str = Field(..., pattern="^(histogram|bar|box|scatter|line|heatmap|pairplot)$")
    x_column: str | None = None
    y_column: str | None = None
    hue_column: str | None = None
    columns: list[str] | None = None
    title: str | None = None
    bins: int | None = Field(default=20, ge=5, le=100)


class VisualizationResponse(BaseModel):
    chart_type: str
    image_base64: str
    educational_notes: str
    suggested_questions: list[str]


class StatisticsRequest(BaseModel):
    columns: list[str] | None = None
    hypothesis_test: str | None = Field(default=None, pattern="^(two_sample_ttest|chi_square|shapiro_wilk|pearson)$")
    col1: str | None = None
    col2: str | None = None


class StatisticsResponse(BaseModel):
    descriptive_statistics: dict[str, dict[str, Any]]
    skewness_kurtosis: dict[str, dict[str, Any]]
    correlation_matrix: dict[str, dict[str, float | None]]
    hypothesis_test_result: dict[str, Any] | None = None
    educational_guide: str


class AnalysisRunResponse(BaseModel):
    id: UUID
    dataset_id: UUID
    analysis_type: str
    parameters: dict[str, Any]
    result_summary: dict[str, Any]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
