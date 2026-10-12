from app.api.dependencies import (
    check_rate_limit,
    get_current_user,
    get_session_token_from_request,
)
from app.core.config import settings
from app.db.models.entities import User
from app.db.session import get_db
from app.schemas.auth import (
    ChangePasswordRequest,
    SessionResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import AuthService
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"auth_reg_{client_ip}", max_requests=settings.RATE_LIMIT_AUTH_PER_MINUTE)
    return AuthService.register_user(db, req)


@router.post("/login", response_model=SessionResponse)
def login(
    req: UserLoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"auth_login_{client_ip}", max_requests=settings.RATE_LIMIT_AUTH_PER_MINUTE)

    raw_token, user = AuthService.login_user(db, req)

    # Set secure HttpOnly session cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=raw_token,
        max_age=settings.SESSION_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    # Also set header token for API clients/tests
    response.headers["X-Session-Token"] = raw_token

    return SessionResponse(
        authenticated=True,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    token: str = Depends(get_session_token_from_request),
    db: Session = Depends(get_db),
):
    if token:
        AuthService.logout_user(db, token, current_user.id)

    # Clear session cookie
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    req: ChangePasswordRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AuthService.change_password(db, current_user, req)
    # Clear cookie since all sessions are revoked on password change
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")
    return {"message": "Password changed successfully. Please log in with your new password."}
