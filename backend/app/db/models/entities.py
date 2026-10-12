import uuid

from app.db.guid import GUID
from app.db.session import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), default="student", nullable=False)  # "student", "admin"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="owner", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="owner", cascade="all, delete-orphan")
    models = relationship("MLModel", back_populates="owner", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="owner", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="owner", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="sessions")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_key = Column(String(255), unique=True, nullable=False)
    file_format = Column(String(16), nullable=False)  # "csv", "json"
    file_size = Column(Integer, nullable=False)
    row_count = Column(Integer, nullable=False, default=0)
    column_count = Column(Integer, nullable=False, default=0)
    column_metadata = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="datasets")
    analysis_runs = relationship("AnalysisRun", back_populates="dataset", cascade="all, delete-orphan")
    models = relationship("MLModel", back_populates="dataset", cascade="all, delete-orphan")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    dataset_id = Column(GUID, ForeignKey("datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    analysis_type = Column(String(64), nullable=False)  # "eda", "cleaning", "statistics", "visualization"
    parameters = Column(JSON, nullable=False, default=dict)
    result_summary = Column(JSON, nullable=False, default=dict)
    status = Column(String(32), default="completed", nullable=False)  # "pending", "completed", "failed"
    error_code = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="analysis_runs")
    dataset = relationship("Dataset", back_populates="analysis_runs")


class MLModel(Base):
    __tablename__ = "models"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    dataset_id = Column(GUID, ForeignKey("datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    task_type = Column(String(32), nullable=False)  # "classification", "regression"
    algorithm = Column(String(64), nullable=False)
    target_column = Column(String(255), nullable=False)
    feature_columns = Column(JSON, nullable=False, default=list)
    metrics = Column(JSON, nullable=False, default=dict)
    configuration = Column(JSON, nullable=False, default=dict)
    artifact_key = Column(String(255), nullable=False)
    status = Column(String(32), default="completed", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="models")
    dataset = relationship("Dataset", back_populates="models")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    owner = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    conversation_id = Column(GUID, ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    role = Column(String(32), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversation = relationship("Conversation", back_populates="messages")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    owner_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    topic = Column(String(128), nullable=False)
    activity_type = Column(String(64), nullable=False)  # "quiz", "lab", "viva", "tutorial"
    score = Column(Float, nullable=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    owner = relationship("User", back_populates="learning_progress")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    actor_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(128), nullable=False)
    resource_type = Column(String(64), nullable=False)
    resource_id = Column(String(64), nullable=True)
    outcome = Column(String(32), nullable=False)  # "success", "denied", "failed"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
