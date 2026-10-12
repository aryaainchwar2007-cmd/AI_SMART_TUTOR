from typing import Any
from uuid import UUID

import numpy as np
import pandas as pd
from app.db.models.entities import AnalysisRun, User
from app.schemas.analysis import StatisticsRequest, StatisticsResponse
from app.services.dataset_service import DatasetService
from app.storage.file_storage import storage_service
from fastapi import HTTPException, status
from scipy import stats
from sqlalchemy.orm import Session


class StatisticsService:
    @staticmethod
    def compute_statistics(
        db: Session, dataset_id: UUID, user: User, req: StatisticsRequest
    ) -> StatisticsResponse:
        dataset = DatasetService.get_dataset(db, dataset_id, user)
        df = storage_service.load_dataset(dataset.storage_key, dataset.file_format)

        num_df = df.select_dtypes(include=[np.number])
        if req.columns:
            selected_cols = [c for c in req.columns if c in num_df.columns]
            if selected_cols:
                num_df = num_df[selected_cols]

        descriptive_stats: dict[str, dict[str, Any]] = {}
        skew_kurt: dict[str, dict[str, float]] = {}

        for col in num_df.columns:
            s = num_df[col].dropna()
            if len(s) > 0:
                mean_val = float(s.mean())
                median_val = float(s.median())
                mode_res = s.mode()
                mode_val = float(mode_res.iloc[0]) if not mode_res.empty else mean_val
                var_val = float(s.var()) if len(s) > 1 else 0.0
                std_val = float(s.std()) if len(s) > 1 else 0.0
                q25 = float(s.quantile(0.25))
                q75 = float(s.quantile(0.75))
                iqr_val = q75 - q25

                descriptive_stats[str(col)] = {
                    "count": int(s.count()),
                    "mean": round(mean_val, 4),
                    "median": round(median_val, 4),
                    "mode": round(mode_val, 4),
                    "variance": round(var_val, 4),
                    "std_dev": round(std_val, 4),
                    "q25": round(q25, 4),
                    "q75": round(q75, 4),
                    "iqr": round(iqr_val, 4),
                    "min": round(float(s.min()), 4),
                    "max": round(float(s.max()), 4),
                }

                skew_val = float(s.skew()) if len(s) > 2 else 0.0
                kurt_val = float(s.kurtosis()) if len(s) > 3 else 0.0
                skew_kurt[str(col)] = {
                    "skewness": round(skew_val, 4),
                    "kurtosis": round(kurt_val, 4),
                    "skew_interpretation": (
                        "Approximately symmetric" if abs(skew_val) < 0.5
                        else ("Moderately right-skewed" if skew_val > 0 else "Moderately left-skewed")
                    )
                }

        # Correlation matrix (limit to 15 columns for clarity)
        corr_cols = num_df.columns[:15]
        corr_matrix: dict[str, dict[str, float | None]] = {}
        if len(corr_cols) > 0:
            raw_corr = num_df[corr_cols].corr()
            for r in corr_cols:
                corr_matrix[str(r)] = {}
                for c in corr_cols:
                    val = raw_corr.loc[r, c]
                    corr_matrix[str(r)][str(c)] = round(float(val), 4) if not pd.isna(val) else None

        hypothesis_result: dict[str, Any] | None = None

        if req.hypothesis_test:
            if req.hypothesis_test == "shapiro_wilk":
                col = req.col1 or (num_df.columns[0] if len(num_df.columns) > 0 else None)
                if not col or col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Shapiro-Wilk test requires a valid numeric column."
                    )
                sample = df[col].dropna()
                # Shapiro-Wilk supports sample sizes between 3 and 5000
                if len(sample) < 3:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="At least 3 observations are required for Shapiro-Wilk test."
                    )
                if len(sample) > 5000:
                    sample = sample.sample(5000, random_state=42)

                stat, p_val = stats.shapiro(sample)
                is_normal = p_val > 0.05
                hypothesis_result = {
                    "test_name": "Shapiro-Wilk Test for Normality",
                    "column": col,
                    "sample_size": len(sample),
                    "test_statistic": round(float(stat), 5),
                    "p_value": round(float(p_val), 5),
                    "alpha": 0.05,
                    "null_hypothesis": f"The data in '{col}' is normally distributed.",
                    "alternative_hypothesis": f"The data in '{col}' deviates significantly from a normal distribution.",
                    "decision": "Fail to reject H0 (Data looks normal)" if is_normal else "Reject H0 (Data is non-normal)",
                    "assumptions": "Assumes continuous observations randomly sampled from population.",
                }

            elif req.hypothesis_test == "two_sample_ttest":
                c1 = req.col1
                c2 = req.col2
                if not c1 or not c2 or c1 not in df.columns or c2 not in df.columns:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Two-sample t-test requires two valid column names."
                    )
                s1 = df[c1].dropna()
                s2 = df[c2].dropna()
                if len(s1) < 2 or len(s2) < 2:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Each sample must contain at least 2 observations."
                    )
                stat, p_val = stats.ttest_ind(s1, s2, equal_var=False)
                sig_diff = p_val < 0.05
                hypothesis_result = {
                    "test_name": "Welch's Two-Sample Independent t-Test",
                    "column_1": c1,
                    "column_2": c2,
                    "mean_1": round(float(s1.mean()), 4),
                    "mean_2": round(float(s2.mean()), 4),
                    "test_statistic": round(float(stat), 5),
                    "p_value": round(float(p_val), 5),
                    "alpha": 0.05,
                    "null_hypothesis": f"The mean of '{c1}' equals the mean of '{c2}'.",
                    "alternative_hypothesis": f"The mean of '{c1}' is significantly different from '{c2}'.",
                    "decision": "Reject H0 (Significant difference in means)" if sig_diff else "Fail to reject H0 (No significant difference)",
                    "assumptions": "Assumes continuous variables. Welch's test does not assume equal population variances.",
                }

            elif req.hypothesis_test == "pearson":
                c1 = req.col1
                c2 = req.col2
                if not c1 or not c2 or c1 not in num_df.columns or c2 not in num_df.columns:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Pearson correlation test requires two numeric columns."
                    )
                paired = df[[c1, c2]].dropna()
                if len(paired) < 3:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Pearson correlation test requires at least 3 paired observations."
                    )
                r, p_val = stats.pearsonr(paired[c1], paired[c2])
                hypothesis_result = {
                    "test_name": "Pearson Correlation Significance Test",
                    "column_1": c1,
                    "column_2": c2,
                    "correlation_coefficient": round(float(r), 4),
                    "p_value": round(float(p_val), 5),
                    "alpha": 0.05,
                    "null_hypothesis": f"There is no linear correlation (rho = 0) between '{c1}' and '{c2}'.",
                    "alternative_hypothesis": f"A statistically significant linear correlation exists between '{c1}' and '{c2}'.",
                    "decision": "Reject H0 (Correlation is statistically significant)" if p_val < 0.05 else "Fail to reject H0",
                    "reminder": "Important: Correlation indicates linear association; it does NOT prove causation."
                }

            elif req.hypothesis_test == "chi_square":
                c1 = req.col1
                c2 = req.col2
                if not c1 or not c2 or c1 not in df.columns or c2 not in df.columns:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Chi-square test requires two categorical columns."
                    )
                contingency = pd.crosstab(df[c1].astype(str), df[c2].astype(str))
                if contingency.size < 4:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Contingency table must have at least 2x2 dimensions."
                    )
                chi2, p_val, dof, _ = stats.chi2_contingency(contingency)
                hypothesis_result = {
                    "test_name": "Chi-Square Test of Independence",
                    "categorical_1": c1,
                    "categorical_2": c2,
                    "chi2_statistic": round(float(chi2), 4),
                    "degrees_of_freedom": int(dof),
                    "p_value": round(float(p_val), 5),
                    "alpha": 0.05,
                    "null_hypothesis": f"'{c1}' and '{c2}' are independent.",
                    "alternative_hypothesis": f"'{c1}' and '{c2}' are dependent (associated).",
                    "decision": "Reject H0 (Variables are dependent/associated)" if p_val < 0.05 else "Fail to reject H0 (Variables appear independent)",
                    "assumptions": "Adequate expected frequencies (ideally >= 5 per cell).",
                }

        educational_guide = (
            "Statistical analysis provides rigorous quantitative foundation for data science. "
            "Descriptive statistics measure central tendency and dispersion. "
            "Skewness measures distribution asymmetry, while kurtosis indicates tail heaviness. "
            "Hypothesis testing lets you establish if observed patterns are unlikely to have arisen by random chance alone."
        )

        # Log analysis run
        run = AnalysisRun(
            owner_id=user.id,
            dataset_id=dataset.id,
            analysis_type="statistics",
            parameters=req.model_dump(),
            result_summary={
                "features_analyzed": len(num_df.columns),
                "hypothesis_test": req.hypothesis_test,
            },
            status="completed",
        )
        db.add(run)
        db.commit()

        return StatisticsResponse(
            descriptive_statistics=descriptive_stats,
            skewness_kurtosis=skew_kurt,
            correlation_matrix=corr_matrix,
            hypothesis_test_result=hypothesis_result,
            educational_guide=educational_guide,
        )
