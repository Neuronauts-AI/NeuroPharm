"""
Configuration and client initialization.
Loads environment variables and creates the LLM client.
"""

import os
from pathlib import Path
from typing import Optional, Tuple
from openai import OpenAI


def load_env():
    """Load .env file from project root."""
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key] = value


load_env()

# API Keys & URLs
FAL_KEY = os.getenv("FAL_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"
DEFAULT_LLM_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "auto").strip().lower()
LLM_MODEL = os.getenv("LLM_MODEL", "deepseek/deepseek-r1")


def _build_fal_client() -> OpenAI:
    return OpenAI(
        base_url="https://fal.run/openrouter/router/openai/v1",
        api_key="not-needed",
        default_headers={
            "Authorization": f"Key {FAL_KEY or ''}",
        },
    )


def _build_openrouter_client() -> OpenAI:
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY or "",
    )


# Backward compatibility: default client still exported for legacy call-sites.
llm_client = _build_fal_client()


def resolve_llm_provider(requested_provider: Optional[str]) -> str:
    """Resolve provider selection with auto fallback.

    Priority:
      1) explicit request (fal/openrouter)
      2) DEFAULT_LLM_PROVIDER when valid and configured
      3) first configured provider (fal then openrouter)
      4) fal as final fallback
    """
    provider = (requested_provider or "auto").strip().lower()

    if provider == "fal":
        if not FAL_KEY and OPENROUTER_API_KEY:
            return "openrouter"
        return "fal"
    if provider == "openrouter":
        if not OPENROUTER_API_KEY and FAL_KEY:
            return "fal"
        return "openrouter"

    default_provider = DEFAULT_LLM_PROVIDER if DEFAULT_LLM_PROVIDER in {"fal", "openrouter"} else "auto"
    if default_provider == "fal" and FAL_KEY:
        return "fal"
    if default_provider == "openrouter" and OPENROUTER_API_KEY:
        return "openrouter"

    if FAL_KEY:
        return "fal"
    if OPENROUTER_API_KEY:
        return "openrouter"

    return "fal"


def get_llm_context(requested_provider: Optional[str], requested_model: Optional[str]) -> Tuple[OpenAI, str, str]:
    """Return (client, provider, model) for a request."""
    provider = resolve_llm_provider(requested_provider)
    model = (requested_model or LLM_MODEL).strip()

    if provider == "openrouter":
        return _build_openrouter_client(), provider, model
    return _build_fal_client(), provider, model
