import base64
import io
from uuid import UUID

import matplotlib

matplotlib.use("Agg")  # Thread-safe headless backend
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from app.db.models.entities import AnalysisRun, User
from app.schemas.analysis import VisualizationRequest, VisualizationResponse
from app.services.dataset_service import DatasetService
from app.storage.file_storage import storage_service
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class VisualizationService:
    @staticmethod
    def generate_chart(
        db: Session, dataset_id: UUID, user: User, req: VisualizationRequest
    ) -> VisualizationResponse:
        dataset = DatasetService.get_dataset(db, dataset_id, user)
        df = storage_service.load_dataset(dataset.storage_key, dataset.file_format)

        plt.clf()
        plt.close("all")
        sns.set_theme(style="whitegrid", palette="deep")
        fig, ax = plt.subplots(figsize=(9, 5.5), dpi=120)

        educational_notes = ""
        suggested_questions: list[str] = []

        try:
            if req.chart_type == "histogram":
                col = req.x_column or df.select_dtypes(include=[np.number]).columns[0]
                if col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Column '{col}' must be numeric for a histogram."
                    )
                sns.histplot(df[col].dropna(), kde=True, bins=req.bins or 20, ax=ax, color="#3b82f6")
                ax.set_title(req.title or f"Distribution of {col}", fontsize=13, fontweight="bold", pad=12)
                ax.set_xlabel(col, fontsize=11)
                ax.set_ylabel("Frequency", fontsize=11)

                educational_notes = (
                    "Histograms display the frequency distribution of a continuous variable. "
                    "Look for symmetry, skewness (left or right tail), and modality (single vs multiple peaks)."
                )
                suggested_questions = [
                    f"Is {col} normally distributed or skewed?",
                    f"Are there visible outliers or multiple clusters in {col}?",
                    "How would a log or standard scaling transformation change this distribution?"
                ]

            elif req.chart_type == "bar":
                col = req.x_column or df.select_dtypes(exclude=[np.number]).columns[0]
                if col not in df.columns:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Column '{col}' not found in dataset."
                    )
                top_data = df[col].value_counts().head(12)
                sns.barplot(x=top_data.index.astype(str), y=top_data.values, ax=ax, palette="Blues_r")
                ax.set_title(req.title or f"Frequency of Categories in {col}", fontsize=13, fontweight="bold", pad=12)
                ax.set_xlabel(col, fontsize=11)
                ax.set_ylabel("Count", fontsize=11)
                plt.xticks(rotation=35, ha="right")

                educational_notes = (
                    "Bar charts and countplots show categorical frequencies. They reveal class imbalances, "
                    "dominant groups, and rare categories."
                )
                suggested_questions = [
                    f"Is there class imbalance in {col}?",
                    "Could rare categories cause problems during machine learning one-hot encoding?",
                ]

            elif req.chart_type == "box":
                y_col = req.y_column or req.x_column or df.select_dtypes(include=[np.number]).columns[0]
                x_col = req.x_column if req.y_column else None

                if y_col not in df.columns or not pd.api.types.is_numeric_dtype(df[y_col]):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Column '{y_col}' must be numeric for boxplot."
                    )
                sns.boxplot(data=df, x=x_col, y=y_col, ax=ax, palette="Set2")
                ax.set_title(req.title or f"Boxplot of {y_col}" + (f" by {x_col}" if x_col else ""), fontsize=13, fontweight="bold", pad=12)
                ax.set_ylabel(y_col, fontsize=11)
                if x_col:
                    ax.set_xlabel(x_col, fontsize=11)
                    plt.xticks(rotation=30, ha="right")

                educational_notes = (
                    "Boxplots illustrate the 5-number summary: Min, Q1 (25th percentile), Median (50th), "
                    "Q3 (75th percentile), and Max. Points beyond 1.5 * IQR are flagged as potential outliers."
                )
                suggested_questions = [
                    f"Are there points plotted beyond the whiskers in {y_col}?",
                    "How does the median compare between groups?",
                ]

            elif req.chart_type == "scatter":
                num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                if len(num_cols) < 2:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Scatterplot requires at least 2 numeric columns."
                    )
                x_col = req.x_column or num_cols[0]
                y_col = req.y_column or num_cols[1]
                hue = req.hue_column if (req.hue_column and req.hue_column in df.columns) else None

                sns.scatterplot(data=df, x=x_col, y=y_col, hue=hue, ax=ax, alpha=0.75, s=60)
                ax.set_title(req.title or f"{x_col} vs {y_col}", fontsize=13, fontweight="bold", pad=12)
                ax.set_xlabel(x_col, fontsize=11)
                ax.set_ylabel(y_col, fontsize=11)

                educational_notes = (
                    "Scatterplots display bivariate relationships. Look for linear or non-linear trends, "
                    "clustering, and heteroscedasticity (varying dispersion)."
                )
                suggested_questions = [
                    f"Does an increase in {x_col} associate with an increase or decrease in {y_col}?",
                    "Is the relationship linear, or does it saturate/curve?",
                ]

            elif req.chart_type == "line":
                num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                x_col = req.x_column or df.columns[0]
                y_col = req.y_column or (num_cols[0] if num_cols else df.columns[1])

                sns.lineplot(data=df, x=x_col, y=y_col, ax=ax, marker="o", color="#10b981")
                ax.set_title(req.title or f"Trend: {y_col} over {x_col}", fontsize=13, fontweight="bold", pad=12)
                ax.set_xlabel(x_col, fontsize=11)
                ax.set_ylabel(y_col, fontsize=11)
                plt.xticks(rotation=30, ha="right")

                educational_notes = (
                    "Line plots connect sequential data points, ideal for tracking trends over time, "
                    "epochs, or ordered indices."
                )
                suggested_questions = [
                    "Is there a discernible upward or downward trend?",
                    "Are there periodic seasonality patterns or sharp anomalies?",
                ]

            elif req.chart_type == "heatmap":
                num_df = df.select_dtypes(include=[np.number])
                if num_df.shape[1] < 2:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Correlation heatmap requires at least 2 numeric features."
                    )
                # Bound maximum columns to 12 to maintain readability and performance
                if num_df.shape[1] > 12:
                    num_df = num_df.iloc[:, :12]

                corr = num_df.corr()
                sns.heatmap(
                    corr, annot=True, fmt=".2f", cmap="coolwarm", vmin=-1, vmax=1,
                    square=True, ax=ax, cbar_kws={"shrink": 0.8}
                )
                ax.set_title(req.title or "Correlation Heatmap (Pearson r)", fontsize=13, fontweight="bold", pad=12)
                plt.xticks(rotation=45, ha="right")

                educational_notes = (
                    "The Pearson correlation heatmap quantifies pairwise linear relationships between -1 and +1. "
                    "Values close to +1 or -1 indicate strong linear association; values near 0 imply no linear association. "
                    "Remember: Correlation does NOT prove causation."
                )
                suggested_questions = [
                    "Which pairs of features exhibit strong correlation (|r| > 0.7)?",
                    "Could high multicollinearity affect a regression model's coefficients?",
                ]

            elif req.chart_type == "pairplot":
                # Pairplot uses a distinct grid figure
                plt.close(fig)
                num_cols = req.columns or df.select_dtypes(include=[np.number]).columns[:4].tolist()
                if len(num_cols) < 2 or len(num_cols) > 5:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Pairplot requires between 2 and 5 numeric columns to ensure responsive rendering."
                    )
                hue = req.hue_column if (req.hue_column and req.hue_column in df.columns) else None
                sample_df = df[num_cols + ([hue] if hue else [])].dropna()
                if len(sample_df) > 500:
                    sample_df = sample_df.sample(500, random_state=42)

                g = sns.pairplot(sample_df, hue=hue, corner=True, palette="tab10")
                g.figure.suptitle(req.title or "Feature Pairplot Matrix", y=1.02, fontsize=14, fontweight="bold")
                fig = g.figure

                educational_notes = (
                    "A pairplot plots pairwise bivariate distributions on off-diagonals and univariate distributions "
                    "on the diagonal, providing a bird's-eye view of multidimensional feature interactions."
                )
                suggested_questions = [
                    "Can you visually separate classes using 2 or 3 of these features?",
                    "Do any variables share non-linear relationships?",
                ]

            fig.tight_layout()
            buf = io.BytesIO()
            fig.savefig(buf, format="png", bbox_inches="tight", dpi=120)
            buf.seek(0)
            image_base64 = base64.b64encode(buf.read()).decode("utf-8")
            plt.close(fig)

            # Record visualization analysis run
            run = AnalysisRun(
                owner_id=user.id,
                dataset_id=dataset.id,
                analysis_type="visualization",
                parameters=req.model_dump(),
                result_summary={"chart_type": req.chart_type},
                status="completed",
            )
            db.add(run)
            db.commit()

            return VisualizationResponse(
                chart_type=req.chart_type,
                image_base64=f"data:image/png;base64,{image_base64}",
                educational_notes=educational_notes,
                suggested_questions=suggested_questions,
            )

        except HTTPException:
            plt.close("all")
            raise
        except Exception as e:
            plt.close("all")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Chart rendering error: {e!s}"
            )
