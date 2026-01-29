"""
OpenAI Agent + OpenFDA API (Direct Integration)
İlaç etkileşim analizi için:
1. OpenFDA API: Direkt veri çekme (Ollama kaldırıldı)
2. OpenAI GPT-4: Klinik değerlendirme
"""

import os
import json
import httpx
from typing import Optional, List, Dict, Any
from pathlib import Path
from openai import OpenAI
from pydantic import BaseModel
from fastapi import UploadFile, File, Form, HTTPException
import io
try:
    import pypdf
except ImportError:
    pypdf = None
try:
    import docx
except ImportError:
    docx = None

# .env dosyasını oku
def load_env():
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key] = value

load_env()

# API Keys ve URLs
OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY")
OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"

# OpenRouter client (OpenAI compatible)
openai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPEN_ROUTER_API_KEY,
)


# ==================== OPENFDA TOOLS ====================

def limit_text_length(text: Any, max_len: int = 1500) -> Any:
    """Metin uzunluğunu sınırlar (Token tasarrufu için)"""
    if isinstance(text, str):
        if len(text) > max_len:
            return text[:max_len] + "... (kısaltıldı)"
        return text
    elif isinstance(text, list):
        return [limit_text_length(item, max_len) for item in text]
    return text

def search_openfda_by_drug(drug_name: str) -> Dict[str, Any]:
    """
    OpenFDA API'den tek bir ilaç için bilgi çeker
    
    Args:
        drug_name: İlaç adı (generic name)
    
    Returns:
        Filtrelenmiş ilaç bilgileri
    """
    try:
        # İlaç adı eşleştirmeleri (Yaygın TR -> US isimleri)
        name_map = {
            "paracetamol": "acetaminophen",
            "asetaminofen": "acetaminophen",
            "adrenalin": "epinephrine"
        }
        
        search_name = name_map.get(drug_name.lower(), drug_name)
        search_query = f'openfda.generic_name:"{search_name}"'
        
        params = {
            "search": search_query,
            "limit": 1
        }
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(OPENFDA_BASE_URL, params=params)
            
            if response.status_code == 200:
                data = response.json()
                
                if "results" in data and len(data["results"]) > 0:
                    result = data["results"][0]
                    
                    # İlgili alanları filtrele
                    filtered_result = {
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
                        "effective_time": result.get("effective_time", "20240101") # Default fallback
                    }
                    
                    return {"found": True, "data": filtered_result}
                else:
                    return {"found": False, "drug_name": drug_name, "message": "OpenFDA'da bulunamadı"}
            
            else:
                return {"found": False, "drug_name": drug_name, "error": f"API error: {response.status_code}"}
    
    except Exception as e:
        return {"found": False, "drug_name": drug_name, "error": str(e)}


def analyze_drug_interactions_openfda(
    age: int,
    gender: str,
    conditions: List[str],
    current_medications: List[str],
    new_medications: List[str]
) -> Dict[str, Any]:
    """
    OpenFDA'dan birden fazla ilaç için etkileşim analizi
    
    Args:
        age: Hasta yaşı
        gender: Hasta cinsiyeti
        conditions: Hastalıklar
        current_medications: Mevcut ilaç isimleri
        new_medications: Yeni ilaç isimleri
    
    Returns:
        Toplanan tüm ilaç bilgileri
    """
    all_medications = list(set(current_medications + new_medications))
    
    results = {
        "patient_info": {
            "age": age,
            "gender": gender,
            "conditions": conditions,
            "is_elderly": age >= 65
        },
        "current_medications": current_medications,
        "new_medications": new_medications,
        "openfda_data": []
    }
    
    # Her ilaç için OpenFDA'dan bilgi çek
    for drug_name in all_medications:
        if drug_name and drug_name.strip():
            drug_info = search_openfda_by_drug(drug_name.strip())
            results["openfda_data"].append(drug_info)
    
    return results


# ==================== OPENAI AGENT EVALUATOR ====================

