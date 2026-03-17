import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

from config import loader


def _get_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    loader.load_env_variables()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise loader.ConfigurationError(
            "DATABASE_URL is missing. Set it in your environment or provide it via a local .env file."
        )

    pool_size = _get_int_env("DATABASE_POOL_SIZE", 5)
    max_overflow = _get_int_env("DATABASE_MAX_OVERFLOW", 10)

    return create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=pool_size,
        max_overflow=max_overflow,
        future=True,
    )


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    bind=get_engine(),
)

