"""Runtime model preference persistence for OpenRouter model selection."""

import json
import os
from pathlib import Path
from threading import Lock
from typing import Optional

_ROOT_DIR = Path(__file__).resolve().parent.parent
_MODEL_FILE = _ROOT_DIR / "data" / "runtime-model.json"
_ENV_FILE = _ROOT_DIR / ".env"
_LOCK = Lock()


def _normalize_model(model: str) -> str:
    value = (model or "").strip()
    if not value:
        raise ValueError("Model adı boş olamaz")
    if len(value) > 200:
        raise ValueError("Model adı çok uzun")
    return value


def _read_model_file() -> Optional[str]:
    if not _MODEL_FILE.exists():
        return None
    try:
        data = json.loads(_MODEL_FILE.read_text(encoding="utf-8"))
    except Exception:
        return None
    model = data.get("llm_model") if isinstance(data, dict) else None
    if not isinstance(model, str):
        return None
    model = model.strip()
    return model or None


def _write_model_file(model: str) -> None:
    _MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {"llm_model": model}
    _MODEL_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def _persist_model_to_env(model: str) -> None:
    lines = []
    if _ENV_FILE.exists():
        lines = _ENV_FILE.read_text(encoding="utf-8").splitlines()

    replaced = False
    for idx, line in enumerate(lines):
        if line.startswith("LLM_MODEL="):
            lines[idx] = f"LLM_MODEL={model}"
            replaced = True
            break

    if not replaced:
        if lines and lines[-1].strip() != "":
            lines.append("")
        lines.append(f"LLM_MODEL={model}")

    _ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


def get_runtime_model(default_model: str) -> str:
    """Read effective model preference: persisted file -> env -> default."""
    with _LOCK:
        file_model = _read_model_file()
        if file_model:
            return file_model

    env_model = (os.getenv("LLM_MODEL") or "").strip()
    if env_model:
        return env_model

    return _normalize_model(default_model)


def set_runtime_model(model: str) -> str:
    """Persist model preference to file and .env, then update process env."""
    normalized = _normalize_model(model)
    with _LOCK:
        _write_model_file(normalized)
        _persist_model_to_env(normalized)
    os.environ["LLM_MODEL"] = normalized
    return normalized
