"""TraceScribe FastAPI Application."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup - gracefully handle missing database
    try:
        await init_db()
    except Exception as e:
        import logging
        logging.warning(f"Database initialization failed (dev mode): {e}")
    yield
    # Shutdown
    try:
        await close_db()
    except Exception:
        pass


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Clinical trial document generation platform",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": type(exc).__name__,
        },
    )


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "docs": "/docs",
        "health": "/api/health",
    }


# Import and include routers after app creation to avoid circular imports
def include_routers():
    """Include all API routers."""
    from app.modules.protocols.router import router as protocols_router
    from app.modules.documents.router import router as documents_router
    from app.modules.subscriptions.router import router as subscriptions_router

    app.include_router(protocols_router, prefix="/api/protocols", tags=["Protocols"])
    app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
    app.include_router(subscriptions_router, prefix="/api/subscriptions", tags=["Subscriptions"])


# Include routers
try:
    include_routers()
except ImportError:
    # Routers not yet created - will be added in subsequent tasks
    pass
# Force reload Fri, Jan  2, 2026  1:37:07 PM
# Force reload

