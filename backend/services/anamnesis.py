"""
Anamnesis document parsing and patient info extraction.
"""

import io
import json
from typing import Any, Dict

from fastapi import UploadFile

from backend.config import llm_client, LLM_MODEL

try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None


def read_file_content(file: UploadFile, content: bytes) -> str:
    """Extract text from a PDF, Word, or plain-text file."""
    text = ""
    filename = file.filename.lower()

    try:
        if filename.endswith(".pdf"):
            if not pypdf:
                return "Error: Gerekli kütüphane yüklenemedi."
            reader = pypdf.PdfReader(io.BytesIO(content))
            for page in reader.pages:
                text += page.extract_text() + "\n"

        elif filename.endswith(".docx") or filename.endswith(".doc"):
            if not docx:
                return "Error: Gerekli kütüphane yüklenemedi."
            doc = docx.Document(io.BytesIO(content))
            for para in doc.paragraphs:
                text += para.text + "\n"

        elif filename.endswith(".txt"):
            text = content.decode("utf-8")

        return text.strip()
    except Exception as e:
        print(f"File reading error: {e}")
        return "Error: Dosya okunamadı."


_EXTRACTION_PROMPT = """You are a medical AI assistant. Extract patient information from the anamnesis text.
Return a JSON object with this EXACT structure:
{
  "age": int (default 45 if unknown),
  "gender": "male" or "female" (default "male" if unknown),
  "conditions": ["List", "of", "diagnosed", "diseases"],
  "current_medications": [{"name": "Drug Name", "dosage": "if available"}]
}
If information is missing, make a reasonable guess or use defaults.
Extract ONLY explicit current medications used by the patient.
"""


def extract_patient_info_from_text(anamnesis_text: str) -> Dict[str, Any]:
    """Use the LLM to extract structured patient info from free-text anamnesis."""
    try:
        response = llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": _EXTRACTION_PROMPT},
                {"role": "user", "content": f"Extract info from this text:\n\n{anamnesis_text}"},
            ],
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Extraction error: {e}")
        return {"age": 45, "gender": "male", "conditions": [], "current_medications": []}
