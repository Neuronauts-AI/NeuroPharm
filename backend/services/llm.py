"""
LLM evaluation service — system prompt, OpenFDA evaluation, and main analysis pipeline.
"""

import json
import time
from typing import Any, Dict, List

from backend.config import llm_client, LLM_MODEL
from backend.services.openfda import analyze_drug_interactions_openfda


# ──────────────────── system prompt ────────────────────

SYSTEM_PROMPT = """You are a clinical pharmacist expert system. Your task is to analyze drug interactions and return ONLY a valid JSON object.

CRITICAL: Return ONLY the JSON object. Do not include any explanatory text, comments, or markdown formatting before or after the JSON.

ANALYSIS PRINCIPLES:
1. STRICTLY COMPARTMENTALIZE INFO - DO NOT REPEAT CONTENT.
2. Clinical Summary: HIGH-LEVEL overview ONLY. No specific dosage numbers or granular side effect lists here.
3. Dosage Warnings: The ONLY place for dosage adjustments and specific dosage limits.
4. Patient Safety: The ONLY place for side effects and red flags.

OUTPUT FORMAT - Return this exact JSON structure in Turkish:
{
  "results_found": true/false,
  "clinical_summary": "1-2 sentence high-level summary of the INTERACTION mechanism and main clinical concern. DO NOT include dosage numbers here. DO NOT list all side effects here.",
  "interaction_details": [
    {
      "drugs": ["Drug1", "Drug2"],
      "severity": "High/Medium",
      "mechanism": "Brief mechanism of interaction 1-2 sentences "
    }
  ],
  "alternatives": [
    {
      "original_drug": "EXACT DRUG NAME ONLY (e.g. 'Parol'). Do NOT include dosage, comments or parenthesis.",
      "suggested_alternative": "SINGLE DRUG NAME ONLY (e.g. 'Ibuprofen'). If you have multiple suggestions, create SEPARATE objects for each.",
      "reason": "Why safer?"
    }
  ],
  "monitoring_plan": [
    {
      "test": "Test name",
      "frequency": "Frequency",
      "reason": "Reason"
    }
  ],
  "dosage_warnings": ["ALL dosage related warnings, adjustments, and maximum dose limits GO HERE. Do not put them in clinical summary."],
  "special_population_alerts": ["Pregnancy, elderly warnings"],
  "patient_safety_notes": {
    "normal_side_effects": "Common manageble side effects",
    "red_flags": "Serious symptoms requiring immediate medical attention"
  }
}

CRITICAL RULES:
- Output language: TURKISH for all text fields
- Return ONLY the JSON object
- NO MARKDOWN PREAMBLE OR POSTSCRIPT
- SEPARATE ALTERNATIVES into individual objects. Do not say "X or Y".
"""


# ──────────────────── evaluate ────────────────────

_FALLBACK_RESPONSE: Dict[str, Any] = {
    "results_found": False,
    "clinical_summary": "",
    "interaction_details": [],
    "alternatives": [],
    "monitoring_plan": [],
    "dosage_warnings": None,
    "special_population_alerts": None,
    "patient_safety_notes": None,
}


