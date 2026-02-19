"""
Configuration and client initialization.
Loads environment variables and creates the LLM client.
"""

import os
from pathlib import Path
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
OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"
LLM_MODEL = "anthropic/claude-sonnet-4.6"

# FAL AI client (OpenRouter proxy, OpenAI-compatible)
llm_client = OpenAI(
    base_url="https://fal.run/openrouter/router/openai/v1",
    api_key="not-needed",
    default_headers={
        "Authorization": f"Key {FAL_KEY}",
    },
)
