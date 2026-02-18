"""
FastAPI application entry point.
Assembles middleware, routes, and logging into a single app instance.
"""

import json
import time

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from backend.logger import init_logger, get_logger
from backend.routes import analyze, chat, health, prefetch


def create_app(enable_logging: bool = True) -> FastAPI:
    """Build and return the FastAPI application."""
    init_logger(enabled=enable_logging, log_dir="backend_logs")

    app = FastAPI(title="Drug Interaction Analysis API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Validation error handler ─────────────────────────
    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=422,
            content={"detail": "Geçersiz istek verisi. Lütfen girdiğiniz bilgileri kontrol edin."},
        )

    # ── Request size limit middleware ──────────────────────
    @app.middleware("http")
    async def limit_request_size(request: Request, call_next):
        # 15 MB max for all requests (file uploads etc.)
        max_size = 15 * 1024 * 1024
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > max_size:
            return JSONResponse(
                status_code=413,
                content={"detail": "İstek boyutu çok büyük. Maksimum 15 MB."},
            )
        return await call_next(request)

    # ── Logging middleware ──────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()

        # Read body for logging (make it re-readable)
        request_body = None
        if request.method == "POST":
            try:
                body_bytes = await request.body()
                if body_bytes:
                    request_body = json.loads(body_bytes.decode())

                async def receive():
                    return {"type": "http.request", "body": body_bytes}

                request._receive = receive
            except Exception:
                request_body = None

        response = await call_next(request)

        logger = get_logger()
        processing_time_ms = (time.time() - start_time) * 1000
        path = request.url.path

        # Log only non-endpoint-specific requests (endpoints log themselves)
        if logger.enabled and not any(
            path.startswith(p) for p in ("/analyze", "/chat", "/health")
        ):
            client_ip = request.client.host if request.client else "unknown"
            user_agent = request.headers.get("user-agent", "unknown")
            logger.log_request(
                endpoint=path,
                method=request.method,
                client_ip=client_ip,
                user_agent=user_agent,
                request_data=request_body or {},
                response_data={"status": "completed"},
                status_code=response.status_code,
                processing_time_ms=processing_time_ms,
            )

        return response

    # ── Register routes ────────────────────────────────────
    app.include_router(health.router)
    app.include_router(analyze.router)
    app.include_router(chat.router)
    app.include_router(prefetch.router)

    return app


# Global app instance (used by uvicorn)
app = create_app(enable_logging=True)


if __name__ == "__main__":
    import sys
    import uvicorn

    enable_logging = "--log" in sys.argv
    port = 8080

    _app = create_app(enable_logging=enable_logging)
    print(f"\n🚀 Starting Drug Interaction Analysis API...")
    print(f"📍 Endpoint: http://localhost:{port}")
    print(f"🌐 Data source: OpenFDA API (real-time)")
    print(f"🤖 Evaluator: FAL AI → Claude Sonnet")
    print(f"📝 Logging: {'ENABLED' if enable_logging else 'DISABLED'}")
    print()
    uvicorn.run(_app, host="0.0.0.0", port=port)
