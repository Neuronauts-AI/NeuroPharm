"""Analysis routes — /analyze and /analyze/file."""

import json
import time

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from backend.logger import get_logger

# Max file upload size: 10 MB
_MAX_FILE_SIZE = 10 * 1024 * 1024
_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
from backend.models import AnalysisRequest
from backend.services.anamnesis import extract_patient_info_from_text, read_file_content
from backend.services.llm import analyze_with_openai_agent

router = APIRouter()

_ERROR_RESPONSE = {
    "results_found": False,
    "clinical_summary": "",
    "interaction_details": [],
    "alternatives": [],
    "monitoring_plan": [],
    "dosage_warnings": None,
    "special_population_alerts": None,
    "patient_safety_notes": None,
}


@router.post("/analyze")
async def analyze(request: AnalysisRequest, req: Request):
    """Run the full drug-interaction analysis pipeline."""
    logger = get_logger()
    start_time = time.time()

    try:
        result_and_pipeline = analyze_with_openai_agent(
            age=request.age,
            gender=request.gender,
            conditions=request.conditions,
            current_medications=[
                {"name": med.name, "dosage": med.dosage or "N/A"}
                for med in request.currentMedications
            ],
            new_medications=[
                {"name": med.name, "dosage": med.dosage or "N/A"}
                for med in request.newMedications
            ],
            track_pipeline=logger.enabled,
        )

        if logger.enabled:
            result, pipeline_steps = result_and_pipeline
        else:
            result = result_and_pipeline
            pipeline_steps = []

        if logger.enabled:
            processing_time_ms = (time.time() - start_time) * 1000
            client_ip = req.client.host if req.client else "unknown"
            user_agent = req.headers.get("user-agent", "unknown")
            logger.log_request(
                endpoint="/analyze",
                method="POST",
                client_ip=client_ip,
                user_agent=user_agent,
                request_data=request.model_dump(),
                response_data=result,
                status_code=200,
                processing_time_ms=processing_time_ms,
                pipeline_steps=pipeline_steps,
            )

        return result

    except Exception as e:
        if logger.enabled:
            client_ip = req.client.host if req.client else "unknown"
            logger.log_error(
                endpoint="/analyze",
                method="POST",
                client_ip=client_ip,
                error_message=str(e),
                error_type=type(e).__name__,
                request_data=request.model_dump(),
            )
        print(f"Analysis error: {e}")
        return {**_ERROR_RESPONSE, "clinical_summary": "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin."}


@router.post("/analyze/file")
async def analyze_file(
    file: UploadFile = File(...),
    new_medications_json: str = Form(...),
    req: Request = None,
):
    """Analyse an uploaded anamnesis document."""
    logger = get_logger()
    start_time = time.time()

    try:
        # 0. Validate file
        filename = (file.filename or "").lower()
        ext = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""
        if ext not in _ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Desteklenmeyen dosya formatı. PDF, DOCX veya TXT yükleyin.")

        # 1. Read file (with size limit)
        content = await file.read()
        if len(content) > _MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Dosya boyutu çok büyük. Maksimum 10 MB.")
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Dosya boş.")

        anamnesis_text = read_file_content(file, content)
        if anamnesis_text.startswith("Error"):
            raise HTTPException(status_code=400, detail="Dosya okunamadı. Lütfen farklı bir dosya deneyin.")

        # 2. Extract patient info
        extracted_info = extract_patient_info_from_text(anamnesis_text)

        # 3. Parse new medications
        try:
            new_meds_list = json.loads(new_medications_json)
        except Exception:
            new_meds_list = []

        # 4. Run analysis
        result_and_pipeline = analyze_with_openai_agent(
            age=extracted_info.get("age", 45),
            gender=extracted_info.get("gender", "male"),
            conditions=extracted_info.get("conditions", []),
            current_medications=extracted_info.get("current_medications", []),
            new_medications=new_meds_list,
            track_pipeline=logger.enabled,
        )

        if logger.enabled:
            result, pipeline_steps = result_and_pipeline
        else:
            result = result_and_pipeline
            pipeline_steps = []

        result["extracted_patient_info"] = extracted_info

        if logger.enabled:
            processing_time_ms = (time.time() - start_time) * 1000
            client_ip = req.client.host if req.client else "unknown"
            logger.log_request(
                endpoint="/analyze/file",
                method="POST",
                client_ip=client_ip,
                user_agent="web-client",
                request_data={"filename": file.filename, "new_medications": new_meds_list},
                response_data=result,
                status_code=200,
                processing_time_ms=processing_time_ms,
                pipeline_steps=pipeline_steps,
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"File analysis error: {e}")
        return {"clinical_summary": "Dosya analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.", "interaction_details": [], "results_found": False}
