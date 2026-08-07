"""
Configuration and client initialization.
Loads environment variables and creates the LLM client.

LLM provider resolution:
  1. OPENROUTER_API_KEY        → OpenRouter (https://openrouter.ai/api/v1)
  2. FAL_KEY holding sk-or-... → OpenRouter too (deployments that reused the old
                                 variable name for their OpenRouter key)
  3. FAL_KEY holding a FAL key → FAL AI proxy (legacy)
  4. neither                   → client is created but unconfigured; calls fail gracefully
"""

import os
from pathlib import Path
from openai import OpenAI


def load_env():
    """Load the project-root .env file without overriding real environment variables."""
    env_path = Path(__file__).parent.parent / ".env"
    if not env_path.exists():
        return

    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            # Platform env vars (Railway, Docker, CI) win over the .env file
            os.environ.setdefault(key, value)


load_env()

# ──────────────────── API keys & URLs ────────────────────

OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"

OPENROUTER_API_KEY = (os.getenv("OPENROUTER_API_KEY") or "").strip() or None
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

# Legacy FAL AI proxy variable. Some deployments keep their OpenRouter key here —
# a value starting with "sk-or-" is therefore treated as an OpenRouter key.
FAL_KEY = (os.getenv("FAL_KEY") or "").strip() or None

# OpenRouter API keys always carry this prefix
_OPENROUTER_KEY_PREFIX = "sk-or-"

# OpenRouter model slug (see https://openrouter.ai/models)
LLM_MODEL = os.getenv("LLM_MODEL", "anthropic/claude-sonnet-4.6")

# OpenRouter attribution headers (optional, shown on openrouter.ai dashboards)
APP_PUBLIC_URL = os.getenv("APP_PUBLIC_URL", "https://github.com/Neuronauts-AI/NeuroPharm")
APP_TITLE = os.getenv("APP_TITLE", "NeuroPharm — Drug Interaction Analysis")


# ──────────────────── LLM client ────────────────────


def _openrouter_key() -> str | None:
    """Return the OpenRouter key from either supported variable."""
    if OPENROUTER_API_KEY:
        return OPENROUTER_API_KEY
    # FAL_KEY slot reused for an OpenRouter key (existing Railway deployments)
    if FAL_KEY and FAL_KEY.startswith(_OPENROUTER_KEY_PREFIX):
        print("ℹ️  FAL_KEY contains an OpenRouter key — using OpenRouter directly.")
        return FAL_KEY
    return None


def _build_llm_client() -> tuple:
    """Create the OpenAI-compatible LLM client for the configured provider."""
    openrouter_key = _openrouter_key()

    if openrouter_key:
        client = OpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=openrouter_key,
            default_headers={
                "HTTP-Referer": APP_PUBLIC_URL,
                "X-Title": APP_TITLE,
            },
        )
        return client, "openrouter"

    if FAL_KEY:
        client = OpenAI(
            base_url="https://fal.run/openrouter/router/openai/v1",
            api_key="not-needed",
            default_headers={
                "Authorization": f"Key {FAL_KEY}",
            },
        )
        return client, "fal"

    # No key configured — build a placeholder so imports still work.
    # Requests will fail and each service falls back to its error message.
    print("⚠️  No OPENROUTER_API_KEY (or FAL_KEY) set — LLM calls will fail.")
    return OpenAI(base_url=OPENROUTER_BASE_URL, api_key="missing-api-key"), "unconfigured"


llm_client, LLM_PROVIDER = _build_llm_client()
LLM_CONFIGURED = LLM_PROVIDER != "unconfigured"

print(f"🧠 LLM provider: {LLM_PROVIDER} | model: {LLM_MODEL}")