OPENAI_SYSTEM_PROMPT = """You are a clinical pharmacist expert system. Your task is to analyze drug interactions and return ONLY a valid JSON object.

CRITICAL: Return ONLY the JSON object. Do not include any explanatory text, comments, or markdown formatting before or after the JSON.

ANALYSIS PRINCIPLES:
1. STRICTLY COMPARTMENTALIZE INFO - DO NOT REPEAT CONTENT.
2. Clinical Summary: HIGH-LEVEL overview ONLY. No specific dosage numbers or granular side effect lists here.
3. Dosage Warnings: The ONLY place for dosage adjustments and specific dosage limits.
4. Patient Safety: The ONLY place for side effects and red flags.

OUTPUT FORMAT - Return this exact JSON structure in Turkish:
{
  "risk_score": 1-10,
  "results_found": true/false,
  "clinical_summary": "1-2 sentence high-level summary of the INTERACTION mechanism and main clinical concern. DO NOT include dosage numbers here. DO NOT list all side effects here.",
  "interaction_details": [
    {
      "drugs": ["Drug1", "Drug2"],
      "severity": "High/Medium",
      "mechanism": "Brief mechanism of interaction"
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
- If Boxed Warning exists, risk_score must be 10
- SEPARATE ALTERNATIVES into individual objects. Do not say "X or Y".
"""


