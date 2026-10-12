# AI Smart Tutor — System Architecture

## 1. System Overview
The **AI Smart Tutor — Data Exploration and Visualization Laboratory** is a full-stack educational web application designed for university B.Tech Computer Engineering students. It delivers hands-on, interactive learning of Python, Pandas, NumPy, Matplotlib, Seaborn, exploratory data analysis (EDA), statistics, and scikit-learn machine learning, integrated with Generative AI teaching assistance grounded in verified backend calculations.

```
+---------------------------------------------------------------------------------+
|                                React Frontend                                   |
|   (TypeScript, Vite, Tailwind CSS v4, Lucide Icons, TanStack Query, React Router)|
+---------------------------------------------------------------------------------+
                                       |
                   HTTP REST / JSON / Session Cookies
                                       v
+---------------------------------------------------------------------------------+
|                               FastAPI Backend                                   |
|   - API Routers (/api/v1/auth, /datasets, /analysis, /models, /tutor, /reports)  |
|   - Security Layer (Argon2id, Session Hashing, CSRF, Rate Limiting, Ownership)   |
+---------------------------------------------------------------------------------+
          |                                  |                         |
          v                                  v                         v
+-----------------------+        +-----------------------+   +-------------------+
|    Database Layer     |        |   Private Storage     |   | Generative AI     |
| - PostgreSQL / SQLite |        | - /uploads (CSV/JSON) |   | - Provider Bridge |
| - SQLAlchemy 2.x      |        | - /artifacts (.joblib)|   | - Grounded Context|
| - Alembic Migrations  |        | - /reports (JSON/MD)  |   | - 3 Tutor Modes   |
+-----------------------+        +-----------------------+   +-------------------+
```

---

## 2. Layered Backend Design
The Python backend enforces a strict separation of concerns across layers:

1. **API Routing Layer (`app/api/v1/`)**:
   - Manages versioned HTTP REST endpoints.
   - Pydantic v2 schemas for request and response validation.
   - Dependency injection for authentication (`get_current_user`), authorization (`require_admin`), database sessions, and rate limiting.

2. **Service Layer (`app/services/`)**:
   - Encapsulates all domain and business logic.
   - `auth_service.py`: User registration, session creation/rotation, Argon2id hashing, and audit trails.
   - `dataset_service.py`: File validation, pagination, row/column limits, and statistical summary calculation.
   - `cleaning_service.py`: Missing value imputation (mean/median/mode/drop), deduplication, and outlier filtering (IQR/Z-Score).
   - `visualization_service.py`: Headless Matplotlib/Seaborn rendering, base64 PNG generation, and educational takeaways.
   - `statistics_service.py`: Parametric and non-parametric stats, skewness, kurtosis, Pearson correlation matrix, and SciPy hypothesis tests.
   - `ml_service.py`: Scikit-learn Pipeline orchestration, metrics calculation, and inference sandbox.
   - `tutor_service.py`: LLM conversation management, history trimming, and prompt grounding.
   - `report_service.py`: Formal academic report compilation.

3. **Machine Learning Pipeline (`app/ml/`)**:
   - `preprocessing.py`: Builds leakage-free `ColumnTransformer` (median imputation + `StandardScaler` for numeric features; mode imputation + `OneHotEncoder` for categorical features).
   - `training.py`: Stratified train/test splitting prior to fitting. Trains Random Forest and linear baseline estimators. Computes Gini feature importances.
   - `evaluation.py`: Computes test-set metrics (Accuracy, Precision, Recall, F1, Confusion Matrix for classification; MAE, MSE, RMSE, R² for regression). Runs target leakage heuristics.

4. **Storage Layer (`app/storage/`)**:
   - Abstract `StorageService` managing private local filesystem directories (expandable to S3).
   - Sanitizes filenames, enforces strict path-traversal validation, and mitigates CSV spreadsheet formula injection.

---

## 3. Grounded LLM Tutor Architecture
To prevent hallucinations and fabricated metrics:
1. When a student chats with the tutor regarding a dataset, the backend extracts actual computed metadata (dimensions, null counts, duplicate counts, feature distributions, and trained model metrics).
2. This factual data is injected into a protected system instruction segment:
   `[GROUND TRUTH DATASET CONTEXT]`
3. The LLM is explicitly constrained to adhere to these facts.
4. **Teaching Modes**:
   - **Guided Learning**: Socratic inquiry, conceptual prompts, hints.
   - **Direct Explanation**: Rigorous theoretical definitions and reproducible Python code snippets.
   - **Quiz & Viva Mode**: Multiple-choice questions, code output puzzles, and university viva preparation.
5. **Resilient Fallback**: If no API key is configured or the provider experiences a timeout, the backend automatically transitions to the built-in `OfflineEducatorProvider` without crashing.
