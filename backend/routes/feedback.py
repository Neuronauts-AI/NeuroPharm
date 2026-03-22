"""Feedback routes — clinical validation data collection & analytics.

Endpoints:
  POST /feedback/quick    — Layer 1: per-interaction accuracy + context
  POST /feedback/session  — Layer 2: decision impact + scores + NPS
  GET  /feedback/stats    — Aggregated clinical metrics
  GET  /feedback/list     — Raw entries (filterable)
  GET  /feedback/export   — Full data export for research
"""

import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Query

from backend.models import QuickFeedbackRequest, SessionFeedbackRequest

router = APIRouter(prefix="/feedback")

FEEDBACK_DIR = Path("backend_logs/feedback")
FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)


# ── Helpers ──────────────────────────────────────────────


def _save_feedback(feedback_type: str, data: Dict[str, Any]) -> str:
    """Persist a feedback entry as JSON."""
    feedback_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now()

    entry = {
        "feedback_id": feedback_id,
        "type": feedback_type,
        "timestamp": timestamp.isoformat(),
        **data,
    }

    filename = f"{timestamp.strftime('%Y-%m-%d_%H-%M-%S')}__{feedback_type}_{feedback_id}.json"
    path = FEEDBACK_DIR / filename

    with open(path, "w", encoding="utf-8") as f:
        json.dump(entry, f, indent=2, ensure_ascii=False)

    return feedback_id


def _safe_avg(values: List[float]) -> Optional[float]:
    return round(sum(values) / len(values), 2) if values else None


def _severity_maps_match(system_sev: str, clinician_sev: str) -> bool:
    """Check if system severity roughly matches clinician severity."""
    system_map = {
        "high": {"high", "critical"},
        "medium": {"moderate"},
        "low": {"low", "none"},
    }
    expected = system_map.get(system_sev.lower(), set())
    return clinician_sev.lower() in expected


# ── Endpoints ────────────────────────────────────────────


@router.post("/quick")
async def submit_quick_feedback(request: QuickFeedbackRequest):
    """Layer 1: Post-analysis feedback with per-interaction evaluation."""
    data = request.model_dump()
    feedback_id = _save_feedback("quick", data)
    return {"success": True, "feedback_id": feedback_id}


@router.post("/session")
async def submit_session_feedback(request: SessionFeedbackRequest):
    """Layer 2: End-of-session detailed feedback."""
    data = request.model_dump()
    feedback_id = _save_feedback("session", data)
    return {"success": True, "feedback_id": feedback_id}


