import re
import uuid
from pathlib import Path

import pandas as pd
from app.core.config import settings
from fastapi import HTTPException, status


class StorageService:
    def __init__(self, base_dir: Path | None = None):
        self.base_dir = base_dir or settings.STORAGE_DIR
        self.upload_dir = self.base_dir / "uploads"
        self.artifact_dir = self.base_dir / "artifacts"
        self.report_dir = self.base_dir / "reports"

        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.artifact_dir.mkdir(parents=True, exist_ok=True)
        self.report_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        """Sanitizes user filename to prevent path traversal and unusual characters."""
        clean = Path(filename).name  # Strips directory traversal
        clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean)
        return clean or "dataset"

    def _validate_safe_path(self, target_path: Path, expected_parent: Path) -> None:
        """Ensures the resolved path stays strictly within the allowed directory."""
        resolved = target_path.resolve()
        parent_resolved = expected_parent.resolve()
        if not str(resolved).startswith(str(parent_resolved)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: Path traversal detected."
            )

    def save_upload_file(self, content_bytes: bytes, original_filename: str) -> tuple[str, str]:
        """Saves an uploaded file safely and returns (storage_key, sanitized_filename)."""
        file_ext = Path(original_filename).suffix.lower()
        if file_ext not in [".csv", ".json"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{file_ext}'. Allowed formats: .csv, .json"
            )

        storage_key = f"{uuid.uuid4().hex}{file_ext}"
        target_path = self.upload_dir / storage_key
        self._validate_safe_path(target_path, self.upload_dir)

        with open(target_path, "wb") as f:
            f.write(content_bytes)

        sanitized_name = self._sanitize_filename(original_filename)
        return storage_key, sanitized_name

    def get_upload_path(self, storage_key: str) -> Path:
        """Gets full path to uploaded file, preventing path traversal."""
        # storage_key must not have path separators
        clean_key = Path(storage_key).name
        target_path = self.upload_dir / clean_key
        self._validate_safe_path(target_path, self.upload_dir)
        if not target_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dataset file not found in storage."
            )
        return target_path

    def load_dataset(self, storage_key: str, file_format: str) -> pd.DataFrame:
        """Safely loads a dataset into a pandas DataFrame."""
        file_path = self.get_upload_path(storage_key)
        try:
            if file_format == "csv":
                df = pd.read_csv(file_path, low_memory=False)
            elif file_format == "json":
                df = pd.read_json(file_path)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported format: {file_format}"
                )
            return df
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading dataset file: {e!s}"
            )

    def save_dataframe(self, df: pd.DataFrame, file_format: str = "csv") -> tuple[str, int]:
        """Safely saves a pandas DataFrame to storage and returns (storage_key, file_size).
        Applies formula injection mitigation on string columns for CSV.
        """
        storage_key = f"{uuid.uuid4().hex}.{file_format}"
        target_path = self.upload_dir / storage_key
        self._validate_safe_path(target_path, self.upload_dir)

        if file_format == "csv":
            # Sanitize CSV formula injection for string values starting with =, +, -, @
            clean_df = df.copy()
            for col in clean_df.select_dtypes(include=["object", "string"]).columns:
                clean_df[col] = clean_df[col].astype(str).apply(
                    lambda x: f"'{x}" if x and x[0] in ("=", "+", "-", "@") else x
                )
            clean_df.to_csv(target_path, index=False)
        elif file_format == "json":
            df.to_json(target_path, orient="records", date_format="iso")
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {file_format}"
            )

        file_size = target_path.stat().st_size
        return storage_key, file_size

    def delete_upload_file(self, storage_key: str) -> None:
        """Deletes an uploaded file."""
        try:
            path = self.get_upload_path(storage_key)
            if path.exists():
                path.unlink()
        except HTTPException:
            pass

    def get_artifact_path(self, artifact_key: str) -> Path:
        """Gets full path to a model artifact."""
        clean_key = Path(artifact_key).name
        target_path = self.artifact_dir / clean_key
        self._validate_safe_path(target_path, self.artifact_dir)
        return target_path


storage_service = StorageService()
