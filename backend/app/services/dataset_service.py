import io
from typing import Any
from uuid import UUID

import numpy as np
import pandas as pd
from app.core.config import settings
from app.db.models.entities import Dataset, User
from app.schemas.dataset import DatasetPreviewResponse, DatasetSummaryResponse
from app.storage.file_storage import storage_service
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session


class DatasetService:
    @staticmethod
    def _inspect_dataframe(df: pd.DataFrame) -> dict[str, Any]:
        """Calculates column datatypes, missing counts, and unique values."""
        metadata = {}
        for col in df.columns:
            s = df[col]
            dtype = str(s.dtype)
            null_count = int(s.isnull().sum())
            unique_count = int(s.nunique(dropna=True))
            is_numeric = bool(pd.api.types.is_numeric_dtype(s))
            metadata[str(col)] = {
                "dtype": dtype,
                "null_count": null_count,
                "unique_count": unique_count,
                "is_numeric": is_numeric,
                "sample_values": [None if pd.isna(v) else str(v) for v in s.dropna().head(3).tolist()]
            }
        return metadata

    @staticmethod
    def upload_dataset(db: Session, user: User, file: UploadFile, custom_name: str | None = None) -> Dataset:
        # Check filename & extension
        filename = file.filename or "dataset.csv"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in ["csv", "json"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV and JSON datasets are supported."
            )

        content = file.file.read()
        file_size = len(content)

        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
            )

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty."
            )

        # Parse DataFrame to validate format and check row/col limits
        try:
            if ext == "csv":
                df = pd.read_csv(io.BytesIO(content), low_memory=False)
            else:
                df = pd.read_json(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse {ext.upper()} file: {e!s}"
            )

        row_count, col_count = df.shape
        if row_count > settings.MAX_ROWS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dataset row count ({row_count}) exceeds limit of {settings.MAX_ROWS}."
            )
        if col_count > settings.MAX_COLS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dataset column count ({col_count}) exceeds limit of {settings.MAX_COLS}."
            )

        # Save to private storage
        storage_key, _ = storage_service.save_upload_file(content, filename)
        col_metadata = DatasetService._inspect_dataframe(df)

        display_name = (custom_name or filename).strip()

        dataset = Dataset(
            owner_id=user.id,
            name=display_name,
            original_filename=filename,
            storage_key=storage_key,
            file_format=ext,
            file_size=file_size,
            row_count=row_count,
            column_count=col_count,
            column_metadata=col_metadata,
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset

    @staticmethod
    def get_user_datasets(db: Session, user: User) -> list[Dataset]:
        """Lists all datasets owned by user (or all if admin)."""
        query = db.query(Dataset)
        if user.role != "admin":
            query = query.filter(Dataset.owner_id == user.id)
        return query.order_by(Dataset.created_at.desc()).all()

    @staticmethod
    def get_dataset(db: Session, dataset_id: UUID, user: User) -> Dataset:
        """Retrieves a dataset ensuring strict ownership validation."""
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found."
            )
        if dataset.owner_id != user.id and user.role != "admin":
            # Reject cross-user access without disclosing existence
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset not found."
            )
        return dataset

    @staticmethod
    def delete_dataset(db: Session, dataset_id: UUID, user: User) -> None:
        """Deletes dataset record and storage file."""
        dataset = DatasetService.get_dataset(db, dataset_id, user)
        storage_service.delete_upload_file(dataset.storage_key)
        db.delete(dataset)
        db.commit()

    @staticmethod
    def get_preview(
        db: Session, dataset_id: UUID, user: User, page: int = 1, page_size: int = 15
    ) -> DatasetPreviewResponse:
        dataset = DatasetService.get_dataset(db, dataset_id, user)
        df = storage_service.load_dataset(dataset.storage_key, dataset.file_format)

        total_rows = len(df)
        start_idx = (page - 1) * page_size
        end_idx = min(start_idx + page_size, total_rows)

        page_df = df.iloc[start_idx:end_idx].copy()
        # Replace NaN with None for valid JSON serialization
        records = page_df.replace({np.nan: None}).to_dict(orient="records")

        return DatasetPreviewResponse(
            columns=[str(c) for c in df.columns],
            rows=records,
            total_rows=total_rows,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    def get_summary(db: Session, dataset_id: UUID, user: User) -> DatasetSummaryResponse:
        dataset = DatasetService.get_dataset(db, dataset_id, user)
        df = storage_service.load_dataset(dataset.storage_key, dataset.file_format)

        missing_values = {str(col): int(df[col].isnull().sum()) for col in df.columns}
        duplicate_rows = int(df.duplicated().sum())
        dtypes = {str(col): str(df[col].dtype) for col in df.columns}

        numeric_summary: dict[str, dict[str, Any]] = {}
        categorical_summary: dict[str, dict[str, Any]] = {}
        potential_outliers: dict[str, int] = {}

        for col in df.columns:
            s = df[col]
            if pd.api.types.is_numeric_dtype(s):
                valid_s = s.dropna()
                if len(valid_s) > 0:
                    q1 = float(valid_s.quantile(0.25))
                    q3 = float(valid_s.quantile(0.75))
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outlier_count = int(((valid_s < lower_bound) | (valid_s > upper_bound)).sum())
                    potential_outliers[str(col)] = outlier_count

                    numeric_summary[str(col)] = {
                        "count": int(valid_s.count()),
                        "mean": round(float(valid_s.mean()), 4),
                        "std": round(float(valid_s.std()), 4) if len(valid_s) > 1 else 0.0,
                        "min": round(float(valid_s.min()), 4),
                        "q25": round(q1, 4),
                        "median": round(float(valid_s.median()), 4),
                        "q75": round(q3, 4),
                        "max": round(float(valid_s.max()), 4),
                        "iqr": round(iqr, 4),
                    }
            else:
                valid_s = s.dropna().astype(str)
                top_counts = valid_s.value_counts().head(5).to_dict()
                categorical_summary[str(col)] = {
                    "count": int(valid_s.count()),
                    "unique": int(valid_s.nunique()),
                    "top_values": {str(k): int(v) for k, v in top_counts.items()},
                }

        return DatasetSummaryResponse(
            id=dataset.id,
            name=dataset.name,
            row_count=len(df),
            column_count=len(df.columns),
            duplicate_rows=duplicate_rows,
            missing_values=missing_values,
            dtypes=dtypes,
            numeric_summary=numeric_summary,
            categorical_summary=categorical_summary,
            potential_outliers=potential_outliers,
        )
