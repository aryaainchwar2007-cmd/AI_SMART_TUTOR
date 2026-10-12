import tempfile
from pathlib import Path

import pytest
from app.core.config import settings
from app.db.session import Base, get_db
from app.main import app
from app.storage.file_storage import StorageService, storage_service
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use temporary SQLite database and storage for tests
TEST_DIR = Path(tempfile.mkdtemp())
TEST_DB_PATH = TEST_DIR / "test_smart_tutor.db"
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

test_storage = StorageService(base_dir=TEST_DIR / "storage")


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Setup tables
    Base.metadata.create_all(bind=test_engine)
    # Point storage service to test storage
    storage_service.base_dir = test_storage.base_dir
    storage_service.upload_dir = test_storage.upload_dir
    storage_service.artifact_dir = test_storage.artifact_dir
    storage_service.report_dir = test_storage.report_dir
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def user_a_client(client):
    # Register and log in User A
    client.post("/api/v1/auth/register", json={"email": "student_a@university.edu", "password": "Password123!"})
    login_resp = client.post("/api/v1/auth/login", json={"email": "student_a@university.edu", "password": "Password123!"})
    token = login_resp.headers.get("X-Session-Token") or login_resp.cookies.get(settings.SESSION_COOKIE_NAME)
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client, "student_a@university.edu"


@pytest.fixture
def user_b_client():
    # Second independent client for User B
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client_b:
        client_b.post("/api/v1/auth/register", json={"email": "student_b@university.edu", "password": "Password123!"})
        login_resp = client_b.post("/api/v1/auth/login", json={"email": "student_b@university.edu", "password": "Password123!"})
        token = login_resp.headers.get("X-Session-Token") or login_resp.cookies.get(settings.SESSION_COOKIE_NAME)
        client_b.headers.update({"Authorization": f"Bearer {token}"})
        yield client_b, "student_b@university.edu"
    app.dependency_overrides.clear()
