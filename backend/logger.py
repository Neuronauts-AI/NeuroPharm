"""
Backend Logger — Request/Response Logging System.
Writes detailed JSON log files for each API request.
"""

import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


class BackendLogger:
    """Detailed logging system for the backend API."""

    def __init__(self, log_dir: str = "backend_logs", enabled: bool = False):
        self.enabled = enabled
        self.log_dir = Path(log_dir)

        if self.enabled:
            self.log_dir.mkdir(exist_ok=True)
            logging.basicConfig(
                level=logging.INFO,
                format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            )
            self.logger = logging.getLogger("BackendLogger")
            self.logger.info(f"Backend logging enabled — saving to {self.log_dir}")

    def log_request(
        self,
        endpoint: str,
        method: str,
        client_ip: str,
        user_agent: str,
        request_data: Dict[str, Any],
        response_data: Dict[str, Any],
        status_code: int,
        processing_time_ms: float,
        pipeline_steps: list = None,
    ) -> str:
        """Log a complete API request/response cycle."""
        if not self.enabled:
            return ""

        try:
            log_id = str(uuid.uuid4())
            timestamp = datetime.now()

            log_entry = {
                "log_id": log_id,
                "timestamp": timestamp.isoformat(),
                "endpoint": endpoint,
                "method": method,
                "client": {"ip": client_ip, "user_agent": user_agent},
                "request": request_data,
                "pipeline": pipeline_steps or [],
                "response": response_data,
                "status_code": status_code,
                "processing_time_ms": round(processing_time_ms, 2),
            }

            safe_endpoint = endpoint.replace("/", "_")
            filename = f"{timestamp.strftime('%Y-%m-%d_%H-%M-%S')}__{safe_endpoint}_{log_id[:8]}.json"
            log_path = self.log_dir / filename

            with open(log_path, "w", encoding="utf-8") as f:
                json.dump(log_entry, f, indent=2, ensure_ascii=False)

            self.logger.info(
                f"[{method}] {endpoint} | IP: {client_ip} | "
                f"Status: {status_code} | Time: {processing_time_ms:.2f}ms | "
                f"Steps: {len(pipeline_steps) if pipeline_steps else 0} | "
                f"Log: {filename}"
            )
            return str(log_path)

        except Exception as e:
            self.logger.error(f"Logging error: {e}")
            return ""

    def log_error(
        self,
        endpoint: str,
        method: str,
        client_ip: str,
        error_message: str,
        error_type: str,
        request_data: Dict[str, Any] = None,
    ) -> str:
        """Log an error event."""
        if not self.enabled:
            return ""

        try:
            log_id = str(uuid.uuid4())
            timestamp = datetime.now()

            log_entry = {
                "log_id": log_id,
                "timestamp": timestamp.isoformat(),
                "type": "ERROR",
                "endpoint": endpoint,
                "method": method,
                "client": {"ip": client_ip},
                "error": {"type": error_type, "message": error_message},
                "request": request_data or {},
            }

            safe_endpoint = endpoint.replace("/", "_")
            filename = f"{timestamp.strftime('%Y-%m-%d_%H-%M-%S')}__ERROR_{safe_endpoint}_{log_id[:8]}.json"
            log_path = self.log_dir / filename

            with open(log_path, "w", encoding="utf-8") as f:
                json.dump(log_entry, f, indent=2, ensure_ascii=False)

            self.logger.error(
                f"[{method}] {endpoint} | IP: {client_ip} | "
                f"Error: {error_type} — {error_message} | Log: {filename}"
            )
            return str(log_path)

        except Exception as e:
            self.logger.error(f"Error logging error: {e}")
            return ""


# --------------- Global singleton ---------------

_backend_logger: BackendLogger = None


def init_logger(enabled: bool = False, log_dir: str = "backend_logs"):
    """Initialise the global logger instance."""
    global _backend_logger
    _backend_logger = BackendLogger(log_dir=log_dir, enabled=enabled)
    return _backend_logger


def get_logger() -> BackendLogger:
    """Return the global logger instance."""
    global _backend_logger
    if _backend_logger is None:
        _backend_logger = BackendLogger(enabled=False)
    return _backend_logger