def evaluate_with_openai(openfda_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    OpenAI agent ile OpenFDA verilerini değerlendirir
    
    Args:
        openfda_data: OpenFDA'dan gelen filtrelenmiş veriler
    
    Returns:
        Standardize edilmiş JSON response
    """
    
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
        response = openai_client.chat.completions.create(
            model="anthropic/claude-sonnet-4.5", # User requested "sonnet 4.5" (mapped to latest best Sonnet)
            messages=[
                {"role": "system", "content": OPENAI_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        print(f"🤖 Raw AI Response: {content[:100]}...")
        
        # Markdown temizliği (```json ... ```)
        if "```" in content:
            content = content.replace("```json", "").replace("```", "").strip()
        
        # JSON objesini bul ve çıkar (ekstra metin varsa onu atla)
        try:
            # İlk { ve son } arasındaki içeriği al
            start_idx = content.find('{')
            if start_idx == -1:
                raise ValueError("No JSON object found in response")
            
            # Balanced braces ile JSON objesinin sonunu bul
            brace_count = 0
            end_idx = start_idx
            for i in range(start_idx, len(content)):
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break
            
            json_str = content[start_idx:end_idx]
            result = json.loads(json_str)
            return result
        except (ValueError, json.JSONDecodeError) as parse_error:
            # Fallback: try parsing the whole content
            result = json.loads(content)
            return result
    
    except Exception as e:
        print(f"OpenAI evaluation error: {e}")
        # Fallback response
        return {
            "risk_score": 0,
            "results_found": False,
            "clinical_summary": f"OpenAI değerlendirme hatası: {str(e)}",
            "interaction_details": [],
            "alternatives": [],
            "monitoring_plan": [],
            "dosage_warnings": None,
            "special_population_alerts": None,
            "patient_safety_notes": None
        }


# ==================== MAIN ANALYSIS FUNCTION ====================

def analyze_with_openai_agent(
    age: int,
    gender: str,
    conditions: List[str],
    current_medications: List[Dict],
    new_medications: List[Dict],
    track_pipeline: bool = False
) -> tuple:
    """
    Ana analiz fonksiyonu:
    1. Direkt OpenFDA'dan veri çek
    2. Veriyi filtrele
    3. OpenAI agent ile değerlendir
    4. Standardize edilmiş format döndür
    
    Args:
        age: Hasta yaşı
        gender: Hasta cinsiyeti
        conditions: Hastalıklar
        current_medications: [{"name": "...", "dosage": "..."}]
        new_medications: [{"name": "...", "dosage": "..."}]
        track_pipeline: Pipeline adımlarını kaydet
    
    Returns:
        (evaluation_result, pipeline_steps) if track_pipeline else evaluation_result
    """
    import time
    pipeline_steps = []
    
    # İlaç isimlerini çıkar
    current_med_names = [med["name"] for med in current_medications if med.get("name")]
    new_med_names = [med["name"] for med in new_medications if med.get("name")]
    
    # Step 1: OpenFDA verisi çek (Direct Call)
    print("🌐 Collecting OpenFDA data (Direct)...")
    step1_start = time.time()
    
    openfda_data = analyze_drug_interactions_openfda(
        age=age,
        gender=gender,
        conditions=conditions,
        current_medications=current_med_names,
        new_medications=new_med_names
    )
    
    step1_time = (time.time() - step1_start) * 1000
    
    if track_pipeline:
        pipeline_steps.append({
            "step": 1,
            "name": "OpenFDA Data Collection",
            "description": "Direct OpenFDA API query for medication data",
            "input": {
                "age": age,
                "gender": gender,
                "conditions": conditions,
                "current_medications": current_med_names,
                "new_medications": new_med_names
            },
            "output": openfda_data,
            "processing_time_ms": round(step1_time, 2)
        })
    
    # Step 2: OpenAI agent ile değerlendir
    print("🤖 OpenAI Agent: Evaluating OpenFDA data...")
    step2_start = time.time()
    
    evaluation = evaluate_with_openai(openfda_data)
    
    step2_time = (time.time() - step2_start) * 1000

    # Calculate latest update date from OpenFDA data
    latest_date = "2024.01.01" # Default
    try:
        dates = []
        if isinstance(openfda_data, dict) and "openfda_data" in openfda_data:
             for item in openfda_data["openfda_data"]:
                if item.get("found") and "data" in item and "effective_time" in item["data"]:
                    d_raw = item["data"]["effective_time"]
                    if isinstance(d_raw, str) and len(d_raw) >= 8:
                        dates.append(d_raw[:8])
        
        if dates:
            dates.sort(reverse=True)
            ds = dates[0]
            latest_date = f"{ds[6:8]}.{ds[4:6]}.{ds[0:4]}"
    except Exception as e:
        print(f"Date parsing error: {e}")

    # Inject into result
    if isinstance(evaluation, dict):
        evaluation["last_updated"] = latest_date
    
    if track_pipeline:
        pipeline_steps.append({
            "step": 2,
            "name": "OpenAI GPT-4 Clinical Evaluation",
            "description": "Clinical analysis of OpenFDA data using GPT-4",
            "input": openfda_data,
            "output": evaluation,
            "processing_time_ms": round(step2_time, 2)
        })
    
    if track_pipeline:
        return evaluation, pipeline_steps
    else:
        return evaluation


# ==================== CHAT FUNCTIONALITY ====================

class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]  # Analysis result
    patient_info: Dict[str, Any]  # Patient details
    history: List[Dict[str, str]]  # Chat history

def chat_with_analysis(
    message: str,
    context: Dict[str, Any],
    patient_info: Dict[str, Any],
    history: List[Dict[str, str]]
) -> str:
    """
    Analiz sonuçları üzerinden sohbet et
    """
    try:
        # Sistem promptu - Kısa ve öz cevaplar için
        system_prompt = """Sen uzman bir klinik eczacısın. Görevin doktorun sorularına KISA, ÖZ ve NET cevaplar vermek.
        
        KURALLAR:
        1. Cevapların çok kısa olmalı (maksimum 2-3 cümle).
        2. Sadece sorulan soruya odaklan, gereksiz bilgi verme.
        3. Markdown formatı kullanabilirsin (bold, list vb.).
        4. Eğer sorunun cevabı analiz sonucunda yoksa, genel tıbbi bilgini kullan ama bunu belirt.
        5. Her zaman TÜRKÇE cevap ver.
        6. Üslubun profesyonel ama direkt olsun. "Merhaba", "Tabii ki" gibi giriş kelimelerini kullanma.
        """

        # Context hazırlığı
        context_str = json.dumps(context, indent=2, ensure_ascii=False)
        patient_str = json.dumps(patient_info, indent=2, ensure_ascii=False)
        
        # Mesaj geçmişini formatla
        messages = [{"role": "system", "content": system_prompt}]
        
        # Analiz bağlamını ilk mesaj olarak ekle
        messages.append({
            "role": "user", 
            "content": f"""BAĞLAM BİLGİLERİ:
            
            HASTA BİLGİSİ:
            {patient_str}
            
            MEVCUT ANALİZ SONUCU:
            {context_str}
            
            Bu bağlamı kullanarak soruları cevapla."""
        })
        
        # Sohbet geçmişini ekle
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        # Son kullanıcı mesajını ekle
        messages.append({"role": "user", "content": message})

        # OpenAI/Claude çağrısı
        response = openai_client.chat.completions.create(
            model="anthropic/claude-sonnet-4.5", 
            messages=messages,
            temperature=0.3,
            max_tokens=300
        )
        
        return response.choices[0].message.content

    except Exception as e:
        print(f"Chat error: {e}")
        return "Üzgünüm, şu anda cevap veremiyorum."


# ==================== ANAMNESIS ANALYSIS TOOLS ====================

def read_file_content(file: UploadFile, content: bytes) -> str:
    """PDF veya Word dosyasından metin okur"""
    text = ""
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.pdf'):
            if not pypdf:
                return "Error: pypdf library not installed."
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
                
        elif filename.endswith('.docx') or filename.endswith('.doc'):
            if not docx:
                return "Error: python-docx library not installed."
            doc = docx.Document(io.BytesIO(content))
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        elif filename.endswith('.txt'):
            text = content.decode('utf-8')
            
        return text.strip()
    except Exception as e:
        print(f"File reading error: {e}")
        return f"Error reading file: {str(e)}"

def extract_patient_info_from_text(anamnesis_text: str) -> Dict[str, Any]:
    """Anemnez metninden hasta bilgilerini ve ilaçları çıkarır"""
    
    system_prompt = """You are a medical AI assistant. Extract patient information from the anamnesis text.
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
    
    try:
        response = openai_client.chat.completions.create(
            model="anthropic/claude-sonnet-4.5",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract info from this text:\n\n{anamnesis_text}"}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Extraction error: {e}")
        return {
            "age": 45,
            "gender": "male",
            "conditions": [],
            "current_medications": []
        }


# ==================== FASTAPI INTEGRATION ====================

def create_openai_agent_app(enable_logging: bool = False):
    """FastAPI app with OpenAI agent + OpenFDA endpoint"""
    try:
        from fastapi import FastAPI, Request
        from fastapi.middleware.cors import CORSMiddleware
        from pydantic import BaseModel
        import time
        from backend_logger import init_logger, get_logger
        
        # Logger'ı başlat
        init_logger(enabled=enable_logging, log_dir="backend_logs")
        backend_logger = get_logger()
        
        app = FastAPI(title="Drug Interaction Analysis - OpenAI + OpenFDA Direct")
        
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Logging middleware
        @app.middleware("http")
        async def log_requests(request: Request, call_next):
            # İstek başlangıç zamanı
            start_time = time.time()
            
            # Request body'yi oku (loglama için)
            request_body = None
            if request.method == "POST":
                try:
                    body_bytes = await request.body()
                    if body_bytes:
                        request_body = json.loads(body_bytes.decode())
                    # Body'yi yeniden kullanılabilir yap
                    async def receive():
                        return {"type": "http.request", "body": body_bytes}
                    request._receive = receive
                except:
                    request_body = None
            
            # İsteği işle
            response = await call_next(request)
            
            # İşlem süresi
            processing_time_ms = (time.time() - start_time) * 1000
            
            # Client bilgilerini al
            client_ip = request.client.host if request.client else "unknown"
            user_agent = request.headers.get("user-agent", "unknown")
            
            # Basit endpoint'leri logla (detaylı loglama analyze fonksiyonunda yapılıyor)
            if backend_logger.enabled and not request.url.path.startswith("/analyze") and not request.url.path.startswith("/chat"):
                backend_logger.log_request(
                    endpoint=request.url.path,
                    method=request.method,
                    client_ip=client_ip,
                    user_agent=user_agent,
                    request_data=request_body or {},
                    response_data={"status": "completed"},
                    status_code=response.status_code,
                    processing_time_ms=processing_time_ms
                )
            
            return response
        
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
            
        # ChatRequest yukarıda tanımlandı
        
        @app.get("/")
        async def root():
            return {
                "service": "Drug Interaction Analysis - OpenAI + OpenFDA (Direct)",
                "version": "5.0-Direct-Integration",
                "status": "running",
                "data_source": "OpenFDA API (Real-time)",
                "logging_enabled": backend_logger.enabled
            }
        
        @app.get("/health")
        async def health():
            # OpenFDA health check
            openfda_status = "unknown"
            try:
                with httpx.Client(timeout=5.0) as client:
                    resp = client.get(OPENFDA_BASE_URL, params={"search": "openfda.generic_name:aspirin", "limit": 1})
                    if resp.status_code == 200:
                        openfda_status = "healthy"
            except:
                openfda_status = "offline"
            
            return {
                "status": "healthy" if openfda_status == "healthy" else "degraded",
                "openai_configured": OPEN_ROUTER_API_KEY is not None and not OPEN_ROUTER_API_KEY.startswith("<"),
                "openfda_status": openfda_status,
                "data_source": "OpenFDA API",
                "logging_enabled": backend_logger.enabled
            }
        
        @app.post("/analyze")
        async def analyze_openai(request: AnalysisRequest, req: Request):
            """OpenAI Agent + OpenFDA API endpoint"""
            start_time = time.time()
            
            try:
                # Analiz yap (pipeline tracking ile)
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
                    track_pipeline=backend_logger.enabled  # Sadece loglama aktifse track et
                )
                
                # Unpack result
                if backend_logger.enabled:
                    result, pipeline_steps = result_and_pipeline
                else:
                    result = result_and_pipeline
                    pipeline_steps = []
                
                # İşlem süresi
                processing_time_ms = (time.time() - start_time) * 1000
                
                # Detaylı loglama (response ve pipeline ile birlikte)
                if backend_logger.enabled:
                    client_ip = req.client.host if req.client else "unknown"
                    user_agent = req.headers.get("user-agent", "unknown")
                    
                    backend_logger.log_request(
                        endpoint="/analyze",  # Updated endpoint name
                        method="POST",
                        client_ip=client_ip,
                        user_agent=user_agent,
                        request_data=request.model_dump(),
                        response_data=result,
                        status_code=200,
                        processing_time_ms=processing_time_ms,
                        pipeline_steps=pipeline_steps  # Pipeline adımları
                    )
                
                return result
            
            except Exception as e:
                # Hata loglama
                if backend_logger.enabled:
                    client_ip = req.client.host if req.client else "unknown"
                    backend_logger.log_error(
                        endpoint="/analyze",  # Updated endpoint name
                        method="POST",
                        client_ip=client_ip,
                        error_message=str(e),
                        error_type=type(e).__name__,
                        request_data=request.model_dump()
                    )
                
                # Hata yanıtı
                return {
                    "risk_score": 0,
                    "results_found": False,
                    "clinical_summary": f"Analiz hatası: {str(e)}",
                    "interaction_details": [],
                    "alternatives": [],
                    "monitoring_plan": [],
                    "dosage_warnings": None,
                    "special_population_alerts": None,
                    "patient_safety_notes": None
                }

        @app.post("/chat")
        async def chat_endpoint(request: ChatRequest, req: Request):
            """Chat endpoint for follow-up questions"""
            start_time = time.time()
            
            try:
                response_text = chat_with_analysis(
                    message=request.message,
                    context=request.context,
                    patient_info=request.patient_info,
                    history=request.history
                )
                
                result = {"reply": response_text}
                
                # Loglama
                if backend_logger.enabled:
                    processing_time_ms = (time.time() - start_time) * 1000
                    client_ip = req.client.host if req.client else "unknown"
                    user_agent = req.headers.get("user-agent", "unknown")
                    
                    # Chat request data'sını kısaltarak logla (context çok büyük olabilir)
                    log_data = request.model_dump()
                    log_data["context"] = "..." # Context'i loglama
                    
                    backend_logger.log_request(
                        endpoint="/chat",
                        method="POST",
                        client_ip=client_ip,
                        user_agent=user_agent,
                        request_data=log_data,
                        response_data=result,
                        status_code=200,
                        processing_time_ms=processing_time_ms
                    )
                
                return result

            except Exception as e:
                print(f"Chat endpoint error: {e}")
                return {"reply": "Hata oluştu, lütfen tekrar deneyin."}

        @app.post("/analyze/file")
        async def analyze_file(
            file: UploadFile = File(...),
            new_medications_json: str = Form(...),
            req: Request = None
        ):
            """Anemnez dosyası ile analiz endpoint'i"""
            start_time = time.time()
            
            try:
                # 1. Dosyayı oku
                content = await file.read()
                anamnesis_text = read_file_content(file, content)
                
                if "Error" in anamnesis_text:
                    raise HTTPException(status_code=400, detail=anamnesis_text)
                
                # 2. Hasta bilgilerini ve mevcut ilaçları çıkar
                extracted_info = extract_patient_info_from_text(anamnesis_text)
                
                # 3. Yeni ilaçları parse et
                try:
                    new_meds_list = json.loads(new_medications_json)
                except:
                    new_meds_list = []
                
                # 4. Analizi çalıştır
                result_and_pipeline = analyze_with_openai_agent(
                    age=extracted_info.get("age", 45),
                    gender=extracted_info.get("gender", "male"),
                    conditions=extracted_info.get("conditions", []),
                    current_medications=extracted_info.get("current_medications", []),
                    new_medications=new_meds_list,
                    track_pipeline=backend_logger.enabled
                )
                
                # Unpack result
                if backend_logger.enabled:
                    result, pipeline_steps = result_and_pipeline
                else:
                    result = result_and_pipeline
                    pipeline_steps = []
                
                # Sonuca çıkarılan bilgileri ekle (Frontend'de göstermek için faydalı olabilir)
                result["extracted_patient_info"] = extracted_info
                
                # Loglama
                if backend_logger.enabled:
                    processing_time_ms = (time.time() - start_time) * 1000
                    client_ip = req.client.host if req.client else "unknown"
                    
                    backend_logger.log_request(
                        endpoint="/analyze/file",
                        method="POST",
                        client_ip=client_ip,
                        user_agent="web-client",
                        request_data={
                            "filename": file.filename,
                            "new_medications": new_meds_list
                        },
                        response_data=result,
                        status_code=200,
                        processing_time_ms=processing_time_ms,
                        pipeline_steps=pipeline_steps
                    )
                
                return result
                
            except Exception as e:
                print(f"File analysis error: {e}")
                return {
                    "risk_score": 0,
                    "clinical_summary": f"Dosya analizi hatası: {str(e)}",
                    "interaction_details": [],
                    "results_found": False
                }
        
        return app
    
    except ImportError as e:
        print(f"FastAPI not available: {e}")
        return None



