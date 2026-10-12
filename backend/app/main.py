import logging
from contextlib import asynccontextmanager

import app.db.models  # Ensure all model tables are registered
from app.api.v1 import (
    analysis,
    auth,
    datasets,
    progress,
    reports,
    tutor,
)
from app.api.v1 import (
    models as ml_routes,
)
from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import Base, engine
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

setup_logging(debug=settings.DEBUG)
logger = logging.getLogger("smart_tutor")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables on startup
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Session-Token", "Content-Disposition"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Enforces essential security headers on all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg_parts = []
    for err in errors:
        loc = [str(l) for l in err.get("loc", []) if l != "body"]
        field = loc[-1] if loc else "input"
        msg = err.get("msg", "Validation error")
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, "):]
        msg_parts.append(f"{field}: {msg}")
    clean_message = " | ".join(msg_parts) if msg_parts else "Invalid request data."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": clean_message}
    )


# Global error handler to prevent internal tracebacks leaking in production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc!s}", exc_info=settings.DEBUG)
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Internal Server Error: {exc!s}"}
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."}
    )


# Health and Readiness probes
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "version": settings.VERSION}


@app.get("/ready", tags=["System"])
def readiness_check():
    # Verify database connection
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unready", "database": str(e)}
        )


# Register API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(ml_routes.router, prefix=settings.API_V1_STR)
app.include_router(tutor.router, prefix=settings.API_V1_STR)
app.include_router(progress.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
