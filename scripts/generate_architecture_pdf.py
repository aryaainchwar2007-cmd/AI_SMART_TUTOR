"""
generate_architecture_pdf.py
Generates a comprehensive, professional, publication-quality System Architecture PDF
for the AI Smart Tutor — Data Exploration and Visualization Laboratory.
Designed for PCET's Pimpri Chinchwad College of Engineering (PCCOE).
"""

import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute total pages and render
    consistent, professional running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4B5563"))

        page_w, page_h = A4

        # Header (Pages 2 onwards)
        if self._pageNumber > 1:
            self.drawString(
                37 * mm,
                page_h - 18 * mm,
                "AI Smart Tutor — System Architecture & Technical Design Specification"
            )
            self.drawRightString(
                page_w - 23.4 * mm,
                page_h - 18 * mm,
                "B.Tech DE&VL Laboratory"
            )
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(37 * mm, page_h - 20 * mm, page_w - 23.4 * mm, page_h - 20 * mm)

        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(37 * mm, 24 * mm, page_w - 23.4 * mm, 24 * mm)

        self.drawString(
            37 * mm,
            18 * mm,
            "PCCOE, Department of Computer Engineering • Academic Year 2026-27"
        )
        self.drawRightString(
            page_w - 23.4 * mm,
            18 * mm,
            f"Page {self._pageNumber} of {total_pages}"
        )

        self.restoreState()


