"""
Structured JSON logging (stdout + optional ``LOG_FILE``).

Uses ``python-json-logger`` when installed; falls back to plain text.
Adds ``service`` on every log record via a filter.
"""

from __future__ import annotations

import logging
import os
import sys
from contextvars import ContextVar

request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")


class _ServiceFilter(logging.Filter):
    def __init__(self, service: str) -> None:
        super().__init__()
        self.service = service

    def filter(self, record: logging.LogRecord) -> bool:
        record.service = self.service  # type: ignore[attr-defined]
        req_id = request_id_ctx_var.get()
        record.request_id = req_id if req_id else "system"
        return True


def setup_logging(service: str = "job-copilot") -> None:
    from config.loader import get_log_level, load_env_variables

    load_env_variables()
    level_name = get_log_level().upper()
    level = getattr(logging, level_name, logging.INFO)

    try:
        from pythonjsonlogger import jsonlogger

        handler = logging.StreamHandler(sys.stdout)
        # Important: fields must exist before rename_fields runs.
        # Using standard LogRecord attrs ensures python-json-logger can populate them.
        fmt = jsonlogger.JsonFormatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s",
            rename_fields={"asctime": "timestamp", "levelname": "level", "name": "logger"},
        )
        handler.setFormatter(fmt)
    except ImportError:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] [%(request_id)s] %(name)s %(message)s")
        )

    handler.addFilter(_ServiceFilter(service))

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level)
    root.addHandler(handler)

    log_file = os.getenv("LOG_FILE", "").strip()
    if log_file:
        fh = logging.FileHandler(log_file, encoding="utf-8")
        fh.setFormatter(handler.formatter)
        fh.addFilter(_ServiceFilter(service))
        root.addHandler(fh)