@router.get("/stats")
async def get_feedback_stats():
    """Aggregated clinical metrics for dashboard."""
    quick_files = list(FEEDBACK_DIR.glob("*__quick_*.json"))
    session_files = list(FEEDBACK_DIR.glob("*__session_*.json"))

    # ── Quick Feedback Aggregation ────────────────────

    true_positives = 0
    false_positives = 0
    uncertain_count = 0
    total_evaluated = 0

    severity_matches = 0
    severity_total = 0
    clinician_severity_dist: Dict[str, int] = {}

    relevance: Dict[str, int] = {"highly_relevant": 0, "somewhat_relevant": 0, "not_relevant": 0}

    known_count = 0
    novel_count = 0
    info_gained_yes = 0
    info_gained_no = 0

    actions: Dict[str, int] = {}
    alignment: Dict[str, int] = {"aligned": 0, "partially_aligned": 0, "not_aligned": 0}

    sessions_with_missed = 0
    missed_details: List[Dict[str, Any]] = []

    alt_quality: Dict[str, int] = {"yes": 0, "partial": 0, "no": 0, "na": 0}
    mon_quality: Dict[str, int] = {"yes": 0, "partial": 0, "no": 0, "na": 0}

    time_values: List[int] = []
    age_values: List[int] = []
    med_count_values: List[int] = []

    for fpath in quick_files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                entry = json.load(f)

            a = entry.get("overall_alignment", "")
            if a in alignment:
                alignment[a] += 1

            if entry.get("new_information_gained"):
                info_gained_yes += 1
            else:
                info_gained_no += 1

            for ie in entry.get("interaction_evaluations", []):
                total_evaluated += 1
                reality = ie.get("is_real_interaction", "")
                if reality == "true_positive":
                    true_positives += 1
                elif reality == "false_positive":
                    false_positives += 1
                else:
                    uncertain_count += 1

                sys_sev = ie.get("system_severity", "")
                clin_sev = ie.get("clinician_severity", "")
                severity_total += 1
                if _severity_maps_match(sys_sev, clin_sev):
                    severity_matches += 1
                clinician_severity_dist[clin_sev] = clinician_severity_dist.get(clin_sev, 0) + 1

                rel = ie.get("clinical_relevance", "")
                if rel in relevance:
                    relevance[rel] += 1

                if ie.get("was_already_known"):
                    known_count += 1
                else:
                    novel_count += 1

                action = ie.get("action_taken", "none")
                actions[action] = actions.get(action, 0) + 1

            if entry.get("has_missed_interactions"):
                sessions_with_missed += 1
                m_entry: Dict[str, Any] = {
                    "analysis_id": entry.get("analysis_id"),
                    "timestamp": entry.get("timestamp"),
                }
                d = entry.get("missed_interaction_details")
                if d:
                    m_entry["details"] = d
                dr = entry.get("missed_interaction_drugs")
                if dr:
                    m_entry["drugs"] = dr
                s = entry.get("missed_interaction_severity")
                if s:
                    m_entry["severity"] = s
                missed_details.append(m_entry)

            alt = entry.get("alternatives_appropriate", "na") or "na"
            if alt in alt_quality:
                alt_quality[alt] += 1

            mon = entry.get("monitoring_appropriate", "na") or "na"
            if mon in mon_quality:
                mon_quality[mon] += 1

            ts = entry.get("time_spent_seconds")
            if ts is not None:
                time_values.append(ts)

            ctx = entry.get("context", {})
            if ctx.get("patient_age"):
                age_values.append(ctx["patient_age"])
            total_meds = ctx.get("current_medication_count", 0) + ctx.get("new_medication_count", 0)
            if total_meds > 0:
                med_count_values.append(total_meds)

        except Exception:
            continue

    precision = None
    if (true_positives + false_positives) > 0:
        precision = round(true_positives / (true_positives + false_positives), 4)

    severity_agreement = None
    if severity_total > 0:
        severity_agreement = round(severity_matches / severity_total, 4)

    # ── Session Feedback Aggregation ──────────────────

    benefit_scores: List[int] = []
    trust_scores: List[int] = []
    explanation_scores: List[int] = []
    nps_scores: List[int] = []

    changed = 0
    not_changed = 0
    change_types: Dict[str, int] = {}
    change_triggers: Dict[str, int] = {}
    no_change_reasons: Dict[str, int] = {}

    rt_acceptable = 0
    rt_not_acceptable = 0
    completeness: Dict[str, int] = {"complete": 0, "mostly_complete": 0, "incomplete": 0}

    useful_features: List[str] = []
    improvement_suggestions: List[str] = []
    free_comments: List[str] = []

    for fpath in session_files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                entry = json.load(f)

            benefit_scores.append(entry.get("benefit_score", 0))
            trust_scores.append(entry.get("trust_score", 0))
            explanation_scores.append(entry.get("explanation_quality", 0))
            nps_scores.append(entry.get("recommendation_score", 0))

            if entry.get("prescription_changed"):
                changed += 1
                ct = entry.get("change_type", "unknown")
                change_types[ct] = change_types.get(ct, 0) + 1
                trigger = entry.get("change_trigger", "unknown")
                change_triggers[trigger] = change_triggers.get(trigger, 0) + 1
            else:
                not_changed += 1
                reason = entry.get("no_change_reason", "unknown")
                no_change_reasons[reason] = no_change_reasons.get(reason, 0) + 1

            if entry.get("response_time_acceptable"):
                rt_acceptable += 1
            else:
                rt_not_acceptable += 1

            comp = entry.get("information_completeness", "")
            if comp in completeness:
                completeness[comp] += 1

            uf = entry.get("most_useful_feature")
            if uf:
                useful_features.append(uf)
            imp = entry.get("improvement_suggestion")
            if imp:
                improvement_suggestions.append(imp)
            fc = entry.get("free_comment")
            if fc:
                free_comments.append(fc)

        except Exception:
            continue

    nps = None
    if nps_scores:
        promoters = sum(1 for s in nps_scores if s >= 9)
        detractors = sum(1 for s in nps_scores if s <= 6)
        total_nps = len(nps_scores)
        nps = round((promoters - detractors) / total_nps * 100, 1)

    return {
        "total_quick": len(quick_files),
        "total_session": len(session_files),
        "accuracy": {
            "total_interactions_evaluated": total_evaluated,
            "true_positives": true_positives,
            "false_positives": false_positives,
            "uncertain": uncertain_count,
            "precision": precision,
            "severity_agreement_rate": severity_agreement,
            "clinician_severity_distribution": clinician_severity_dist,
        },
        "clinical_relevance": relevance,
        "novelty": {
            "already_known": known_count,
            "novel_to_clinician": novel_count,
            "sessions_info_gained": info_gained_yes,
            "sessions_no_info_gained": info_gained_no,
        },
        "actions_taken": actions,
        "overall_alignment": alignment,
        "false_negatives": {
            "sessions_with_missed": sessions_with_missed,
            "rate": round(sessions_with_missed / len(quick_files), 4) if quick_files else None,
            "details": missed_details[-20:],
        },
        "alternatives_quality": alt_quality,
        "monitoring_quality": mon_quality,
        "avg_time_spent_seconds": _safe_avg(time_values),
        "session_scores": {
            "avg_benefit": _safe_avg(benefit_scores),
            "avg_trust": _safe_avg(trust_scores),
            "avg_explanation": _safe_avg(explanation_scores),
            "avg_recommendation": _safe_avg(nps_scores),
            "nps": nps,
        },
        "decision_impact": {
            "prescription_changed": changed,
            "prescription_not_changed": not_changed,
            "change_rate": round(changed / (changed + not_changed), 4) if (changed + not_changed) > 0 else None,
            "change_types": change_types,
            "change_triggers": change_triggers,
            "no_change_reasons": no_change_reasons,
        },
        "usability": {
            "response_time_acceptable": rt_acceptable,
            "response_time_not_acceptable": rt_not_acceptable,
            "information_completeness": completeness,
        },
        "qualitative": {
            "useful_features": useful_features[-15:],
            "improvement_suggestions": improvement_suggestions[-15:],
            "free_comments": free_comments[-15:],
        },
        "context_summary": {
            "avg_patient_age": _safe_avg(age_values),
            "avg_total_medications": _safe_avg(med_count_values),
        },
    }


@router.get("/list")
async def list_feedbacks(
    feedback_type: Optional[str] = Query(None, pattern="^(quick|session)$"),
    limit: int = Query(50, ge=1, le=500),
):
    """List recent feedback entries, optionally filtered by type."""
    pattern = f"*__{feedback_type}_*.json" if feedback_type else "*__*_*.json"
    files = sorted(FEEDBACK_DIR.glob(pattern), reverse=True)[:limit]

    results = []
    for fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                results.append(json.load(f))
        except Exception:
            continue

    return {"count": len(results), "feedbacks": results}


@router.get("/export")
async def export_feedback_data():
    """Full data export for external analysis."""
    all_files = sorted(FEEDBACK_DIR.glob("*.json"), reverse=True)

    quick_entries = []
    session_entries = []

    for fpath in all_files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                entry = json.load(f)
            if entry.get("type") == "quick":
                quick_entries.append(entry)
            elif entry.get("type") == "session":
                session_entries.append(entry)
        except Exception:
            continue

    return {
        "exported_at": datetime.now().isoformat(),
        "quick_feedbacks": quick_entries,
        "session_feedbacks": session_entries,
        "total": len(quick_entries) + len(session_entries),
    }
