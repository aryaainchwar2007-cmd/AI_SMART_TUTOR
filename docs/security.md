# AI Smart Tutor — Application Security Architecture

This document outlines the security controls implemented in the AI Smart Tutor platform in accordance with university laboratory security standards.

---

## 1. Authentication & Session Management
- **Password Hashing**: Uses **Argon2id** (`argon2-cffi`) with high-memory parameters (`time_cost=3`, `memory_cost=65536`, `parallelism=4`, `hash_len=32`).
- **Opaque Server-Side Sessions**:
  - Tokens are generated using Python's cryptographically secure pseudo-random number generator (`secrets.token_urlsafe(32)`).
  - The plaintext session token is transmitted to the client via an `HttpOnly`, `SameSite=Lax` cookie (`Secure=True` in production HTTPS).
  - Only a **SHA-256 cryptographic hash** of the token is stored in the `sessions` table.
- **Session Rotation & Revocation**:
  - Sessions are rotated upon every successful login.
  - Changing a password immediately revokes all existing active sessions.
  - Logging out marks the session record as revoked (`revoked_at`).

---

## 2. Authorization & Cross-User Isolation
- **Role-Based Access Control**: Two roles are defined: `student` and `admin`.
- **Ownership Verification**:
  - Server endpoints never trust client-submitted user IDs or owner IDs. All queries filter strictly by `current_user.id`.
  - When User B attempts to access, preview, delete, or predict using a resource owned by User A, the server returns an explicit **404 Not Found** instead of a 403 Forbidden. This prevents resource enumeration and existence leakage.
  - Automated tests in `backend/tests/test_datasets.py`, `test_ml.py`, and `test_tutor.py` verify this isolation behavior.

---

## 3. Storage & Dataset Security
- **Path Traversal Protection**:
  - Uploaded files are renamed to server-generated UUID keys (e.g. `c73725c0.csv`).
  - All file path resolutions are verified via `.resolve()` against the intended root directory:
    ```python
    if not str(resolved_path).startswith(str(upload_dir.resolve())):
        raise HTTPException(status_code=400, detail="Security violation: Path traversal detected.")
    ```
- **Storage Isolation**: Uploads, model artifacts, and reports reside in private directories outside any public web root.
- **CSV Formula Injection Mitigation**:
  - When saving or exporting CSV files, any cell value starting with spreadsheet calculation triggers (`=`, `+`, `-`, `@`) is safely escaped with a leading single quote (`'`).
- **Resource Constraints**:
  - Max upload size: 15 MB.
  - Max row count: 50,000 rows.
  - Max column count: 100 columns.
  - Pairplot bounded to at most 5 features and 500 sampled rows to prevent CPU denial of service.

---

## 4. Machine Learning & Execution Safety
- **No Arbitrary Code Execution**: The application **never** calls `eval()` or `exec()`.
- **Safe Serialization**:
  - Model pipelines are persisted and loaded strictly through internal, protected artifact directories.
  - Artifact keys are verified against the database record before deserialization.

---

## 5. Network & API Protection
- **Explicit CORS Allowlist**: Only explicit configured origins (e.g., `http://localhost:5173`, `http://localhost:3000`) are permitted.
- **Rate Limiting**: Sliding-window rate limiters are enforced on `/auth/login`, `/auth/register`, `/datasets` upload, and `/conversations` messages.
- **Security Headers**: Middleware enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.
