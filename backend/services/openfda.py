"""
OpenFDA API client — drug data fetching, caching, and prefetching.
"""

import time
from typing import Any, Dict, List, Optional

import httpx

from backend.config import OPENFDA_BASE_URL

# In-memory cache  —  key: drug_name (lowercase), value: {"openfda_data": {…}, "timestamp": …}
FDA_DATA_CACHE: Dict[str, Dict[str, Any]] = {}


# ──────────────────── helpers ────────────────────


def limit_text_length(text: Any, max_len: int = 1500) -> Any:
    """Truncate text to save tokens."""
    if isinstance(text, str):
        return text[:max_len] + "... (kısaltıldı)" if len(text) > max_len else text
    elif isinstance(text, list):
        return [limit_text_length(item, max_len) for item in text]
    return text


# Turkish → US drug-name mapping (common equivalents)
_NAME_MAP = {
    "paracetamol": "acetaminophen",
    "asetaminofen": "acetaminophen",
    "adrenalin": "epinephrine",
    "kloramfenikol": "chloramphenicol",
}


# ──────────────────── core API ────────────────────


def search_openfda_by_drug(drug_name: str, minimal: bool = False) -> Dict[str, Any]:
    """
    Query the OpenFDA API for a single drug.

    Args:
        drug_name: Drug name (generic).
        minimal: If True, return only drug_interactions (for current medications).

    Returns:
        Filtered drug information dict.
    """
    try:
        search_name = _NAME_MAP.get(drug_name.lower(), drug_name)
        params = {"search": f'openfda.generic_name:"{search_name}"', "limit": 1}

        with httpx.Client(timeout=30.0) as client:
            response = client.get(OPENFDA_BASE_URL, params=params)

            if response.status_code != 200:
                return {"found": False, "drug_name": drug_name, "error": f"API error: {response.status_code}"}

            data = response.json()
            meta_last_updated = data.get("meta", {}).get("last_updated")

            if "results" not in data or not data["results"]:
                return {"found": False, "drug_name": drug_name, "message": "OpenFDA'da bulunamadı"}

            result = data["results"][0]

            if minimal:
                filtered = {
                    "drug_name": drug_name,
                    "search_name": search_name,
                    "generic_names": result.get("openfda", {}).get("generic_name", []),
                    "brand_names": result.get("openfda", {}).get("brand_name", []),
                    "drug_interactions": limit_text_length(result.get("drug_interactions", []), 2000),
                    "contraindications": [],
                    "boxed_warning": [],
                    "warnings_and_precautions": [],
                    "dosage_and_administration": [],
                    "geriatric_use": [],
                    "pregnancy": [],
                    "nursing_mothers": [],
                    "adverse_reactions": [],
                    "laboratory_tests": [],
                    "effective_time": result.get("effective_time", "20240101"),
                    "meta_last_updated": meta_last_updated,
                }
            else:
                filtered = {
                    "drug_name": drug_name,
                    "search_name": search_name,
                    "generic_names": result.get("openfda", {}).get("generic_name", []),
                    "brand_names": result.get("openfda", {}).get("brand_name", []),
                    "drug_interactions": limit_text_length(result.get("drug_interactions", [])),
                    "contraindications": limit_text_length(result.get("contraindications", [])),
                    "boxed_warning": limit_text_length(result.get("boxed_warning", [])),
                    "warnings_and_precautions": limit_text_length(result.get("warnings_and_precautions", [])),
                    "dosage_and_administration": limit_text_length(result.get("dosage_and_administration", [])),
                    "geriatric_use": limit_text_length(result.get("geriatric_use", [])),
                    "pregnancy": limit_text_length(result.get("pregnancy", [])),
                    "nursing_mothers": limit_text_length(result.get("nursing_mothers", [])),
                    "adverse_reactions": limit_text_length(result.get("adverse_reactions", [])),
                    "laboratory_tests": limit_text_length(result.get("laboratory_tests", [])),
                    "effective_time": result.get("effective_time", "20240101"),
                    "meta_last_updated": meta_last_updated,
                }

            return {"found": True, "data": filtered}

    except Exception as e:
        print(f"OpenFDA query error for {drug_name}: {e}")
        return {"found": False, "drug_name": drug_name, "error": "İlaç verileri alınırken bir hata oluştu."}


# ──────────────────── prefetch / cache ────────────────────


def prefetch_fda_data(drug_names: List[str]) -> Dict[str, Any]:
    """Pre-fetch FDA data for a list of drugs and cache the results."""
    cached_count = 0
    new_fetches = 0
    results = {}

    for drug_name in drug_names:
        drug_key = drug_name.lower().strip()

        if drug_key in FDA_DATA_CACHE:
            cached_count += 1
            results[drug_name] = {"status": "cached", "data": FDA_DATA_CACHE[drug_key]}
            continue

        openfda_result = search_openfda_by_drug(drug_name)

        FDA_DATA_CACHE[drug_key] = {
            "openfda_data": openfda_result,
            "timestamp": time.time(),
        }

        new_fetches += 1
        results[drug_name] = {"status": "fetched", "found": openfda_result.get("found", False)}

    return {"total": len(drug_names), "cached": cached_count, "new_fetches": new_fetches, "results": results}


# ──────────────────── analysis query ────────────────────


def analyze_drug_interactions_openfda(
    age: int,
    gender: str,
    conditions: List[str],
    current_medications: List[str],
    new_medications: List[str],
) -> Dict[str, Any]:
    """Collect OpenFDA data for all medications involved in the analysis."""
    results: Dict[str, Any] = {
        "patient_info": {"age": age, "gender": gender, "conditions": conditions, "is_elderly": age >= 65},
        "current_medications": current_medications,
        "new_medications": new_medications,
        "openfda_data": [],
    }

    # Current medications — minimal mode (interactions only)
    print("📋 Fetching current medications (minimal mode)...")
    for drug_name in current_medications:
        if not drug_name or not drug_name.strip():
            continue
        drug_key = drug_name.lower().strip()
        if drug_key in FDA_DATA_CACHE:
            print(f"  ✅ Using cached data for: {drug_name}")
            drug_info = FDA_DATA_CACHE[drug_key]["openfda_data"]
        else:
            print(f"  🌐 Fetching from OpenFDA (minimal): {drug_name}")
            drug_info = search_openfda_by_drug(drug_name.strip(), minimal=True)
        results["openfda_data"].append(drug_info)

    # New medications — full mode (all fields)
    print("💊 Fetching new medications (full mode)...")
    for drug_name in new_medications:
        if not drug_name or not drug_name.strip():
            continue
        drug_key = drug_name.lower().strip()
        if drug_key in FDA_DATA_CACHE:
            print(f"  ✅ Using cached data for: {drug_name}")
            drug_info = FDA_DATA_CACHE[drug_key]["openfda_data"]
        else:
            print(f"  🌐 Fetching from OpenFDA (full): {drug_name}")
            drug_info = search_openfda_by_drug(drug_name.strip(), minimal=False)
        results["openfda_data"].append(drug_info)

    return results
