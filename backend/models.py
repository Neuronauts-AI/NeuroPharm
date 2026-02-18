"""
Pydantic models for API request/response schemas.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class MedicationItem(BaseModel):
    id: str
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None


class AnalysisRequest(BaseModel):
    age: int
    gender: str
    conditions: List[str]
    currentMedications: List[MedicationItem]
    newMedications: List[MedicationItem]


class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]
    patient_info: Dict[str, Any]
    history: List[Dict[str, str]]


class PrefetchRequest(BaseModel):
    medications: List[str]
