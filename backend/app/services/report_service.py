import json
import uuid
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from app.core.config import settings
from app.db.models.entities import AnalysisRun, MLModel, User
from app.schemas.report import GenerateReportRequest, ReportResponse
from app.services.dataset_service import DatasetService
from sqlalchemy.orm import Session


class ReportService:
    @staticmethod
    def generate_report(
        db: Session, dataset_id: UUID, user: User, req: GenerateReportRequest
    ) -> ReportResponse:
        dataset = DatasetService.get_dataset(db, dataset_id, user)

        # Gather real computed facts
        runs = db.query(AnalysisRun).filter(
            AnalysisRun.dataset_id == dataset.id
        ).order_by(AnalysisRun.created_at.desc()).all()

        models = db.query(MLModel).filter(
            MLModel.dataset_id == dataset.id
        ).order_by(MLModel.created_at.desc()).all()

        sections: dict[str, Any] = {}

        # 1. Dataset Overview
        sections["dataset_overview"] = {
            "name": dataset.name,
            "filename": dataset.original_filename,
            "format": dataset.file_format,
            "rows": dataset.row_count,
            "columns": dataset.column_count,
            "column_types": {col: meta.get("dtype") for col, meta in dataset.column_metadata.items()},
        }

        # 2. Cleaning operations
        if req.include_cleaning:
            cleaning_runs = [r for r in runs if r.analysis_type == "cleaning"]
            sections["cleaning_operations"] = [
                {
                    "date": r.created_at.isoformat(),
                    "parameters": r.parameters,
                    "summary": r.result_summary,
                }
                for r in cleaning_runs
            ]

        # 3. Statistical Analysis
        if req.include_statistics:
            stat_runs = [r for r in runs if r.analysis_type == "statistics"]
            sections["statistical_findings"] = [
                {
                    "date": r.created_at.isoformat(),
                    "summary": r.result_summary,
                }
                for r in stat_runs
            ]

        # 4. Visualizations
        if req.include_visualizations:
            viz_runs = [r for r in runs if r.analysis_type == "visualization"]
            sections["visualizations"] = [
                {
                    "chart_type": r.parameters.get("chart_type"),
                    "title": r.parameters.get("title"),
                    "date": r.created_at.isoformat(),
                }
                for r in viz_runs
            ]

        # 5. Machine Learning Models
        if req.include_models:
            sections["machine_learning_models"] = [
                {
                    "id": str(m.id),
                    "task_type": m.task_type,
                    "algorithm": m.algorithm,
                    "target_column": m.target_column,
                    "feature_columns": m.feature_columns,
                    "metrics": m.metrics,
                    "trained_at": m.created_at.isoformat(),
                    "leakage_warnings": m.configuration.get("leakage_warnings", []),
                }
                for m in models
            ]

        # 6. Academic Conclusion and Limitations
        sections["academic_conclusions"] = {
            "computed_facts_vs_inferences": (
                "All statistical metrics and model evaluations shown above were directly computed "
                "using NumPy, SciPy, Pandas, and Scikit-Learn. Interpretations are educational aids."
            ),
            "limitations": [
                "Correlation values quantify linear associations and do not prove causal relationships.",
                "Model metrics reflect generalization on the held-out test split under independent and identically distributed (i.i.d.) assumptions.",
                "Potential sampling biases in the original dataset may affect downstream conclusions.",
            ],
            "student_notes": req.notes or "No additional notes provided.",
        }

        report_id = uuid.uuid4().hex
        report_file = settings.REPORT_DIR / f"{report_id}.json"
        now_str = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")

        full_payload = {
            "report_id": report_id,
            "dataset_name": dataset.name,
            "dataset_id": str(dataset.id),
            "student_email": user.email,
            "generated_at": now_str,
            "sections": sections,
        }

        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(full_payload, f, indent=2)

        return ReportResponse(
            report_id=report_id,
            dataset_name=dataset.name,
            dataset_id=dataset.id,
            generated_at=now_str,
            student_email=user.email,
            sections=sections,
            download_url=f"/api/v1/reports/{report_id}/download",
        )
