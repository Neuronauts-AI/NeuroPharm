"""
Configuration and client initialization.
Loads environment variables and creates the LLM client.
"""

import os
from pathlib import Path
from typing import Optional, Tuple
from openai import OpenAI

from backend.runtime_model import get_runtime_model


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
OPENROUTER_API_KEY = (os.getenv("OPENROUTER_API_KEY") or os.getenv("OPEN_ROUTER_API_KEY") or "").strip()
OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"
DEFAULT_LLM_PROVIDER = os.getenv("DEFAULT_LLM_PROVIDER", "openrouter").strip().lower()
LLM_MODEL = os.getenv("LLM_MODEL", "anthropic/claude-sonnet-4.6")


def _build_openrouter_client() -> OpenAI:
    if not OPENROUTER_API_KEY:
        raise ValueError("OpenRouter API key not configured. Set OPENROUTER_API_KEY or OPEN_ROUTER_API_KEY.")
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )


# Backward compatibility: default client still exported for legacy call-sites.
llm_client = _build_openrouter_client()


def resolve_llm_provider(requested_provider: Optional[str]) -> str:
    """Resolve provider selection with auto fallback.

    Priority:
      1) explicit request (openrouter)
      2) DEFAULT_LLM_PROVIDER when valid
      3) openrouter fallback
    """
    provider = (requested_provider or DEFAULT_LLM_PROVIDER or "openrouter").strip().lower()
    if provider != "openrouter":
        return "openrouter"
    return provider


def get_llm_context(requested_provider: Optional[str], requested_model: Optional[str]) -> Tuple[OpenAI, str, str]:
    """Return (client, provider, model) for a request."""
    provider = resolve_llm_provider(requested_provider)
    base_default = (requested_model or LLM_MODEL).strip() or LLM_MODEL
    model = get_runtime_model(base_default)
    return _build_openrouter_client(), provider, model
