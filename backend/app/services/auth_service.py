from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.core.config import settings
from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.db.models.entities import AuditLog, User
from app.db.models.entities import Session as DbSession
from app.schemas.auth import (
    ChangePasswordRequest,
    UserLoginRequest,
    UserRegisterRequest,
)
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


class AuthService:
    @staticmethod
    def log_audit(
        db: Session,
        action: str,
        resource_type: str,
        actor_id: UUID | None = None,
        resource_id: str | None = None,
        outcome: str = "success"
    ) -> None:
        """Logs an event into the audit log."""
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            outcome=outcome,
        )
        db.add(log)
        db.commit()

    @staticmethod
    def register_user(db: Session, req: UserRegisterRequest) -> User:
        email_clean = req.email.strip().lower()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        # First registered user can be checked or default to student
        user_count = db.query(User).count()
        role = "admin" if user_count == 0 else "student"

        user = User(
            email=email_clean,
            password_hash=hash_password(req.password),
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        AuthService.log_audit(db, action="register", resource_type="user", actor_id=user.id, resource_id=str(user.id))
        return user

    @staticmethod
    def login_user(db: Session, req: UserLoginRequest) -> tuple[str, User]:
        email_clean = req.email.strip().lower()
        user = db.query(User).filter(User.email == email_clean).first()

        # Generic error message to prevent account enumeration
        if not user or not verify_password(req.password, user.password_hash):
            AuthService.log_audit(
                db, action="login_failed", resource_type="user", outcome="denied", resource_id=email_clean
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated."
            )

        # Generate cryptographically secure session token and store SHA-256 hash
        raw_token = generate_session_token()
        token_hash = hash_session_token(raw_token)
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)

        session = DbSession(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(session)
        db.commit()

        AuthService.log_audit(db, action="login_success", resource_type="session", actor_id=user.id, resource_id=str(session.id))
        return raw_token, user

    @staticmethod
    def logout_user(db: Session, raw_token: str, user_id: UUID) -> None:
        token_hash = hash_session_token(raw_token)
        session = db.query(DbSession).filter(DbSession.token_hash == token_hash).first()
        if session:
            session.revoked_at = datetime.now(UTC)
            db.commit()
            AuthService.log_audit(db, action="logout", resource_type="session", actor_id=user_id, resource_id=str(session.id))

    @staticmethod
    def change_password(db: Session, user: User, req: ChangePasswordRequest) -> None:
        if not verify_password(req.old_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password."
            )

        user.password_hash = hash_password(req.new_password)
        # Revoke all active sessions upon password change for security
        now = datetime.now(UTC)
        db.query(DbSession).filter(
            DbSession.user_id == user.id,
            DbSession.revoked_at.is_(None)
        ).update({"revoked_at": now})

        db.commit()
        AuthService.log_audit(db, action="change_password", resource_type="user", actor_id=user.id, resource_id=str(user.id))
