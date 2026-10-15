# 🎓 AI Smart Tutor — Data Exploration and Visualization Laboratory

[![Python Version](https://img.shields.io/badge/Python-3.12%20%7C%203.14-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-14%20Passed-brightgreen)](https://docs.pytest.org/)
[![Code Style: Ruff](https://img.shields.io/badge/Code%20Style-Ruff-000000?logo=ruff&logoColor=white)](https://docs.astral.sh/ruff/)

An end-to-end, production-grade educational web application engineered for university **B.Tech Computer Engineering** students. The system teaches **Python, Pandas, NumPy, Matplotlib, Seaborn, exploratory data analysis, statistics, and scikit-learn machine learning** through hands-on dataset experimentation, paired with a Generative AI Smart Tutor grounded in verified backend calculations.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Official PCCOE Report Guidelines & Blueprint](#-official-pccoe-report-guidelines--blueprint)
- [System Architecture](#-system-architecture)
- [Key Features & Laboratories](#-key-features--laboratories)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Local Setup & Installation](#-local-setup--installation)
- [Docker Compose Deployment](#-docker-compose-deployment)
- [Automated Testing & Quality](#-automated-testing--quality)
- [Sample Datasets & Notebooks](#-sample-datasets--notebooks)
- [Security & Privacy](#-security--privacy)
- [API Reference](#-api-reference)
- [Contributing & License](#-contributing--license)

---

## 📄 Official PCCOE Report Guidelines & Blueprint

For B.Tech Computer Engineering students preparing their official **20–30 page DE&VL Mini-Project Report** according to **PCET's Pimpri Chinchwad College of Engineering (PCCOE)** departmental specifications, a dedicated guide and complete blueprint is available in:

👉 **[`REPORT_README.md`](REPORT_README.md)**

It contains:
- **Typography & Layout Constraints:** Times New Roman, 12 pt, 1.5 line spacing, 5-space indentation, double space between paragraphs, exact A4 margins (Top: 23.4mm, Left: 37mm, Bottom: 32mm, Right: 23.4mm).
- **Official Templates:** Verbatim Cover Page, Certificate, Acknowledgement, and Abstract.
- **Table of Contents & Blueprint:** Complete chapters 01 to 07 matching the college syllabus with architecture diagrams, algorithms, and evaluation results.
- **Turnitin / iThenticate Plagiarism Standards:** Official grading brackets (< 10% Excellent, < 40% maximum allowable).
- **Ready-to-Compile LaTeX Template:** Complete `report.tex` template with pre-configured headers, footers, and margins.

---

## 🎯 Overview

Academic data science education often relies on disconnected scripts or static notebooks where students lack instant, personalized conceptual feedback. **AI Smart Tutor** solves this by providing:

1. **A Real Full-Stack Laboratory**: Real Python operations executing server-side—no fake numbers, no client-side simulation.
2. **Pedagogical AI Grounding**: An AI Tutor strictly conditioned on actual calculated dataset statistics, eliminating hallucinations and aligning with university curriculum goals.
3. **Reproducible Engineering Standards**: Strict separation between exploratory data analysis, data cleaning, statistical hypothesis testing, and leakage-free machine learning pipelines.

---

## 🏛️ System Architecture

```
+---------------------------------------------------------------------------------+
|                               React 19 Frontend                                 |
|  - TypeScript • Vite • Tailwind CSS v4 • Lucide Icons • TanStack React Query    |
|  - Persistent Lab Navigation Sidebar • Real-time Form & Inference Validations   |
+---------------------------------------------------------------------------------+
                                       │
                         REST API / JSON / Session Cookies
                                       ▼
+---------------------------------------------------------------------------------+
|                               FastAPI Backend                                   |
|  - Authentication & Session Rotation Layer (Argon2id, SHA-256 Tokens)           |
|  - Resource Ownership Validation & RBAC (Student vs. Administrator)             |
|  - Scientific Processing Engine (Pandas, NumPy, SciPy, Matplotlib, Seaborn)     |
|  - Supervised ML Pipeline (scikit-learn ColumnTransformer & Pipelines)          |
+---------------------------------------------------------------------------------+
          │                                  │                         │
          ▼                                  ▼                         ▼
+-----------------------+        +-----------------------+   +-------------------+
|    Database Layer     |        |   Private Storage     |   | Generative AI     |
| - PostgreSQL / SQLite |        | - /uploads (CSV/JSON) |   | - Multi-Provider  |
| - SQLAlchemy 2.x      |        | - /artifacts (.joblib)|   | - Grounded Prompt |
| - Alembic Migrations  |        | - /reports (JSON/MD)  |   | - 3 Tutor Modes   |
+-----------------------+        +-----------------------+   +-------------------+
```

---

## 🧪 Key Features & Laboratories

### 1. 📁 Dataset Explorer & Inspector
- Supports CSV and JSON file uploads with format validation, row limits (50k), and column limits (100).
- Automatic schema inspection: column data types, non-null counts, unique values, and sample items.
- Duplicate row detection and IQR-based potential outlier flagging.
- Interactive paginated data grid (configurable page size).
- Secure deletion purging both database records and private disk storage.

### 2. 🧹 Data Cleaning Laboratory
- Detects missing cells, redundant duplicate observations, and distribution outliers.
- Configurable numeric imputation: Median (outlier-robust), Mean, or Drop.
- Categorical imputation: Mode (most frequent) or Drop.
- Outlier filtering using the $1.5 \times \text{IQR}$ rule or Z-Score ($|z| > 3.0$).
- Option to save as a distinct cleaned dataset or update in place with explicit confirmation.
- Displays comprehensive before-and-after audit summaries.

### 3. 📈 Scientific Visualization Lab
- Backend headless rendering via **Matplotlib** and **Seaborn** with professional aesthetics (`whitegrid`).
- Supported charts:
  - **Histograms** with Kernel Density Estimation (KDE) and configurable binning.
  - **Countplots & Bar Charts** for categorical class balance inspection.
  - **Boxplots** displaying the 5-number summary (Min, Q1, Median, Q3, Max) and outlier dots.
  - **Bivariate Scatterplots** with optional category hue grouping.
  - **Line Charts** for sequential trend tracking.
  - **Pearson Correlation Heatmaps** annotated with coefficients from $-1.0$ to $+1.0$.
  - **Pairplot Matrices** bounded to 5 features and 500 sampled rows to maintain fast response times.
- Serves safe base64 PNG data URLs accompanied by pedagogical concept notes and student inquiry questions.

### 4. 🧮 Statistical Analysis & Hypothesis Testing
- Comprehensive parametric and non-parametric statistics: Mean, Median, Mode, Variance, Standard Deviation, IQR.
- Distribution shape metrics: Skewness (asymmetry) and Kurtosis (tail-heaviness).
- Pearson correlation matrix across numerical features with explicit causation warnings.
- Interactive hypothesis tests via **SciPy**:
  - **Welch's Two-Sample t-Test**: Tests difference in means without assuming equal variances.
  - **Chi-Square Test of Independence**: Tests association between categorical features.
  - **Shapiro-Wilk Test**: Tests normality of continuous variables.
  - **Pearson Correlation Test**: Evaluates statistical significance ($p$-value) of linear associations.
- Automatically outputs null hypothesis ($H_0$), alternative hypothesis ($H_1$), test statistic, $p$-value, and decision at $\alpha = 0.05$.

### 5. 🤖 Leakage-Free Machine Learning Lab
- Target variable and feature selection for Classification and Regression.
- Enforces strict train/test splitting before any preprocessing or fitting to eliminate data leakage.
- Constructs scikit-learn `Pipeline` and `ColumnTransformer`:
  - Numeric transformer: `SimpleImputer(strategy='median')` + `StandardScaler()`
  - Categorical transformer: `SimpleImputer(strategy='most_frequent')` + `OneHotEncoder(handle_unknown='ignore')`
- Algorithms: Baseline linear models (Logistic/Linear Regression) and Random Forests (100 estimators).
- Comprehensive metrics:
  - **Classification**: Accuracy, Precision, Recall, F1-Score, and Confusion Matrix.
  - **Regression**: MAE, MSE, RMSE, and $R^2$ Score.
- Gini feature importances extraction.
- Automatic target leakage heuristic warning against circular dependencies.
- Interactive inference sandbox: enter custom values and obtain instant predictions using the serialized pipeline artifact.

### 6. 💡 Grounded AI Smart Tutor
- Multi-mode academic assistant:
  - **Guided Learning (Socratic)**: Hints, leading questions, and step-by-step prompts.
  - **Direct Explanation**: Mathematical definitions and idiomatic Python code snippets.
  - **Quiz & Viva Mode**: Multiple-choice questions, code output puzzles, and university viva exam preparation.
- Grounded Prompting: Automatically injects factual dataset statistics and model metrics into the system prompt.
- Multi-provider support: Google Gemini, OpenAI, or the built-in **Offline Educational Tutor** that works with zero external API keys.

### 7. 📄 Academic Reports & Export
- Generates downloadable, comprehensive academic lab reports.
- Aggregates preprocessing operations, statistical findings, visualizations, and model evaluations.
- Clearly distinguishes computed mathematical facts from AI-generated pedagogical notes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, PostgreSQL, SQLite, Uvicorn |
| **Data & ML** | Pandas, NumPy, SciPy, Scikit-Learn, Matplotlib, Seaborn, Joblib |
| **Security** | Argon2id (`argon2-cffi`), Cryptographic Sessions, CSRF, Path Traversal Escaping |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, TanStack Query, Lucide Icons |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX, Ruff |
| **DevOps** | Docker, Docker Compose, Nginx, Multi-stage builds |

---

## 📂 Project Structure

```
AI_SMART_TUTOR/
├── backend/
│   ├── alembic/              # Database migration environments and versions
│   ├── app/
│   │   ├── api/              # Dependencies and REST v1 routers
│   │   │   └── v1/           # auth, datasets, analysis, models, tutor, reports, progress
│   │   ├── core/             # Pydantic settings, Argon2id security, logging
│   │   ├── db/               # SQLAlchemy engine, cross-platform GUID, entity models
│   │   ├── integrations/llm/ # Gemini, OpenAI, and Offline fallback adapters
│   │   ├── ml/               # ColumnTransformer preprocessors, training, evaluation
│   │   ├── schemas/          # Pydantic v2 request/response validation schemas
│   │   ├── services/         # Domain business logic services
│   │   ├── storage/          # Path-traversal-safe storage engine
│   │   └── main.py           # FastAPI application entry point
│   ├── tests/                # 14 comprehensive Pytest test cases
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/              # Fetch API client with session management
│   │   ├── context/          # Authentication context & provider
│   │   ├── layouts/          # Academic sidebar navigation layout
│   │   ├── pages/            # 11 interactive React pages
│   │   ├── types/            # TypeScript data contracts
│   │   ├── App.tsx           # Route declarations & protection
│   │   └── index.css         # Tailwind CSS v4 directives
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── data/                     # Benchmark datasets (Iris, Student Performance, Churn)
├── notebooks/                # B.Tech lab notebooks (EDA, Viz, ML Training)
├── docs/                     # Architecture, API, Security, Database guides
├── docker-compose.yml        # Multi-container orchestration
├── pyproject.toml            # Ruff linter & Pytest configurations
├── pytest.ini
├── .env.example
└── README.md
```

---

## ⚡ Local Setup & Installation

### Prerequisites
- Python 3.12 or higher (Python 3.12 - 3.14 supported)
- Node.js 20+ and npm
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/aryaainchwar2007-cmd/AI_SMART_TUTOR.git
cd AI_SMART_TUTOR
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
*(The default configuration works out of the box with SQLite and the offline academic tutor.)*

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python -m alembic upgrade head

# Start FastAPI server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 4. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
- Open `http://127.0.0.1:5173` in your browser.

---

## 🐳 Docker Compose Deployment

To deploy the entire production stack (PostgreSQL 16 + FastAPI + Nginx-served React):

```bash
docker compose up --build
```
- **Web Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Database**: PostgreSQL on port 5432 (Internal network)

---

## 🧪 Automated Testing & Quality

### Run the Test Suite
```bash
python -m pytest backend/tests -v
```
**Test Coverage Includes:**
- User registration, Argon2id hashing, session login, logout, and password rotation.
- File upload parsing, MIME checks, size limits, and empty-file rejection.
- **Strict Cross-User Isolation**: User B attempting to read, modify, or delete User A's datasets/models returns `404 Not Found`.
- Data cleaning: Median/Mean/Mode imputation, duplicate dropping, and IQR outlier removal.
- Matplotlib/Seaborn image generation.
- SciPy hypothesis testing (t-test, normality, correlations).
- Machine learning training, ColumnTransformer leakage prevention, and model inference.
- AI Tutor conversation persistence and grounded context.

### Run Code Linter
```bash
python -m ruff check backend
```

---

## 📊 Sample Datasets & Notebooks

Pre-loaded benchmark datasets in [`data/`](file:///c:/Users/lenovo/OneDrive/Desktop/DEVL_PROJECT/data):
- [`data/iris.csv`](file:///c:/Users/lenovo/OneDrive/Desktop/DEVL_PROJECT/data/iris.csv): Classification benchmark (Sepal/Petal dimensions across 3 species).
- [`data/student_performance.csv`](file:///c:/Users/lenovo/OneDrive/Desktop/DEVL_PROJECT/data/student_performance.csv): Academic performance dataset with realistic missing values and duplicate records for data cleaning experiments.
- [`data/customer_churn.csv`](file:///c:/Users/lenovo/OneDrive/Desktop/DEVL_PROJECT/data/customer_churn.csv): Mixed numerical and categorical features for one-hot encoding and ML pipelines.

Companion Jupyter notebooks in [`notebooks/`](file:///c:/Users/lenovo/OneDrive/Desktop/DEVL_PROJECT/notebooks):
- `01_data_exploration.ipynb`: EDA, missing values, descriptive statistics, and IQR outliers.
- `02_visualization.ipynb`: Matplotlib and Seaborn visualization styling and interpretations.
- `03_model_training.ipynb`: Scikit-learn ColumnTransformer and Pipeline training without data leakage.

---

## 🔐 Security & Privacy

- **Argon2id Hashing**: Industry-standard cryptographic password hashing with 64 MB memory cost.
- **Opaque Sessions**: SHA-256 hashed 256-bit random tokens in `HttpOnly`, `SameSite=Lax` cookies.
- **Resource Ownership**: Checked server-side on every query; cross-user attempts return `404` to prevent resource enumeration.
- **Formula Injection Mitigation**: Escapes `=, +, -, @` in exported CSVs to prevent spreadsheet formula execution.
- **No Untrusted Execution**: Zero `eval()` or `exec()`. Model pipelines are loaded strictly from protected server directories.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. Built for educational and academic research use in Computer Science & Engineering.