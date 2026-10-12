import uuid
from typing import Any

import joblib
import pandas as pd
from app.ml.evaluation import (
    check_target_leakage,
    evaluate_classification,
    evaluate_regression,
)
from app.ml.preprocessing import build_preprocessor, identify_column_types
from app.storage.file_storage import storage_service
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


def train_and_evaluate_model(
    df: pd.DataFrame,
    target_column: str,
    feature_columns: list[str],
    task_type: str,
    algorithm: str,
    test_size: float = 0.2,
    random_state: int = 42,
) -> tuple[dict[str, Any], dict[str, float] | None, list[str], str]:
    """Trains a supervised model using scikit-learn Pipeline with ColumnTransformer,
    evaluates generalization on test split, and persists the pipeline safely.
    """
    # Filter target column out of features if mistakenly provided
    clean_features = [f for f in feature_columns if f != target_column and f in df.columns]
    if not clean_features:
        raise ValueError("At least one valid feature column distinct from target is required.")

    # Target leakage checks
    leakage_warnings = check_target_leakage(df, target_column, feature_columns, task_type)

    # Drop missing target values
    clean_df = df.dropna(subset=[target_column])
    X = clean_df[clean_features]
    y = clean_df[target_column]

    if len(X) < 10:
        raise ValueError("Dataset must have at least 10 valid rows for model training.")

    # Determine stratification for classification
    stratify = None
    if task_type == "classification":
        val_counts = y.value_counts()
        # Stratify only if each class has at least 2 occurrences
        if (val_counts >= 2).all() and len(val_counts) > 1:
            stratify = y

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=stratify
    )

    numeric_features, categorical_features = identify_column_types(X, clean_features)
    preprocessor = build_preprocessor(numeric_features, categorical_features)

    # Instantiate estimator
    if task_type == "classification":
        if algorithm == "random_forest":
            estimator = RandomForestClassifier(n_estimators=100, random_state=random_state, n_jobs=1)
        else:
            estimator = LogisticRegression(max_iter=1000, random_state=random_state)
    else:  # regression
        if algorithm == "random_forest":
            estimator = RandomForestRegressor(n_estimators=100, random_state=random_state, n_jobs=1)
        else:
            estimator = LinearRegression()

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", estimator),
    ])

    # Fit exclusively on training set to avoid data leakage
    pipeline.fit(X_train, y_train)

    # Predict and evaluate on test set
    y_pred = pipeline.predict(X_test)

    if task_type == "classification":
        metrics = evaluate_classification(y_test, y_pred)
    else:
        metrics = evaluate_regression(y_test, y_pred)

    # Compute Feature Importances if applicable
    feature_importances: dict[str, float] | None = None
    try:
        model_step = pipeline.named_steps["model"]
        if hasattr(model_step, "feature_importances_"):
            raw_importances = model_step.feature_importances_
            # Map back to transformed feature names
            cat_names = []
            if categorical_features:
                cat_encoder = pipeline.named_steps["preprocessor"].named_transformers_["cat"].named_steps["onehot"]
                cat_names = cat_encoder.get_feature_names_out(categorical_features).tolist()
            all_feature_names = numeric_features + cat_names

            if len(all_feature_names) == len(raw_importances):
                feat_dict = {
                    name: round(float(imp), 4)
                    for name, imp in zip(all_feature_names, raw_importances)
                }
                # Top 10 sorted
                sorted_feats = sorted(feat_dict.items(), key=lambda item: item[1], reverse=True)[:10]
                feature_importances = dict(sorted_feats)
    except Exception:
        feature_importances = None

    # Persist pipeline to protected artifact storage
    artifact_key = f"{uuid.uuid4().hex}.joblib"
    artifact_path = storage_service.artifact_dir / artifact_key
    joblib.dump(pipeline, artifact_path)

    return metrics, feature_importances, leakage_warnings, artifact_key