def build_architecture_pdf(output_path: str):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)

    # Document setup adhering to PCCOE margins: Left=37mm, Right=23.4mm, Top=23.4mm, Bottom=32mm
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=37 * mm,
        rightMargin=23.4 * mm,
        topMargin=25 * mm,
        bottomMargin=30 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom color palette
    c_primary = colors.HexColor("#0F2942")     # Deep Corporate Navy
    c_secondary = colors.HexColor("#0284C7")   # Cobalt Sky Blue
    c_accent = colors.HexColor("#0D9488")      # Teal Accent
    c_dark = colors.HexColor("#1F2937")        # Charcoal text
    c_muted = colors.HexColor("#64748B")       # Muted slate
    c_bg_light = colors.HexColor("#F8FAFC")    # Card / Table background
    c_border = colors.HexColor("#E2E8F0")      # Neutral border

    # Custom Paragraph Styles
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_primary,
        alignment=TA_CENTER,
        spaceAfter=12
    )

    style_cover_sub = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_secondary,
        alignment=TA_CENTER,
        spaceAfter=20
    )

    style_h1 = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    style_h3 = ParagraphStyle(
        'Header3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_accent,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=c_dark,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )

    style_bullet = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_dark,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    style_code = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=4,
        spaceAfter=4
    )

    style_table_hdr = ParagraphStyle(
        'TableHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_dark
    )

    style_callout = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E3A8A"),
        alignment=TA_LEFT
    )

    content = []

    # -------------------------------------------------------------
    # COVER / TITLE BLOCK
    # -------------------------------------------------------------
    content.append(Spacer(1, 15))
    content.append(Paragraph("AI SMART TUTOR — SYSTEM ARCHITECTURE", style_cover_title))
    content.append(Paragraph("Comprehensive Technical Design & Architectural Blueprint for Full-Stack Laboratory", style_cover_sub))
    
    # Metadata Badge Table
    meta_data = [
        [
            Paragraph("<b>Institution:</b> PCET's Pimpri Chinchwad College of Engineering (PCCOE), Pune", style_table_cell),
            Paragraph("<b>Class:</b> Third Year B.Tech (Computer Engineering)", style_table_cell)
        ],
        [
            Paragraph("<b>Course:</b> Data Exploration & Visualization Lab (DE&VL)", style_table_cell),
            Paragraph("<b>Academic Year:</b> 2026–2027", style_table_cell)
        ],
        [
            Paragraph("<b>Stack:</b> FastAPI • React 19 • PostgreSQL/SQLite • Scikit-Learn • Gemini", style_table_cell),
            Paragraph("<b>Document Version:</b> 1.0 (Production Architecture)", style_table_cell)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[80 * mm, 69 * mm])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 1, c_secondary),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(t_meta)
    content.append(Spacer(1, 14))

    # Executive Summary Callout
    exec_summary_text = (
        "<b>Architectural Directive:</b> The AI Smart Tutor is engineered as an enterprise-grade, "
        "reproducible, and pedagogically grounded full-stack system. It replaces fragmented notebook "
        "environments with a strictly verified three-tier architecture. All computations—including "
        "descriptive statistics, outlier detection, data imputation, server-side visual generation, "
        "and scikit-learn ML training—occur strictly within authorized Python services. The embedded "
        "AI Tutor is strictly grounded in verified runtime facts, preventing mathematical hallucination."
    )
    t_callout = Table([[Paragraph(exec_summary_text, style_callout)]], colWidths=[149 * mm])
    t_callout.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#93C5FD")),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(t_callout)
    content.append(Spacer(1, 14))

    # -------------------------------------------------------------
    # SECTION 1: CORE ARCHITECTURAL PRINCIPLES
    # -------------------------------------------------------------
    content.append(Paragraph("1. Core Architectural Principles", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))
    
    content.append(Paragraph(
        "The architecture is designed around four non-negotiable engineering principles:",
        style_body
    ))
    content.append(Paragraph("<b>1. Server-Side Computation Exclusivity:</b> The frontend is strictly an interactive view and command dispatcher. No data cleaning, statistical evaluation, or model training is permitted in browser JavaScript. This ensures reproducibility, security, and consistent execution.", style_bullet))
    content.append(Paragraph("<b>2. Zero Arbitrary Code Execution:</b> To guarantee complete server safety, students do not submit unvetted Python code strings for execution. All operations are executed through hardened, parameterized Python service functions using verified libraries.", style_bullet))
    content.append(Paragraph("<b>3. Pedagogical Fact-Grounding:</b> The AI Tutor is prohibited from hallucinating dataset values or evaluation scores. The backend computes verified statistical summaries and model records first, injecting them directly into the LLM system prompt.", style_bullet))
    content.append(Paragraph("<b>4. Leakage-Free ML Design:</b> Supervised machine learning workflows enforce strict train/test splitting prior to fitting scalers, encoders, or imputers via scikit-learn Pipelines and ColumnTransformers.", style_bullet))

    content.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # SECTION 2: END-TO-END THREE-TIER ARCHITECTURE
    # -------------------------------------------------------------
    content.append(Paragraph("2. Three-Tier System Topology", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "The system decouples presentation, application business logic, and persistent storage into three distinct physical and logical layers:",
        style_body
    ))

    # Three tier table breakdown
    tier_table_data = [
        [
            Paragraph("<b>Tier</b>", style_table_hdr),
            Paragraph("<b>Technologies</b>", style_table_hdr),
            Paragraph("<b>Core Responsibilities & Components</b>", style_table_hdr)
        ],
        [
            Paragraph("<b>Tier 1:<br/>Presentation</b>", style_table_cell),
            Paragraph("• React 19 SPA<br/>• TypeScript 5.4<br/>• Vite 5<br/>• Tailwind CSS v4<br/>• Lucide Icons", style_table_cell),
            Paragraph("• Interactive Student Workbench & Sidebar Navigation<br/>• TanStack Query state caching & optimistic UI<br/>• Client-side validation & unified ApiClient interceptor<br/>• Responsive chart viewers, tables & chat interface", style_table_cell)
        ],
        [
            Paragraph("<b>Tier 2:<br/>Application & Services</b>", style_table_cell),
            Paragraph("• FastAPI 0.110+<br/>• Python 3.12 LTS<br/>• Pydantic v2<br/>• Uvicorn ASGI<br/>• Argon2-cffi<br/>• Gemini SDK", style_table_cell),
            Paragraph("• REST API v1 routing & dependency injection<br/>• Argon2id authentication & sliding session rotation<br/>• Pandas/NumPy EDA & IQR anomaly detection engine<br/>• Matplotlib/Seaborn headless chart rendering<br/>• Scikit-learn Pipeline model training & metrics<br/>• Grounded Socratic AI Tutor service", style_table_cell)
        ],
        [
            Paragraph("<b>Tier 3:<br/>Persistence & Storage</b>", style_table_cell),
            Paragraph("• PostgreSQL 16<br/>• SQLite fallback<br/>• SQLAlchemy 2.0<br/>• Alembic<br/>• Local Secure FS", style_table_cell),
            Paragraph("• Relational storage: Users, Sessions, Datasets, Runs, Models, Conversations, Progress<br/>• Private file store: /storage/uploads (raw files)<br/>• Artifact store: /storage/artifacts (PNG charts)<br/>• Report store: /storage/reports (PDF/MD downloads)", style_table_cell)
        ]
    ]

    t_tier = Table(tier_table_data, colWidths=[32 * mm, 38 * mm, 79 * mm])
    t_tier.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(t_tier)

    content.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 3: FRONTEND PRESENTATION ARCHITECTURE
    # -------------------------------------------------------------
    content.append(Paragraph("3. Frontend Presentation Tier Architecture", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "The frontend is structured as a modern Single Page Application (SPA) maximizing student engagement through responsive layouts, instant feedback, and accessible UI controls.",
        style_body
    ))

    content.append(Paragraph("3.1 Component Hierarchy & Route Mapping", style_h2))
    content.append(Paragraph(
        "The application leverages React Router v7 with declarative route protection. Unauthenticated requests are redirected to the Login/Registration portal, while authenticated sessions are wrapped inside the persistent <code>DashboardLayout</code> shell.",
        style_body
    ))

    # Route Table
    routes_data = [
        [
            Paragraph("<b>Page / View</b>", style_table_hdr),
            Paragraph("<b>Route URI</b>", style_table_hdr),
            Paragraph("<b>Interactive Features & Capabilities</b>", style_table_hdr)
        ],
        [
            Paragraph("Landing Page", style_table_cell),
            Paragraph("<code>/</code>", style_table_cell),
            Paragraph("Public portal, feature showcases, curriculum alignment, CTA links.", style_table_cell)
        ],
        [
            Paragraph("Auth Pages", style_table_cell),
            Paragraph("<code>/login, /register</code>", style_table_cell),
            Paragraph("Argon2id credential forms, clean validation errors, session bootstrapping.", style_table_cell)
        ],
        [
            Paragraph("Dashboard", style_table_cell),
            Paragraph("<code>/dashboard</code>", style_table_cell),
            Paragraph("Metrics overview, owned datasets, recent runs, models, quick actions.", style_table_cell)
        ],
        [
            Paragraph("Dataset Explorer", style_table_cell),
            Paragraph("<code>/explorer</code>", style_table_cell),
            Paragraph("CSV/JSON upload, schema preview, pagination, null/duplicate profiling.", style_table_cell)
        ],
        [
            Paragraph("Cleaning Lab", style_table_cell),
            Paragraph("<code>/cleaning</code>", style_table_cell),
            Paragraph("Configurable mean/median/mode imputation, deduplication, IQR outlier audit.", style_table_cell)
        ],
        [
            Paragraph("Visualization Lab", style_table_cell),
            Paragraph("<code>/visualization</code>", style_table_cell),
            Paragraph("Server-rendered Matplotlib/Seaborn plots, parameter selectors, image viewer.", style_table_cell)
        ],
        [
            Paragraph("Statistical Lab", style_table_cell),
            Paragraph("<code>/statistics</code>", style_table_cell),
            Paragraph("Hypothesis testing, Pearson correlations, ANOVA, p-value educational notes.", style_table_cell)
        ],
        [
            Paragraph("ML Modeling Lab", style_table_cell),
            Paragraph("<code>/ml-lab</code>", style_table_cell),
            Paragraph("Target/feature selection, classification/regression, confusion matrix, metrics.", style_table_cell)
        ],
        [
            Paragraph("AI Tutor Portal", style_table_cell),
            Paragraph("<code>/tutor</code>", style_table_cell),
            Paragraph("3 Teaching modes (Guided, Direct, Quiz), streaming history, prompt hints.", style_table_cell)
        ],
        [
            Paragraph("Report Hub", style_table_cell),
            Paragraph("<code>/reports</code>", style_table_cell),
            Paragraph("Laboratory run aggregation, downloadable Markdown and PDF generation.", style_table_cell)
        ]
    ]

    t_routes = Table(routes_data, colWidths=[35 * mm, 34 * mm, 80 * mm])
    t_routes.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    content.append(t_routes)
    content.append(Spacer(1, 8))

    content.append(Paragraph("3.2 Unified API Client Architecture (`client.ts`)", style_h2))
    content.append(Paragraph(
        "All network interactions are centralized inside a singleton <code>ApiClient</code> class providing:",
        style_body
    ))
    content.append(Paragraph("• <b>Dual Authentication Handling:</b> Automatically attaches Bearer tokens in the <code>Authorization</code> header and custom <code>X-Session-Token</code> headers while supporting <code>credentials: 'include'</code> for HttpOnly cookies.", style_bullet))
    content.append(Paragraph("• <b>Smart Serialization:</b> Automatically infers <code>application/json</code> payloads while passing raw <code>FormData</code> untouched for binary multipart file uploads.", style_bullet))
    content.append(Paragraph("• <b>Error Unpacking:</b> Unpacks FastAPI Pydantic validation errors (array of field-level errors) into user-friendly diagnostic messages.", style_bullet))
    content.append(Paragraph("• <b>Automatic Session Teardown:</b> Intercepts HTTP 401 Unauthorized responses to purge stale tokens and prompt clean re-authentication.", style_bullet))

    content.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # SECTION 4: APPLICATION TIER (FASTAPI BACKEND)
    # -------------------------------------------------------------
    content.append(Paragraph("4. Backend Application & Service Architecture", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "The backend is developed purely in Python 3.12 utilizing FastAPI for high-concurrency asynchronous route handling and strict type enforcement via Pydantic v2 schemas.",
        style_body
    ))

    content.append(Paragraph("4.1 Request Lifecycle & Middleware Pipeline", style_h2))
    content.append(Paragraph(
        "When an incoming HTTP request enters Uvicorn, it traverses a structured defense-in-depth pipeline:",
        style_body
    ))
    content.append(Paragraph("<b>1. CORS Middleware:</b> Restricts cross-origin requests exclusively to whitelisted frontend development and production origins (e.g., ports 5173 and 3000).", style_bullet))
    content.append(Paragraph("<b>2. Security Headers Middleware:</b> Automatically injects <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: DENY</code>, <code>X-XSS-Protection: 1; mode=block</code>, and strict referrer policies on every response.", style_bullet))
    content.append(Paragraph("<b>3. Dependency Injection Layer (`dependencies.py`):</b> Resolves database sessions via <code>get_db</code>, validates session tokens, checks expiration timestamps, and extracts the verified <code>current_user</code> context.", style_bullet))
    content.append(Paragraph("<b>4. Route Handlers & Validation:</b> Validates input payloads against Pydantic models. Rejects malformed requests before executing service code.", style_bullet))
    content.append(Paragraph("<b>5. Global Exception Handlers:</b> Catches internal errors without exposing database query strings or server stack traces to clients.", style_bullet))

    content.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 5: SPECIALIZED SCIENTIFIC & ML ENGINES
    # -------------------------------------------------------------
    content.append(Paragraph("5. Scientific Computation & Machine Learning Engines", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "The system incorporates dedicated Python computational engines built on top of NumPy, Pandas, Matplotlib, Seaborn, and Scikit-Learn.",
        style_body
    ))

    content.append(Paragraph("5.1 Data Cleaning & Preprocessing Engine (`cleaning_service.py`)", style_h2))
    content.append(Paragraph(
        "The cleaning service provides idempotent data transformations while preserving raw files:",
        style_body
    ))
    content.append(Paragraph("• <b>Imputation:</b> Supports median and mean imputation for continuous variables and mode imputation for categorical attributes.", style_bullet))
    content.append(Paragraph("• <b>Deduplication:</b> Detects exact duplicate records, reporting before-and-after cardinalities.", style_bullet))
    content.append(Paragraph("• <b>IQR Anomaly Detection:</b> Computes first quartile ($Q_1$), third quartile ($Q_3$), and fences ($[Q_1 - 1.5\\times\\text{IQR}, Q_3 + 1.5\\times\\text{IQR}]$) to quantify and safely handle outliers.", style_bullet))

    content.append(Paragraph("5.2 Visualization Engine (`visualization_service.py`)", style_h2))
    content.append(Paragraph(
        "To avoid GUI thread contention on web servers, the visualization engine configures Matplotlib in headless <code>Agg</code> mode. Supported chart families include:",
        style_body
    ))
    content.append(Paragraph("• <b>Univariate:</b> Histograms with Kernel Density Estimation (KDE), bar charts, and countplots.", style_bullet))
    content.append(Paragraph("• <b>Bivariate:</b> Scatterplots with trendlines, boxplots by category, and multi-line time series.", style_bullet))
    content.append(Paragraph("• <b>Multivariate:</b> Correlation heatmaps with annotated Pearson coefficients and bounded pairplots.", style_bullet))
    content.append(Paragraph(
        "All figures are saved to isolated private storage (<code>/storage/artifacts/</code>) and streamed to the client via secure, authorized endpoint routes with custom caching headers.",
        style_body
    ))

    content.append(Paragraph("5.3 Leak-Free Machine Learning Pipeline (`ml_service.py`)", style_h2))
    content.append(Paragraph(
        "In introductory data science education, data leakage is the most prevalent error. AI Smart Tutor systematically prevents leakage through the following pipeline architecture:",
        style_body
    ))

    # Pipeline stages table
    ml_steps_data = [
        [Paragraph("<b>Pipeline Stage</b>", style_table_hdr), Paragraph("<b>Implementation & Safeguard Mechanism</b>", style_table_hdr)],
        [
            Paragraph("1. Target Leakage Validation", style_table_cell),
            Paragraph("Verifies that the student-selected target variable is strictly excluded from feature matrix $X$.", style_table_cell)
        ],
        [
            Paragraph("2. Isolated Data Splitting", style_table_cell),
            Paragraph("Performs <code>train_test_split</code> (80/20) with fixed random seed and stratification prior to computing any summary statistics.", style_table_cell)
        ],
        [
            Paragraph("3. ColumnTransformer Assembly", style_table_cell),
            Paragraph("• Numerical: <code>SimpleImputer(strategy='median')</code> -> <code>StandardScaler()</code><br/>• Categorical: <code>SimpleImputer(strategy='most_frequent')</code> -> <code>OneHotEncoder(handle_unknown='ignore')</code>", style_table_cell)
        ],
        [
            Paragraph("4. Unified Model Fitting", style_table_cell),
            Paragraph("Assembles composite <code>Pipeline([('preprocessor', preprocessor), ('model', estimator)])</code>. Fits strictly on $(X_{\\text{train}}, Y_{\\text{train}})$.", style_table_cell)
        ],
        [
            Paragraph("5. Metric Extraction", style_table_cell),
            Paragraph("Evaluates on $X_{\\text{test}}$: Classification (Accuracy, Precision, Recall, F1, Confusion Matrix); Regression (MAE, RMSE, $R^2$).", style_table_cell)
        ]
    ]
    t_ml = Table(ml_steps_data, colWidths=[45 * mm, 104 * mm])
    t_ml.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(t_ml)

    content.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # SECTION 6: AI TUTOR ENGINE & GROUNDING
    # -------------------------------------------------------------
    content.append(Paragraph("6. Generative AI Tutor & Grounded Pedagogical Engine", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "The AI Tutor is built upon an isolated LLM Provider Gateway supporting Google Gemini (with model fallbacks) and an educational deterministic mock engine. The tutor architecture resolves common LLM deficiencies:",
        style_body
    ))

    content.append(Paragraph("6.1 Grounded Context Injection Pipeline", style_h2))
    content.append(Paragraph(
        "Before dispatching any user prompt to the LLM, the backend queries the database for the student's active dataset metadata, calculated descriptive statistics, and model parameters. This context payload is serialized into JSON and injected into the system prompt with strict negative constraints:",
        style_body
    ))

    prompt_box = (
        "<b>System Prompt Directive:</b><br/>"
        "\"You are the AI Smart Tutor for PCCOE Computer Engineering students. "
        "You are strictly conditioned on the verified dataset facts provided below. "
        "Do NOT invent or extrapolate statistics, correlation coefficients, or model metrics. "
        "If the user asks for a calculation that is not present in the verified context, explicitly "
        "direct them to run that specific analysis in the laboratory workbench.\""
    )
    t_prompt = Table([[Paragraph(prompt_box, style_code)]], colWidths=[149 * mm])
    t_prompt.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 1, c_secondary),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    content.append(t_prompt)
    content.append(Spacer(1, 6))

    content.append(Paragraph("6.2 Pedagogical Modes of Operation", style_h2))
    content.append(Paragraph("• <b>Guided Learning Mode:</b> Employs the Socratic method. Instead of spitting out direct solutions, the tutor asks thought-provoking questions, pointing out skewness or distribution shape.", style_bullet))
    content.append(Paragraph("• <b>Direct Explanation Mode:</b> Provides rigorous, syntax-accurate explanations of NumPy/Pandas operations, Matplotlib layout parameters, or Scikit-learn algorithms.", style_bullet))
    content.append(Paragraph("• <b>Quiz & Viva Mode:</b> Generates multiple-choice and conceptual viva examination questions derived directly from the student's dataset metrics and trained model results.", style_bullet))

    content.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 7: DATABASE & STORAGE ARCHITECTURE
    # -------------------------------------------------------------
    content.append(Paragraph("7. Database Design & Entity Relationship Architecture", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "The persistence layer utilizes SQLAlchemy 2.0 ORM with asynchronous capabilities, targeting PostgreSQL 16 in production with seamless SQLite local testing compatibility. All entities utilize tamper-proof UUID primary keys.",
        style_body
    ))

    # Entities table
    entities_data = [
        [
            Paragraph("<b>Entity Table</b>", style_table_hdr),
            Paragraph("<b>Key Attributes & Datatypes</b>", style_table_hdr),
            Paragraph("<b>Constraints & Relationships</b>", style_table_hdr)
        ],
        [
            Paragraph("<code>users</code>", style_table_cell),
            Paragraph("id (UUID), email (String, unique), password_hash (String), role (Enum), is_active (Bool)", style_table_cell),
            Paragraph("Primary user registry. Enforces email uniqueness and Argon2id hash storage.", style_table_cell)
        ],
        [
            Paragraph("<code>sessions</code>", style_table_cell),
            Paragraph("id (UUID), user_id (FK), token_hash (String), expires_at (DateTime), revoked_at", style_table_cell),
            Paragraph("Stateful session tracking. Supports sliding expiry and instant logout revocation.", style_table_cell)
        ],
        [
            Paragraph("<code>datasets</code>", style_table_cell),
            Paragraph("id (UUID), owner_id (FK), name (String), storage_key, file_format, row_count, col_metadata (JSON)", style_table_cell),
            Paragraph("Tracks uploaded files, row/column cardinality, and cached schema profile.", style_table_cell)
        ],
        [
            Paragraph("<code>analysis_runs</code>", style_table_cell),
            Paragraph("id (UUID), dataset_id (FK), run_type (Enum), parameters (JSON), results (JSON), artifact_path", style_table_cell),
            Paragraph("Historical ledger of all cleaning operations, statistical tests, and chart runs.", style_table_cell)
        ],
        [
            Paragraph("<code>ml_models</code>", style_table_cell),
            Paragraph("id (UUID), dataset_id (FK), model_type, target_col, features (JSON), metrics (JSON), artifact_key", style_table_cell),
            Paragraph("Stores serialized trained pipelines, evaluation scores, and confusion matrix.", style_table_cell)
        ],
        [
            Paragraph("<code>tutor_conversations</code>", style_table_cell),
            Paragraph("id (UUID), user_id (FK), dataset_id (FK), title, messages (JSON), mode (Enum)", style_table_cell),
            Paragraph("Persists full conversation turns, system prompts, and student questions.", style_table_cell)
        ],
        [
            Paragraph("<code>student_progress</code>", style_table_cell),
            Paragraph("id (UUID), user_id (FK), completed_topics (JSON), quiz_scores (JSON), last_activity", style_table_cell),
            Paragraph("Audits student laboratory milestones and viva evaluation scores.", style_table_cell)
        ]
    ]

    t_ent = Table(entities_data, colWidths=[33 * mm, 60 * mm, 56 * mm])
    t_ent.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_primary),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    content.append(t_ent)

    content.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # SECTION 8: SECURITY & DEFENSE-IN-DEPTH
    # -------------------------------------------------------------
    content.append(Paragraph("8. Application Security & Defense-in-Depth", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "Security is woven directly into every layer of the system to prevent common academic software vulnerabilities:",
        style_body
    ))
    content.append(Paragraph("• <b>Argon2id Password Hashing:</b> Passwords are hashed using Argon2id with 64 MB memory cost, 3 iterations, and 4 parallel threads, providing state-of-the-art resistance to GPU/ASIC cracking.", style_bullet))
    content.append(Paragraph("• <b>Cryptographic Session Hashing:</b> Session tokens are generated using <code>secrets.token_urlsafe(32)</code> and stored in the database exclusively as SHA-256 hashes, mitigating token extraction in database breaches.", style_bullet))
    content.append(Paragraph("• <b>File Storage Quarantine:</b> Uploaded files are assigned random UUID storage keys and stored outside public web directories. File extension and MIME validation prevent executable upload attacks.", style_bullet))
    content.append(Paragraph("• <b>Rate Limiting Safeguards:</b> Strict rate limits are enforced across authentication (20 req/min), dataset upload (15 req/min), and AI tutor queries (30 req/min).", style_bullet))

    content.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # SECTION 9: DEPLOYMENT & DEVOPS TOPOLOGY
    # -------------------------------------------------------------
    content.append(Paragraph("9. Deployment Topology & DevOps Infrastructure", style_h1))
    content.append(HRFlowable(width="100%", thickness=1, color=c_primary, spaceAfter=8))

    content.append(Paragraph(
        "The system provides complete multi-container orchestration via Docker Compose with automated service dependencies and health probes:",
        style_body
    ))
    content.append(Paragraph("• <b>Postgres Container:</b> Official <code>postgres:16-alpine</code> with healthcheck <code>pg_isready</code> on port 5432.", style_bullet))
    content.append(Paragraph("• <b>Backend Container:</b> Lightweight Python 3.12-slim executing Alembic migrations on startup followed by Uvicorn on port 8000.", style_bullet))
    content.append(Paragraph("• <b>Frontend Container:</b> Multi-stage build (Node 20 Alpine builder -> Nginx Alpine server) serving optimized static assets and reverse-proxying <code>/api/</code> to the backend.", style_bullet))
    content.append(Paragraph("• <b>Automated Verification:</b> The test suite (14 passing automated tests) validates authentication, file ingestion, statistical calculations, ML pipelines, and tutor responses prior to deployment.", style_bullet))

    content.append(Spacer(1, 14))

    # Sign-off block
    signoff_data = [
        [
            Paragraph("<b>Prepared by:</b><br/>Third Year B.Tech Computer Engineering Students", style_table_cell),
            Paragraph("<b>Approved by:</b><br/>Department of Computer Engineering, PCCOE", style_table_cell)
        ]
    ]
    t_sign = Table(signoff_data, colWidths=[74 * mm, 75 * mm])
    t_sign.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, c_secondary),
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    content.append(t_sign)

    # Build PDF
    doc.build(content, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Architecture PDF successfully built at: {output_path}")


if __name__ == "__main__":
    out_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "docs",
        "AI_Smart_Tutor_System_Architecture.pdf"
    )
    build_architecture_pdf(out_file)
