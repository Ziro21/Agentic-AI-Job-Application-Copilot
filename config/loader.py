"""
Configuration loader: Reads .env and settings.yaml files.
Centralizes all configuration for the application.
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from dotenv import load_dotenv


class ConfigurationError(Exception):
    """Raised when configuration is invalid or missing."""

    pass


def load_env_variables() -> None:
    """
    Load environment variables from .env file.
    Must be called before accessing os.getenv() for .env values.
    """
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    else:
        raise ConfigurationError(
            f".env file not found at {env_file}. "
            "Copy .env.example to .env and fill in your values."
        )


def load_settings_yaml() -> Dict[str, Any]:
    """
    Load user settings from settings.yaml file.

    Returns:
        Dictionary containing all settings from YAML file.

    Raises:
        ConfigurationError: If settings.yaml file is not found.
    """
    settings_file = Path(__file__).parent / "settings.yaml"

    if not settings_file.exists():
        raise ConfigurationError(
            f"settings.yaml not found at {settings_file}. "
            "Copy config/settings.example.yaml to config/settings.yaml and customize."
        )

    try:
        with open(settings_file, "r", encoding="utf-8") as f:
            settings = yaml.safe_load(f)
        return settings or {}
    except yaml.YAMLError as e:
        raise ConfigurationError(f"Error parsing settings.yaml: {e}")
    except IOError as e:
        raise ConfigurationError(f"Error reading settings.yaml: {e}")


def get_config() -> Dict[str, Any]:
    """
    Get complete configuration (merged from .env and settings.yaml).

    Returns:
        Dictionary containing:
        - env: Environment variables from .env
        - settings: User settings from settings.yaml

    Example:
        >>> config = get_config()
        >>> db_url = config['env']['DATABASE_URL']
        >>> board_tokens = config['settings']['sources']['greenhouse']['board_tokens']
    """
    load_env_variables()
    settings = load_settings_yaml()

    return {
        "env": {key: os.getenv(key) for key in os.environ.keys()},
        "settings": settings,
    }


def get_database_url() -> str:
    """Get PostgreSQL connection URL from environment."""
    load_env_variables()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ConfigurationError(
            "DATABASE_URL not set in .env file. "
            "Please set DATABASE_URL in your .env file."
        )
    return db_url


def get_greenhouse_settings() -> Dict[str, Any]:
    """Get Greenhouse-specific settings from settings.yaml."""
    settings = load_settings_yaml()
    return settings.get("sources", {}).get("greenhouse", {})


def get_filters() -> Dict[str, Any]:
    """Get job filter settings from settings.yaml."""
    settings = load_settings_yaml()
    return settings.get("filters", {})


def get_scheduler_settings() -> Dict[str, Any]:
    """Get scheduler settings from settings.yaml."""
    settings = load_settings_yaml()
    return settings.get("scheduler", {})


def get_user_preferences() -> Dict[str, Any]:
    """Get user job search preferences from settings.yaml."""
    settings = load_settings_yaml()
    return settings.get("user_preferences", {})


def get_log_level() -> str:
    """Get logging level from environment."""
    load_env_variables()
    return os.getenv("LOG_LEVEL", "INFO")


def validate_config() -> bool:
    """
    Validate that all required configuration is present.

    Returns:
        True if all configuration is valid.

    Raises:
        ConfigurationError: If any required configuration is missing.
    """
    try:
        # Check .env
        load_env_variables()
        required_env_vars = [
            "DATABASE_URL",
            "GREENHOUSE_ENABLED",
            "LOG_LEVEL",
            "SCHEDULER_ENABLED",
        ]
        for var in required_env_vars:
            if not os.getenv(var):
                raise ConfigurationError(f"Required environment variable '{var}' not set in .env")

        # Check settings.yaml
        settings = load_settings_yaml()
        if not settings:
            raise ConfigurationError("settings.yaml is empty or invalid")

        # Check sources
        if "sources" not in settings:
            raise ConfigurationError("'sources' section missing from settings.yaml")

        # Check filters
        if "filters" not in settings:
            raise ConfigurationError("'filters' section missing from settings.yaml")

        # Check user_preferences
        if "user_preferences" not in settings:
            raise ConfigurationError("'user_preferences' section missing from settings.yaml")

        return True

    except ConfigurationError:
        raise
    except Exception as e:
        raise ConfigurationError(f"Unexpected error validating configuration: {e}")


# Lazy-load configuration once
_config_cache: Optional[Dict[str, Any]] = None


def get_cached_config() -> Dict[str, Any]:
    """
    Get cached configuration (loads only once on first call).

    Returns:
        Cached configuration dictionary.
    """
    global _config_cache
    if _config_cache is None:
        validate_config()
        _config_cache = get_config()
    return _config_cache


if __name__ == "__main__":
    # Test configuration loading
    try:
        print("Validating configuration...")
        validate_config()
        print("✅ Configuration is valid!")

        config = get_cached_config()
        print("\nConfiguration loaded successfully.")
        print(f"Database: {config['env'].get('DATABASE_URL', 'NOT SET')}")
        print(f"Log Level: {config['env'].get('LOG_LEVEL', 'NOT SET')}")
        print(f"Greenhouse Enabled: {config['env'].get('GREENHOUSE_ENABLED', 'NOT SET')}")
        print(f"Number of board tokens: {len(config['settings'].get('sources', {}).get('greenhouse', {}).get('board_tokens', []))}")

    except ConfigurationError as e:
        print(f"❌ Configuration error: {e}")
        exit(1)