# ==================== TEST ====================

if __name__ == "__main__":
    import sys
    
    # Argümanları parse et
    enable_logging = "--log" in sys.argv
    
    if "server" in sys.argv:
        app = create_openai_agent_app(enable_logging=enable_logging)
        if app:
            import uvicorn
            print("\n🚀 Starting OpenAI Agent + OpenFDA API (Direct Mode)...")
            print("📍 Endpoint: http://localhost:8080/analyze")
            print("🌐 Data source: OpenFDA API (real-time)")
            print("🤖 Evaluator: OpenAI GPT-4")
            if enable_logging:
                print("📝 Logging: ENABLED (backend_logs/)")
            else:
                print("📝 Logging: DISABLED (use --log to enable)")
            print()
            uvicorn.run(app, host="0.0.0.0", port=8080)
    else:
        # Test
        print("🧪 Testing OpenAI Agent + Ollama + OpenFDA\n")
        print("="*60)
        
        result = analyze_with_openai_agent(
            age=45,
            gender="male",
            conditions=["Hipertansiyon"],
            current_medications=[
                {"name": "Lisinopril", "dosage": "10mg"}
            ],
            new_medications=[
                {"name": "Ibuprofen", "dosage": "400mg"}
            ]
        )
        
        print("\n✅ Analysis Result:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
