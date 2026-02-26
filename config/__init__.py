"""
Configuration module for Agentic AI Job Application Copilot.

Provides utilities to load and access configuration from:
- .env file (environment secrets)
- settings.yaml file (user preferences)

Usage:
    from config import loader
    
    # Validate configuration
    loader.validate_config()
    
    # Get specific settings
    db_url = loader.get_database_url()
    gh_settings = loader.get_greenhouse_settings()
    filters = loader.get_filters()
"""

from config.loader import (
    ConfigurationError,
    get_cached_config,
    get_config,
    get_database_url,
    get_filters,
    get_greenhouse_settings,
    get_log_level,
    get_scheduler_settings,
    get_user_preferences,
    load_env_variables,
    load_settings_yaml,
    validate_config,
)

__all__ = [
    "ConfigurationError",
    "get_cached_config",
    "get_config",
    "get_database_url",
    "get_filters",
    "get_greenhouse_settings",
    "get_log_level",
    "get_scheduler_settings",
    "get_user_preferences",
    "load_env_variables",
    "load_settings_yaml",
    "validate_config",
]
