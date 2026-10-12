from typing import Any

from app.db.models.entities import (
    AnalysisRun,
    Conversation,
    Dataset,
    LearningProgress,
    MLModel,
    User,
)
from app.schemas.progress import ProgressRecordCreate
from sqlalchemy.orm import Session


class ProgressService:
    @staticmethod
    def record_progress(db: Session, user: User, req: ProgressRecordCreate) -> LearningProgress:
        record = LearningProgress(
            owner_id=user.id,
            topic=req.topic,
            activity_type=req.activity_type,
            score=req.score,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_progress(db: Session, user: User) -> list[LearningProgress]:
        return db.query(LearningProgress).filter(
            LearningProgress.owner_id == user.id
        ).order_by(LearningProgress.completed_at.desc()).all()

    @staticmethod
    def get_dashboard_stats(db: Session, user: User) -> dict[str, Any]:
        """Calculates personalized dashboard metrics from authorized backend data."""
        dataset_count = db.query(Dataset).filter(Dataset.owner_id == user.id).count()
        analysis_count = db.query(AnalysisRun).filter(AnalysisRun.owner_id == user.id).count()
        model_count = db.query(MLModel).filter(MLModel.owner_id == user.id).count()
        conversation_count = db.query(Conversation).filter(Conversation.owner_id == user.id).count()
        progress_items = db.query(LearningProgress).filter(LearningProgress.owner_id == user.id).all()

        recent_datasets = (
            db.query(Dataset)
            .filter(Dataset.owner_id == user.id)
            .order_by(Dataset.created_at.desc())
            .limit(5)
            .all()
        )
        recent_models = (
            db.query(MLModel)
            .filter(MLModel.owner_id == user.id)
            .order_by(MLModel.created_at.desc())
            .limit(5)
            .all()
        )

        completed_topics = list({p.topic for p in progress_items})

        return {
            "dataset_count": dataset_count,
            "analysis_count": analysis_count,
            "model_count": model_count,
            "conversation_count": conversation_count,
            "completed_topics": completed_topics,
            "recent_datasets": [
                {"id": str(d.id), "name": d.name, "rows": d.row_count, "cols": d.column_count, "created_at": d.created_at.isoformat()}
                for d in recent_datasets
            ],
            "recent_models": [
                {"id": str(m.id), "algorithm": m.algorithm, "task_type": m.task_type, "target": m.target_column, "created_at": m.created_at.isoformat()}
                for m in recent_models
            ],
        }
