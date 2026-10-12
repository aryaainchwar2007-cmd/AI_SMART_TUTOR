from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)


def evaluate_classification(y_true, y_pred) -> dict[str, Any]:
    """Computes standard multi-class and binary classification metrics."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()

    unique_classes = [str(c) for c in np.unique(np.concatenate([y_true, y_pred]))]

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": cm,
        "classes": unique_classes,
    }


def evaluate_regression(y_true, y_pred) -> dict[str, Any]:
    """Computes standard regression evaluation metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))

    return {
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4),
        "r2_score": round(r2, 4),
    }


def check_target_leakage(
    df, target_col: str, feature_cols: list[str], task_type: str
) -> list[str]:
    """Heuristic check to detect potential target leakage."""
    warnings = []

    if target_col in feature_cols:
        warnings.append(
            f"Target variable '{target_col}' was found in feature columns! "
            f"This creates direct circular target leakage."
        )

    # Check for near-identical columns or extreme correlation with continuous target
    if task_type == "regression" and pd.api.types.is_numeric_dtype(df[target_col]):
        for col in feature_cols:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                corr = df[[col, target_col]].dropna().corr().iloc[0, 1]
                if abs(corr) >= 0.98:
                    warnings.append(
                        f"Feature '{col}' exhibits suspicious correlation (|r| = {round(abs(corr), 3)}) "
                        f"with target '{target_col}'. Verify this is not a proxy or calculated derivative."
                    )

    return warnings
