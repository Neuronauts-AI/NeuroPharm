"""
Pydantic models for API request/response schemas.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


_ALLOWED_LLM_PROVIDERS = {"openrouter"}
_ALLOWED_LLM_MODELS = {
    "anthropic/claude-3.5-sonnet",
}


class MedicationItem(BaseModel):
    id: str = Field(..., max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    dosage: Optional[str] = Field(None, max_length=200)
    frequency: Optional[str] = Field(None, max_length=200)


class AnalysisRequest(BaseModel):
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., max_length=20)
    conditions: List[str] = Field(default_factory=list, max_length=30)
    currentMedications: List[MedicationItem] = Field(default_factory=list, max_length=50)
    newMedications: List[MedicationItem] = Field(default_factory=list, max_length=20)
    llm_provider: Optional[str] = Field(default="openrouter", max_length=20)
    llm_model: Optional[str] = Field(default="anthropic/claude-3.5-sonnet", max_length=120)

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        allowed = {"male", "female", "other", "erkek", "kadın"}
        if v.lower().strip() not in allowed:
            raise ValueError("Geçersiz cinsiyet değeri")
        return v.strip()

    @field_validator("conditions")
    @classmethod
    def validate_conditions(cls, v: List[str]) -> List[str]:
        return [c[:500] for c in v]

    @field_validator("llm_provider")
    @classmethod
    def validate_llm_provider(cls, v: Optional[str]) -> str:
        value = (v or "openrouter").strip().lower()
        if value not in _ALLOWED_LLM_PROVIDERS:
            raise ValueError("Geçersiz LLM provider")
        return value

    @field_validator("llm_model")
    @classmethod
    def validate_llm_model(cls, v: Optional[str]) -> str:
        value = (v or "anthropic/claude-3.5-sonnet").strip()
        if value not in _ALLOWED_LLM_MODELS:
            raise ValueError("Geçersiz LLM model")
        return value


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: Dict[str, Any] = Field(default_factory=dict)
    patient_info: Dict[str, Any] = Field(default_factory=dict)
    history: List[Dict[str, str]] = Field(default_factory=list, max_length=50)
    llm_provider: Optional[str] = Field(default="openrouter", max_length=20)
    llm_model: Optional[str] = Field(default="anthropic/claude-3.5-sonnet", max_length=120)

    @field_validator("llm_provider")
    @classmethod
    def validate_chat_llm_provider(cls, v: Optional[str]) -> str:
        value = (v or "openrouter").strip().lower()
        if value not in _ALLOWED_LLM_PROVIDERS:
            raise ValueError("Geçersiz LLM provider")
        return value

    @field_validator("llm_model")
    @classmethod
    def validate_chat_llm_model(cls, v: Optional[str]) -> str:
        value = (v or "anthropic/claude-3.5-sonnet").strip()
        if value not in _ALLOWED_LLM_MODELS:
            raise ValueError("Geçersiz LLM model")
        return value


class PrefetchRequest(BaseModel):
    medications: List[str] = Field(..., min_length=1, max_length=30)

    @field_validator("medications")
    @classmethod
    def validate_medications(cls, v: List[str]) -> List[str]:
        return [m[:200] for m in v if m.strip()]


# ── Feedback Models ──────────────────────────────────────
# Designed for clinical validation research:
#   - Precision/Recall of interaction detection
#   - Severity agreement between system & clinician
#   - Clinical relevance & novelty measurement
#   - Decision impact tracking
#   - False negative capture
#   - Alternative & monitoring quality
#   - Trust, usability, NPS


class FeedbackAnalysisContext(BaseModel):
    """Auto-captured snapshot of the analysis for segmentation & correlation."""
    patient_age: int = Field(..., ge=0, le=150)
    patient_gender: str = Field(..., max_length=20)
    conditions: List[str] = Field(default_factory=list, max_length=30)
    current_medication_count: int = Field(..., ge=0)
    new_medication_count: int = Field(..., ge=0)
    current_medications: List[str] = Field(default_factory=list, max_length=50)
    new_medications: List[str] = Field(default_factory=list, max_length=20)
    interactions_found: int = Field(..., ge=0)
    severity_distribution: Dict[str, int] = Field(default_factory=dict)
    has_alternatives: bool = False
    has_monitoring_plan: bool = False
    has_dosage_warnings: bool = False
    analysis_timestamp: str = Field(..., max_length=50)


class InteractionEvaluation(BaseModel):
    """Per-interaction clinical evaluation — enables precision/recall/severity metrics."""
    drugs: List[str] = Field(..., min_length=1, max_length=5)
    system_severity: str = Field(..., max_length=20)
    is_real_interaction: str = Field(..., max_length=20)     # true_positive / false_positive / uncertain
    clinician_severity: str = Field(..., max_length=20)      # none / low / moderate / high / critical
    clinical_relevance: str = Field(..., max_length=25)      # highly_relevant / somewhat_relevant / not_relevant
    was_already_known: bool
    action_taken: str = Field(..., max_length=30)            # none / dose_adjusted / drug_switched / drug_removed / monitoring_added / consulted

    @field_validator("is_real_interaction")
    @classmethod
    def validate_reality(cls, v: str) -> str:
        if v not in {"true_positive", "false_positive", "uncertain"}:
            raise ValueError("Geçersiz değer")
        return v

    @field_validator("clinician_severity")
    @classmethod
    def validate_clinician_severity(cls, v: str) -> str:
        if v not in {"none", "low", "moderate", "high", "critical"}:
            raise ValueError("Geçersiz değer")
        return v

    @field_validator("clinical_relevance")
    @classmethod
    def validate_relevance(cls, v: str) -> str:
        if v not in {"highly_relevant", "somewhat_relevant", "not_relevant"}:
            raise ValueError("Geçersiz değer")
        return v

    @field_validator("action_taken")
    @classmethod
    def validate_action(cls, v: str) -> str:
        if v not in {"none", "dose_adjusted", "drug_switched", "drug_removed", "monitoring_added", "consulted"}:
            raise ValueError("Geçersiz değer")
        return v


class QuickFeedbackRequest(BaseModel):
    """Layer 1 — Post-analysis instant feedback (<1 min).
    Captures per-interaction accuracy + missed interactions + overall impression.
    """
    analysis_id: str = Field(..., max_length=100)
    context: FeedbackAnalysisContext
    # Overall assessment
    overall_alignment: str = Field(..., max_length=30)       # aligned / partially_aligned / not_aligned
    new_information_gained: bool
    # Per-interaction evaluations
    interaction_evaluations: List[InteractionEvaluation] = Field(default_factory=list, max_length=30)
    # False negatives
    has_missed_interactions: bool
    missed_interaction_details: Optional[str] = Field(None, max_length=2000)
    missed_interaction_drugs: Optional[List[str]] = Field(None, max_length=10)
    missed_interaction_severity: Optional[str] = Field(None, max_length=20)
    # Quality of recommendations
    alternatives_appropriate: Optional[str] = Field(None, max_length=10)   # yes / partial / no / na
    monitoring_appropriate: Optional[str] = Field(None, max_length=10)     # yes / partial / no / na
    # Auto-tracked
    time_spent_seconds: Optional[int] = Field(None, ge=0, le=3600)

    @field_validator("overall_alignment")
    @classmethod
    def validate_alignment(cls, v: str) -> str:
        if v not in {"aligned", "partially_aligned", "not_aligned"}:
            raise ValueError("Geçersiz değer")
        return v


class SessionFeedbackRequest(BaseModel):
    """Layer 2 — End-of-session detailed feedback (~2 min).
    Captures decision impact, trust, usability, NPS.
    """
    session_id: str = Field(..., max_length=100)
    analysis_id: str = Field(..., max_length=100)
    # Decision tracking
    prescription_changed: bool
    change_type: Optional[str] = Field(None, max_length=30)     # drug_switched / dose_adjusted / drug_removed / monitoring_added / multiple_changes
    change_details: Optional[str] = Field(None, max_length=2000)
    change_trigger: Optional[str] = Field(None, max_length=30)  # system_warning / own_knowledge / colleague_advice / guidelines / other
    no_change_reason: Optional[str] = Field(None, max_length=30)  # already_managed / not_clinically_relevant / patient_specific / benefit_outweighs_risk / distrust_system / other
    # Quantitative scores
    benefit_score: int = Field(..., ge=1, le=5)
    trust_score: int = Field(..., ge=1, le=5)
    explanation_quality: int = Field(..., ge=1, le=5)
    recommendation_score: int = Field(..., ge=1, le=10)         # NPS scale
    # Usability
    response_time_acceptable: bool
    information_completeness: str = Field(..., max_length=20)   # complete / mostly_complete / incomplete
    # Qualitative
    most_useful_feature: Optional[str] = Field(None, max_length=500)
    improvement_suggestion: Optional[str] = Field(None, max_length=2000)
    free_comment: Optional[str] = Field(None, max_length=2000)
