# AI Smart Tutor — API Reference Documentation

Base URL: `/api/v1`

Interactive OpenAPI Docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/register`
Creates a new student account.
- **Request Body:**
  ```json
  {
    "email": "student@university.edu",
    "password": "StrongPassword123!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "uuid-string",
    "email": "student@university.edu",
    "role": "student",
    "is_active": true,
    "created_at": "2026-10-12T14:00:00Z"
  }
  ```

### `POST /auth/login`
Authenticates user, issues random 256-bit token, sets HttpOnly session cookie, and returns session response.
- **Request Body:**
  ```json
  {
    "email": "student@university.edu",
    "password": "StrongPassword123!"
  }
  ```
- **Response Headers:**
  - `Set-Cookie: smart_tutor_session=...; HttpOnly; SameSite=Lax`
  - `X-Session-Token: <token>`
- **Response (200 OK):**
  ```json
  {
    "authenticated": true,
    "user": { ... }
  }
  ```

### `POST /auth/logout`
Revokes active server-side session and clears session cookie.

### `GET /auth/me`
Retrieves authenticated user profile.

### `POST /auth/change-password`
Updates user password via Argon2id and revokes all other active sessions.

---

## 2. Datasets (`/api/v1/datasets`)

### `POST /datasets`
Uploads a new CSV or JSON dataset. Multipart form data with `file` and optional `name`.

### `GET /datasets`
Lists all datasets owned by the current student.

### `GET /datasets/{dataset_id}`
Retrieves dataset metadata (row count, column count, column datatypes).

### `DELETE /datasets/{dataset_id}`
Permanently deletes dataset record and disk storage.

### `GET /datasets/{dataset_id}/preview?page=1&page_size=15`
Returns paginated row records for table inspection.

### `GET /datasets/{dataset_id}/summary`
Computes statistical summary, duplicate row count, missing values per feature, and IQR-based potential outliers.

---

## 3. Data Cleaning, Visualization & Statistics

### `POST /datasets/{dataset_id}/clean`
Applies user-selected cleaning operations:
- `drop_duplicates`: boolean
- `missing_numeric_strategy`: `"mean" | "median" | "drop" | "none"`
- `missing_categorical_strategy`: `"mode" | "drop" | "none"`
- `remove_outliers`: boolean
- `outlier_method`: `"iqr" | "zscore"`
- `save_as_new`: boolean

### `POST /datasets/{dataset_id}/visualizations`
Renders server-side Matplotlib/Seaborn visualization.
- Supported `chart_type`: `"histogram" | "bar" | "box" | "scatter" | "line" | "heatmap" | "pairplot"`
- Returns: `{ "image_base64": "data:image/png;base64,...", "educational_notes": "...", "suggested_questions": [...] }`

### `POST /datasets/{dataset_id}/statistics`
Computes parametric and non-parametric descriptive statistics, skewness, kurtosis, correlation matrix, and optional hypothesis test:
- `hypothesis_test`: `"shapiro_wilk" | "two_sample_ttest" | "pearson" | "chi_square"`

---

## 4. Machine Learning (`/api/v1`)

### `POST /datasets/{dataset_id}/models/train`
Trains a scikit-learn Pipeline with ColumnTransformer:
```json
{
  "target_column": "churn",
  "feature_columns": ["age", "tenure", "monthly_charges"],
  "task_type": "classification",
  "algorithm": "random_forest",
  "test_size": 0.2,
  "random_state": 42
}
```
Returns evaluation metrics, feature importances, and target leakage warnings.

### `POST /models/{model_id}/predict`
Executes real-time inference on input feature dictionaries using the saved pipeline.

---

## 5. AI Tutor & Reports

### `POST /conversations` & `GET /conversations`
Manage student study sessions.

### `POST /conversations/{conversation_id}/messages`
Send questions to AI Tutor. Supported modes: `"guided"`, `"direct"`, `"quiz"`. Optional `dataset_id` for grounded context.

### `POST /datasets/{dataset_id}/reports` & `GET /reports/{report_id}/download`
Generates and downloads formal academic reports.
