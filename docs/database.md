# AI Smart Tutor — Database Architecture & Migrations

The database is built on **SQLAlchemy 2.x** and **Alembic**, supporting both production **PostgreSQL** and development/testing **SQLite** using a cross-platform `GUID` type.

---

## 1. Entity-Relationship Schema

```
 +------------------+           1:N          +------------------+
 |      users       |<-----------------------|     sessions     |
 +------------------+                        +------------------+
 | id (UUID PK)     |
 | email (UK, index)|           1:N          +------------------+
 | password_hash    |<-----------------------|     datasets     |
 | role (student/adm|                        +------------------+
 | is_active        |                                  |
 | created_at       |                                  | 1:N
 | updated_at       |                                  v
 +------------------+                        +------------------+
         |      |                            |  analysis_runs   |
     1:N |      | 1:N                        +------------------+
         |      +---------\                            ^
         v                v                            | 1:N
 +------------------+   +------------------+           |
 |  conversations   |   |      models      |-----------+
 +------------------+   +------------------+
         |
     1:N |
         v
 +------------------+
 |     messages     |
 +------------------+
```

---

## 2. Table Specifications

### 1. `users`
- `id` (GUID PK, default `uuid.uuid4`)
- `email` (String 255, unique, indexed, normalized lowercase)
- `password_hash` (String 255, Argon2id)
- `role` (String 32, `'student'` or `'admin'`)
- `is_active` (Boolean, default `True`)
- `created_at`, `updated_at` (DateTime with timezone)

### 2. `sessions`
- `id` (GUID PK)
- `user_id` (GUID FK -> `users.id`, ondelete `CASCADE`, indexed)
- `token_hash` (String 64, unique, indexed, SHA-256)
- `expires_at` (DateTime with timezone)
- `revoked_at` (DateTime with timezone, nullable)
- `created_at` (DateTime with timezone)

### 3. `datasets`
- `id` (GUID PK)
- `owner_id` (GUID FK -> `users.id`, ondelete `CASCADE`, indexed)
- `name` (String 255)
- `original_filename` (String 255)
- `storage_key` (String 255, unique)
- `file_format` (String 16, `'csv'` or `'json'`)
- `file_size` (Integer)
- `row_count` (Integer)
- `column_count` (Integer)
- `column_metadata` (JSON: types, null counts, unique counts, sample values)
- `created_at`, `updated_at` (DateTime with timezone)

### 4. `analysis_runs`
- `id` (GUID PK)
- `owner_id` (GUID FK -> `users.id`, ondelete `CASCADE`, indexed)
- `dataset_id` (GUID FK -> `datasets.id`, ondelete `CASCADE`, indexed)
- `analysis_type` (String 64: `'cleaning'`, `'visualization'`, `'statistics'`)
- `parameters` (JSON)
- `result_summary` (JSON)
- `status` (String 32: `'completed'`, `'failed'`)
- `created_at`, `completed_at` (DateTime with timezone)

### 5. `models`
- `id` (GUID PK)
- `owner_id` (GUID FK -> `users.id`, ondelete `CASCADE`, indexed)
- `dataset_id` (GUID FK -> `datasets.id`, ondelete `CASCADE`, indexed)
- `task_type` (String 32: `'classification'`, `'regression'`)
- `algorithm` (String 64: `'random_forest'`, `'linear_baseline'`)
- `target_column` (String 255)
- `feature_columns` (JSON)
- `metrics` (JSON)
- `configuration` (JSON)
- `artifact_key` (String 255)
- `status` (String 32)
- `created_at` (DateTime with timezone)

### 6. `conversations` & `messages`
- `conversations`: `id`, `owner_id` (FK), `title`, `created_at`, `updated_at`
- `messages`: `id`, `conversation_id` (FK ondelete `CASCADE`), `role`, `content`, `created_at`

### 7. `learning_progress` & `audit_logs`
- `learning_progress`: `id`, `owner_id` (FK), `topic`, `activity_type`, `score`, `completed_at`
- `audit_logs`: `id`, `actor_id` (FK), `action`, `resource_type`, `resource_id`, `outcome`, `created_at`

---

## 3. Database Migration Instructions

### Upgrading to Latest Schema:
```bash
cd backend
python -m alembic upgrade head
```

### Creating a New Migration:
```bash
cd backend
python -m alembic revision --autogenerate -m "describe_changes"
```

### Downgrading One Migration:
```bash
cd backend
python -m alembic downgrade -1
```

### Resetting Development Database:
```bash
# SQLite local reset:
rm storage/ai_smart_tutor.db
python -m alembic upgrade head

# PostgreSQL reset:
docker compose down -v
docker compose up -d postgres
docker compose exec backend alembic upgrade head
```
