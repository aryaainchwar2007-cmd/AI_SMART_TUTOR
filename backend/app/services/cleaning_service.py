from typing import Any
from uuid import UUID

import numpy as np
import pandas as pd
from app.db.models.entities import AnalysisRun, Dataset, User
from app.schemas.analysis import CleanDataRequest, CleanDataResponse
from app.services.dataset_service import DatasetService
from app.storage.file_storage import storage_service
from sqlalchemy.orm import Session


class CleaningService:
    @staticmethod
    def clean_dataset(
        db: Session, dataset_id: UUID, user: User, req: CleanDataRequest
    ) -> CleanDataResponse:
        dataset = DatasetService.get_dataset(db, dataset_id, user)
        df = storage_service.load_dataset(dataset.storage_key, dataset.file_format)

        orig_row_count = len(df)
        duplicates_removed = 0
        missing_imputed: dict[str, Any] = {}
        outliers_removed = 0

        cleaned_df = df.copy()

        # 1. Remove duplicate rows if requested
        if req.drop_duplicates:
            before_dups = len(cleaned_df)
            cleaned_df = cleaned_df.drop_duplicates()
            duplicates_removed = before_dups - len(cleaned_df)

        # 2. Impute or drop missing values
        # Numeric columns
        num_cols = cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
        for col in num_cols:
            null_count = int(cleaned_df[col].isnull().sum())
            if null_count > 0:
                if req.missing_numeric_strategy == "median":
                    fill_val = float(cleaned_df[col].median())
                    cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                    missing_imputed[str(col)] = {"strategy": "median", "value": round(fill_val, 4), "count": null_count}
                elif req.missing_numeric_strategy == "mean":
                    fill_val = float(cleaned_df[col].mean())
                    cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                    missing_imputed[str(col)] = {"strategy": "mean", "value": round(fill_val, 4), "count": null_count}
                elif req.missing_numeric_strategy == "drop":
                    cleaned_df = cleaned_df.dropna(subset=[col])
                    missing_imputed[str(col)] = {"strategy": "drop", "dropped_rows": null_count}

        # Categorical columns
        cat_cols = [c for c in cleaned_df.columns if c not in num_cols]
        for col in cat_cols:
            null_count = int(cleaned_df[col].isnull().sum())
            if null_count > 0:
                if req.missing_categorical_strategy == "mode":
                    modes = cleaned_df[col].mode()
                    fill_val = modes.iloc[0] if not modes.empty else "Missing"
                    cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                    missing_imputed[str(col)] = {"strategy": "mode", "value": str(fill_val), "count": null_count}
                elif req.missing_categorical_strategy == "drop":
                    cleaned_df = cleaned_df.dropna(subset=[col])
                    missing_imputed[str(col)] = {"strategy": "drop", "dropped_rows": null_count}

        # 3. Handle Outliers if requested
        if req.remove_outliers:
            target_outlier_cols = req.outlier_columns or num_cols
            mask = pd.Series(True, index=cleaned_df.index)

            for col in target_outlier_cols:
                if col in cleaned_df.columns and pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    col_data = cleaned_df[col].dropna()
                    if len(col_data) > 4:
                        if req.outlier_method == "iqr":
                            q1 = col_data.quantile(0.25)
                            q3 = col_data.quantile(0.75)
                            iqr = q3 - q1
                            lower_bound = q1 - 1.5 * iqr
                            upper_bound = q3 + 1.5 * iqr
                            mask = mask & (cleaned_df[col] >= lower_bound) & (cleaned_df[col] <= upper_bound)
                        elif req.outlier_method == "zscore":
                            mean = col_data.mean()
                            std = col_data.std()
                            if std > 0:
                                z = (cleaned_df[col] - mean).abs() / std
                                mask = mask & (z <= 3.0)

            before_outliers = len(cleaned_df)
            cleaned_df = cleaned_df[mask]
            outliers_removed = before_outliers - len(cleaned_df)

        cleaned_row_count = len(cleaned_df)
        new_dataset_id: UUID | None = None

        if req.save_as_new:
            # Save as a distinct new dataset
            new_name = req.new_dataset_name or f"{dataset.name} (Cleaned)"
            storage_key, file_size = storage_service.save_dataframe(cleaned_df, dataset.file_format)
            new_metadata = DatasetService._inspect_dataframe(cleaned_df)

            new_ds = Dataset(
                owner_id=user.id,
                name=new_name,
                original_filename=f"cleaned_{dataset.original_filename}",
                storage_key=storage_key,
                file_format=dataset.file_format,
                file_size=file_size,
                row_count=cleaned_row_count,
                column_count=len(cleaned_df.columns),
                column_metadata=new_metadata,
            )
            db.add(new_ds)
            db.commit()
            db.refresh(new_ds)
            new_dataset_id = new_ds.id
        else:
            # Update the existing dataset in place safely
            storage_key, file_size = storage_service.save_dataframe(cleaned_df, dataset.file_format)
            dataset.storage_key = storage_key
            dataset.file_size = file_size
            dataset.row_count = cleaned_row_count
            dataset.column_count = len(cleaned_df.columns)
            dataset.column_metadata = DatasetService._inspect_dataframe(cleaned_df)
            db.commit()

        # Log analysis run
        summary = {
            "original_rows": orig_row_count,
            "cleaned_rows": cleaned_row_count,
            "duplicates_removed": duplicates_removed,
            "missing_imputed": missing_imputed,
            "outliers_removed": outliers_removed,
        }

        run = AnalysisRun(
            owner_id=user.id,
            dataset_id=dataset.id,
            analysis_type="cleaning",
            parameters=req.model_dump(),
            result_summary=summary,
            status="completed",
        )
        db.add(run)
        db.commit()

        summary_msg = (
            f"Successfully cleaned dataset. Removed {duplicates_removed} duplicates, "
            f"imputed {len(missing_imputed)} column(s), and filtered {outliers_removed} outliers."
        )

        return CleanDataResponse(
            original_row_count=orig_row_count,
            cleaned_row_count=cleaned_row_count,
            duplicates_removed=duplicates_removed,
            missing_imputed=missing_imputed,
            outliers_removed=outliers_removed,
            new_dataset_id=new_dataset_id,
            summary_message=summary_msg,
        )
