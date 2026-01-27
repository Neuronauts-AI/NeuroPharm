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
                        "laboratory_tests": limit_text_length(result.get("laboratory_tests", []))
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

ANALYSIS PRINCIPLES AND SEVERITY SCORING (1-10):
1. CRITICAL (10 points):
   - Boxed Warning present
   - Life-threatening contraindications
   - "Do not use", "Fatal", "Life-threatening" interactions

2. HIGH (7-9 points):
   - Serious drug interactions (combination should be avoided)
   - Serious warnings related to patient age or conditions

3. MEDIUM (4-6 points):
   - Requires monitoring
   - "Use with caution", "Adjust dose" warnings
   - Laboratory tests required

4. LOW (1-3 points) -> FILTER OUT (do not report)
   - Common side effects (headache, nausea, etc.)
   - General storage conditions
   - Routine, well-known, minor warnings

OUTPUT FORMAT - Return this exact JSON structure in Turkish:
{
  "risk_score": 1-10,
  "results_found": true/false,
  "clinical_summary": "Brief clinical summary in Turkish (max 3 sentences). Only critical findings.",
  "interaction_details": [
    {
      "drugs": ["Drug1", "Drug2"],
      "severity": "High/Medium",
      "mechanism": "Interaction mechanism in Turkish (brief)"
    }
  ],
  "alternatives": [
    {
      "original_drug": "Drug Name",
      "suggested_alternative": "Alternative Drug",
      "reason": "Why safer? (in Turkish)"
    }
  ],
  "monitoring_plan": [
    {
      "test": "Test name (e.g., INR) in Turkish",
      "frequency": "Frequency in Turkish",
      "reason": "Reason in Turkish"
    }
  ],
  "dosage_warnings": ["Important dosage warnings in Turkish"],
  "special_population_alerts": ["Pregnancy, elderly warnings in Turkish"],
  "patient_safety_notes": "Most critical single-sentence warning for patient in Turkish"
}

CRITICAL RULES:
- Output language: TURKISH for all text fields
- Return ONLY the JSON object, nothing else
- No markdown code blocks
- No explanatory text before or after JSON
- Be MINIMALIST - don't overwhelm the doctor
- If only LOW risks exist, set results_found: false
- If Boxed Warning exists, risk_score must be 10
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
            if backend_logger.enabled and not request.url.path.startswith("/analyze"):
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