def _extract_json(content: str) -> dict:
    """Extract a JSON object from potentially messy LLM output."""
    # Strip markdown fences
    if "```" in content:
        content = content.replace("```json", "").replace("```", "").strip()

    start = content.find("{")
    if start == -1:
        raise ValueError("No JSON object found in response")

    depth = 0
    end = start
    for i in range(start, len(content)):
        if content[i] == "{":
            depth += 1
        elif content[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break

    return json.loads(content[start:end])


def evaluate_with_openai(openfda_data: Dict[str, Any]) -> Dict[str, Any]:
    """Send OpenFDA data to the LLM for clinical evaluation and return structured JSON."""
    user_message = f"""
Based on this OpenFDA API data, provide comprehensive clinical drug interaction evaluation:

{json.dumps(openfda_data, indent=2, ensure_ascii=False)}

Analyze all medication combinations and return your evaluation in the specified JSON format.
Focus on:
1. Drug-drug interactions between current and new medications
2. Contraindications and warnings
3. Patient-specific risks (age, conditions)
4. Monitoring recommendations
"""

    try:
        response = llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        print(f"🤖 Raw AI Response: {content[:100]}...")

        try:
            return _extract_json(content)
        except (ValueError, json.JSONDecodeError):
            return json.loads(content)

    except Exception as e:
        print(f"OpenAI evaluation error: {e}")
        return {**_FALLBACK_RESPONSE, "clinical_summary": f"OpenAI değerlendirme hatası: {e}"}


# ──────────────────── main pipeline ────────────────────


def _extract_latest_date(openfda_data: Dict[str, Any]) -> str:
    """Extract the latest update date from OpenFDA data."""
    latest_date = "01.01.2024"  # default

    try:
        items = openfda_data.get("openfda_data", [])

        # Priority 1: meta.last_updated
        meta_dates = [
            item["data"]["meta_last_updated"]
            for item in items
            if item.get("found") and item.get("data", {}).get("meta_last_updated")
        ]
        if meta_dates:
            meta_dates.sort(reverse=True)
            parts = meta_dates[0].split("-")
            if len(parts) == 3:
                return f"{parts[2]}.{parts[1]}.{parts[0]}"

        # Priority 2: effective_time
        dates = [
            item["data"]["effective_time"][:8]
            for item in items
            if item.get("found") and "effective_time" in item.get("data", {})
            and isinstance(item["data"]["effective_time"], str)
            and len(item["data"]["effective_time"]) >= 8
        ]
        if dates:
            dates.sort(reverse=True)
            ds = dates[0]
            latest_date = f"{ds[6:8]}.{ds[4:6]}.{ds[0:4]}"
            print(f"✅ Using effective_time: {latest_date}")
        else:
            print("ℹ️ No date found in OpenFDA data, using default")

    except Exception as e:
        print(f"Date parsing error: {e}")

    return latest_date


def analyze_with_openai_agent(
    age: int,
    gender: str,
    conditions: List[str],
    current_medications: List[Dict],
    new_medications: List[Dict],
    track_pipeline: bool = False,
) -> tuple:
    """
    Main analysis pipeline:
      1. Fetch OpenFDA data
      2. Evaluate with LLM
      3. Return structured result

    Returns:
        (result, pipeline_steps) if track_pipeline else result
    """
    pipeline_steps: list = []

    current_med_names = [m["name"] for m in current_medications if m.get("name")]
    new_med_names = [m["name"] for m in new_medications if m.get("name")]

    # Step 1 — OpenFDA data
    print("🌐 Collecting OpenFDA data (Direct)...")
    t0 = time.time()

    openfda_data = analyze_drug_interactions_openfda(
        age=age,
        gender=gender,
        conditions=conditions,
        current_medications=current_med_names,
        new_medications=new_med_names,
    )

    step1_ms = (time.time() - t0) * 1000

    if track_pipeline:
        pipeline_steps.append({
            "step": 1,
            "name": "OpenFDA Data Collection",
            "description": "Direct OpenFDA API query for medication data",
            "input": {
                "age": age, "gender": gender, "conditions": conditions,
                "current_medications": current_med_names, "new_medications": new_med_names,
            },
            "output": openfda_data,
            "processing_time_ms": round(step1_ms, 2),
        })

    # Step 2 — LLM evaluation
    print("🤖 LLM Agent: Evaluating OpenFDA data...")
    t1 = time.time()

    evaluation = evaluate_with_openai(openfda_data)

    step2_ms = (time.time() - t1) * 1000

    if track_pipeline:
        log_input = {
            "patient_info": openfda_data.get("patient_info", {}),
            "current_medications": openfda_data.get("current_medications", []),
            "new_medications": openfda_data.get("new_medications", []),
            "openfda_data_summary": {
                "total_drugs": len(openfda_data.get("openfda_data", [])),
                "drugs": [
                    {
                        "name": (item.get("data", {}).get("drug_name", "unknown")
                                 if item.get("found") else item.get("drug_name", "unknown")),
                        "found": item.get("found", False),
                        "has_interactions": bool(item.get("data", {}).get("drug_interactions")),
                        "has_contraindications": bool(item.get("data", {}).get("contraindications")),
                        "data_size_kb": round(len(str(item.get("data", {}))) / 1024, 2) if item.get("found") else 0,
                    }
                    for item in openfda_data.get("openfda_data", [])
                ],
            },
        }
        pipeline_steps.append({
            "step": 2,
            "name": "Clinical Agent Analysis",
            "description": "Claude Sonnet Assessment with Full OpenFDA Context",
            "input": log_input,
            "output": evaluation,
            "processing_time_ms": round(step2_ms, 2),
        })

    # Inject latest update date
    if isinstance(evaluation, dict):
        evaluation["last_updated"] = _extract_latest_date(openfda_data)

    return (evaluation, pipeline_steps) if track_pipeline else evaluation
