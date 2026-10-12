from uuid import UUID

import joblib
import pandas as pd
from app.db.models.entities import MLModel, User
from app.ml.training import train_and_evaluate_model
from app.schemas.models import PredictRequest, PredictResponse, TrainModelRequest
from app.services.dataset_service import DatasetService
from app.storage.file_storage import storage_service
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class MLService:
    @staticmethod
    def train(db: Session, dataset_id: UUID, user: User, req: TrainModelRequest) -> MLModel:
        dataset = DatasetService.get_dataset(db, dataset_id, user)
        df = storage_service.load_dataset(dataset.storage_key, dataset.file_format)

        if req.target_column not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Target column '{req.target_column}' does not exist in dataset."
            )

        for f in req.feature_columns:
            if f not in df.columns:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Feature column '{f}' does not exist in dataset."
                )

        try:
            metrics, feature_importances, leakage_warnings, artifact_key = train_and_evaluate_model(
                df=df,
                target_column=req.target_column,
                feature_columns=req.feature_columns,
                task_type=req.task_type,
                algorithm=req.algorithm,
                test_size=req.test_size,
                random_state=req.random_state,
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Model training error: {e!s}"
            )

        config = {
            "test_size": req.test_size,
            "random_state": req.random_state,
            "leakage_warnings": leakage_warnings,
            "feature_importances": feature_importances,
        }

        model_record = MLModel(
            owner_id=user.id,
            dataset_id=dataset.id,
            task_type=req.task_type,
            algorithm=req.algorithm,
            target_column=req.target_column,
            feature_columns=req.feature_columns,
            metrics=metrics,
            configuration=config,
            artifact_key=artifact_key,
            status="completed",
        )
        db.add(model_record)
        db.commit()
        db.refresh(model_record)
        return model_record

    @staticmethod
    def get_models(db: Session, user: User) -> list[MLModel]:
        query = db.query(MLModel)
        if user.role != "admin":
            query = query.filter(MLModel.owner_id == user.id)
        return query.order_by(MLModel.created_at.desc()).all()

    @staticmethod
    def get_model(db: Session, model_id: UUID, user: User) -> MLModel:
        model = db.query(MLModel).filter(MLModel.id == model_id).first()
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found."
            )
        if model.owner_id != user.id and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Model not found."
            )
        return model

    @staticmethod
    def predict(db: Session, model_id: UUID, user: User, req: PredictRequest) -> PredictResponse:
        model = MLService.get_model(db, model_id, user)
        artifact_path = storage_service.get_artifact_path(model.artifact_key)

        if not artifact_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trained model artifact is missing from storage."
            )

        # Safe loading of internally created artifact
        pipeline = joblib.load(artifact_path)
        input_df = pd.DataFrame(req.inputs)

        # Validate that required features exist in input
        missing_features = [f for f in model.feature_columns if f not in input_df.columns]
        if missing_features:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing feature columns in prediction input: {missing_features}"
            )

        try:
            raw_preds = pipeline.predict(input_df[model.feature_columns])
            preds_list = [round(float(p), 4) if isinstance(p, (float, int)) else str(p) for p in raw_preds]
            return PredictResponse(
                model_id=model.id,
                predictions=preds_list,
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inference error: {e!s}"
            )
