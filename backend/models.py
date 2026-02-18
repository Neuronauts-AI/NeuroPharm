"""
Pydantic models for API request/response schemas.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


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


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    context: Dict[str, Any] = Field(default_factory=dict)
    patient_info: Dict[str, Any] = Field(default_factory=dict)
    history: List[Dict[str, str]] = Field(default_factory=list, max_length=50)


class PrefetchRequest(BaseModel):
    medications: List[str] = Field(..., min_length=1, max_length=30)

    @field_validator("medications")
    @classmethod
    def validate_medications(cls, v: List[str]) -> List[str]:
        return [m[:200] for m in v if m.strip()]
