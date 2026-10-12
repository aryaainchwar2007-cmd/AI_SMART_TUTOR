
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def identify_column_types(df: pd.DataFrame, feature_columns: list[str]) -> tuple[list[str], list[str]]:
    """Separates feature columns into numeric and categorical lists."""
    numeric_features = []
    categorical_features = []

    for col in feature_columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            numeric_features.append(col)
        else:
            categorical_features.append(col)

    return numeric_features, categorical_features


def build_preprocessor(numeric_features: list[str], categorical_features: list[str]) -> ColumnTransformer:
    """Constructs a scikit-learn ColumnTransformer that prevents data leakage.
    Numeric features: median imputation + StandardScaler.
    Categorical features: mode imputation + OneHotEncoder(handle_unknown='ignore').
    """
    transformers = []

    if numeric_features:
        num_pipeline = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ])
        transformers.append(("num", num_pipeline, numeric_features))

    if categorical_features:
        cat_pipeline = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])
        transformers.append(("cat", cat_pipeline, categorical_features))

    return ColumnTransformer(transformers=transformers, remainder="drop")
