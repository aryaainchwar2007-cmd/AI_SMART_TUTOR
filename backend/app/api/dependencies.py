import time
from datetime import UTC, datetime

from app.core.config import settings
from app.core.security import hash_session_token
from app.db.models.entities import Session as DbSession
from app.db.models.entities import User
from app.db.session import get_db
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

# Optional Bearer token support alongside HttpOnly cookie
security_bearer = HTTPBearer(auto_error=False)

# In-memory sliding window rate limiter
_rate_limits: dict[str, list] = {}


def check_rate_limit(key: str, max_requests: int, window_seconds: int = 60) -> None:
    now = time.time()
    timestamps = _rate_limits.setdefault(key, [])
    # Filter out timestamps older than the window
    _rate_limits[key] = [t for t in timestamps if now - t < window_seconds]
    if len(_rate_limits[key]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down and try again shortly."
        )
    _rate_limits[key].append(now)


def get_session_token_from_request(
    request: Request,
    bearer: HTTPAuthorizationCredentials | None = Depends(security_bearer)
) -> str | None:
    """Retrieves session token either from HttpOnly cookie or Authorization Bearer header."""
    cookie_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if cookie_token:
        return cookie_token
    if bearer and bearer.credentials:
        return bearer.credentials
    # Also check custom header for convenience in dev/APIs
    custom_header = request.headers.get("X-Session-Token")
    if custom_header:
        return custom_header
    return None


def get_current_user(
    token: str | None = Depends(get_session_token_from_request),
    db: Session = Depends(get_db)
) -> User:
    """Authenticates the user by validating the server-side session token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. No active session found."
        )

    token_hash = hash_session_token(token)
    now = datetime.now(UTC)

    db_session = (
        db.query(DbSession)
        .filter(
            DbSession.token_hash == token_hash,
            DbSession.revoked_at.is_(None)
        )
        .first()
    )

    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again."
        )

    # Check expiration (ensure tz-aware comparison)
    session_exp = db_session.expires_at
    if session_exp.tzinfo is None:
        session_exp = session_exp.replace(tzinfo=UTC)

    if session_exp < now:
        # Session expired
        db_session.revoked_at = now
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again."
        )

    user = db.query(User).filter(User.id == db_session.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated or unavailable."
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restricts access to administrator users only."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required."
        )
    return current_user
