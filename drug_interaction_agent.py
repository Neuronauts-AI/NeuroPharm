"""
Drug Interaction Analysis Agent
n8n workflow'undaki RAG ajanının Python implementasyonu
openFDA API kullanarak ilaç etkileşimlerini analiz eder
"""

import os
import json
import httpx
from typing import Optional
from pathlib import Path

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

from anthropic import Anthropic

# Anthropic API key
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# OpenFDA API base URL
OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"

# System prompt - Kapsamlı ilaç etkileşim analizi
SYSTEM_PROMPT = """Rol: Klinik İlaç Etkileşim Uzmanı (xAI - Açıklanabilir AI destekli)
Görev: Yeni reçete edilen ilaç ile hastanın mevcut verilerini openFDA API kullanarak kapsamlı analiz et.

Analiz Adımları:

1. Sorgu Oluştur: search_openfda fonksiyonunu kullanarak her yeni ilaç için mevcut ilaçlarla etkileşim kontrolü yap.
   Format: openfda.generic_name:{YENİ_İLAÇ} AND drug_interactions:{MEVCUT_İLAÇ}

2. Veri Kontrolü: API'den gelen boxed_warning, contraindications, drug_interactions, dosage_and_administration alanlarını incele.

3. Özel Durumlar:
   - Hasta 65 yaş üstü ise geriatric_use kontrol et
   - Hamile ise pregnancy alanlarındaki riskleri rapora ekle
   - Böbrek/karaciğer hastalığı varsa doz ayarlamalarını kontrol et

4. Risk Kırılımı (xAI): Her risk faktörünü 1-10 arasında puanla ve tetiklenen kuralları listele.

5. Alternatif Öneriler: Yüksek riskli ilaçlar için alternatif önerileri ve aksiyonları belirt.

6. İzlem Önerileri: Gerekli laboratuvar testlerini ve izlem sıklığını belirt.

Çıktı Formatı (Sadece JSON):

{
  "risk_score": 1-10,
  "description": "Klinik risk analizi özeti",
  "results_found": true/false,

  "risk_breakdown": {
    "drug_interaction": 1-10,
    "organ_function": 1-10,
    "patient_factors": 1-10,
    "dosage_risk": 1-10,
    "duplicative_therapy": 1-10,
    "triggered_rules": ["Kural 1", "Kural 2"]
  },

  "alternatives": [
    {
      "drug_name": "İlgili ilaç adı",
      "risk_level": "high/medium/low",
      "action": "Yapılması gereken aksiyon",
      "alternative_drug": "Alternatif ilaç (opsiyonel)",
      "dosage_adjustment": "Doz ayarlaması (opsiyonel)"
    }
  ],

  "monitoring": [
    {
      "test_name": "Test adı (INR, serum K, kreatinin vb.)",
      "frequency": "Sıklık (haftalık, aylık vb.)",
      "reason": "Neden gerekli",
      "related_drugs": ["İlgili ilaçlar"]
    }
  ],

  "dosage_adjustments": [
    {
      "drug_name": "İlaç adı",
      "current_dose": "Mevcut doz (opsiyonel)",
      "recommended_dose": "Önerilen doz",
      "reason": "Neden (böbrek/karaciğer fonksiyonu vb.)",
      "contraindicated": true/false
    }
  ],

  "pregnancy_warnings": [
    {
      "drug_name": "İlaç adı",
      "category": "FDA kategorisi (A, B, C, D, X)",
      "warning": "Uyarı metni",
      "alternative": "Alternatif ilaç (opsiyonel)",
      "breastfeeding_safe": true/false
    }
  ],

  "alternative_suggestion": "Genel alternatif öneri metni",
  "has_alternative": true/false
}

Önemli Notlar:
- Eğer veri bulunamazsa ilgili dizileri boş bırak []
- risk_breakdown her zaman doldurulmalı (veri yoksa düşük skorlar ver)
- Türkçe açıklamalar kullan
- Klinik olarak anlamlı öneriler sun"""


def search_openfda(search_query: str) -> dict:
    """
    openFDA API'sini sorgular

    Args:
        search_query: Arama sorgusu (örn: "openfda.generic_name:aspirin AND drug_interactions:ibuprofen")

    Returns:
        API yanıtı veya hata mesajı
    """
    try:
        params = {
            "search": search_query,
            "limit": 2
        }

        with httpx.Client(timeout=30.0) as client:
            response = client.get(OPENFDA_BASE_URL, params=params)

            if response.status_code == 200:
                data = response.json()

                # Sadece ilgili alanları çıkar
                if "results" in data and len(data["results"]) > 0:
                    result = data["results"][0]
                    filtered_result = {
                        "drug_interactions": result.get("drug_interactions", []),
                        "boxed_warning": result.get("boxed_warning", []),
                        "dosage_and_administration": result.get("dosage_and_administration", []),
                        "contraindications": result.get("contraindications", []),
                        "geriatric_use": result.get("geriatric_use", []),
                        "pregnancy": result.get("pregnancy", []),
                        "generic_name": result.get("openfda", {}).get("generic_name", [])
                    }
                    return {"found": True, "data": filtered_result}
                else:
                    return {"found": False, "message": "Bu sorgu için sonuç bulunamadı"}

            elif response.status_code == 404:
                return {"found": False, "message": "Veri bulunamadı"}
            else:
                return {"found": False, "error": f"API hatası: {response.status_code}"}

    except Exception as e:
        return {"found": False, "error": str(e)}


def analyze_drug_interactions(
    age: int,
    gender: str,
    conditions: list[str],
    current_medications: list[dict],
    new_medications: list[dict]
) -> dict:
    """
    İlaç etkileşimlerini analiz eder

    Args:
        age: Hasta yaşı
        gender: Hasta cinsiyeti
        conditions: Hastalıklar listesi
        current_medications: Mevcut ilaçlar listesi
        new_medications: Yazılacak yeni ilaçlar listesi

    Returns:
        Analiz sonucu
    """

    # Mevcut ve yeni ilaç isimlerini çıkar
    current_med_names = [med.get("name", "") for med in current_medications]
    new_med_names = [med.get("name", "") for med in new_medications]

    # openFDA sorgularını yap
    fda_results = []

    for new_med in new_med_names:
        for current_med in current_med_names:
            if new_med and current_med:
                # İlaç etkileşimi sorgusu
                query = f"openfda.generic_name:{new_med} AND drug_interactions:{current_med}"
                result = search_openfda(query)
                fda_results.append({
                    "query": f"{new_med} + {current_med}",
                    "result": result
                })

    # Hasta bilgilerini hazırla
    patient_info = {
        "age": age,
        "gender": gender,
        "conditions": conditions,
        "current_medications": current_med_names,
        "new_medications": new_med_names,
        "is_elderly": age >= 65,
        "fda_results": fda_results
    }

    # Claude ile analiz yap
    client = Anthropic(api_key=ANTHROPIC_API_KEY)

    user_message = f"""Hasta Bilgileri:
- Yaş: {age} {"(Yaşlı hasta - geriatric_use kontrol et)" if age >= 65 else ""}
- Cinsiyet: {gender}
- Hastalıklar: {', '.join(conditions) if conditions else 'Belirtilmemiş'}
- Mevcut İlaçlar: {', '.join(current_med_names) if current_med_names else 'Yok'}
- Yazılacak İlaçlar: {', '.join(new_med_names)}

openFDA API Sorgu Sonuçları:
{json.dumps(fda_results, indent=2, ensure_ascii=False)}

Yukarıdaki bilgilere göre ilaç etkileşimi analizi yap ve sadece JSON formatında yanıt ver."""

    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": user_message}
        ]
    )

    # Yanıtı parse et
    response_text = response.content[0].text

    # JSON'u çıkar
    try:
        # Eğer yanıt markdown code block içindeyse temizle
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        result = json.loads(response_text.strip())
        return result
    except json.JSONDecodeError:
        # JSON parse edilemezse varsayılan yanıt
        return {
            "risk_score": 1,
            "description": f"Analiz tamamlandı. Ham yanıt: {response_text[:500]}",
            "results_found": False,
            "risk_breakdown": {
                "drug_interaction": 1,
                "organ_function": 1,
                "patient_factors": 1,
                "dosage_risk": 1,
                "duplicative_therapy": 1,
                "triggered_rules": []
            },
            "alternatives": [],
            "monitoring": [],
            "dosage_adjustments": [],
            "pregnancy_warnings": [],
            "alternative_suggestion": "Gerek yok",
            "has_alternative": False
        }


# FastAPI entegrasyonu için (opsiyonel)
def create_fastapi_app():
    """FastAPI uygulaması oluşturur"""
    try:
        from fastapi import FastAPI
        from pydantic import BaseModel

        app = FastAPI(title="Drug Interaction Analysis API")

        class MedicationItem(BaseModel):
            id: str
            name: str
            dosage: Optional[str] = None
            frequency: Optional[str] = None

        class AnalysisRequest(BaseModel):
            age: int
            gender: str
            conditions: list[str]
            currentMedications: list[MedicationItem]
            newMedications: list[MedicationItem]

        @app.post("/analyze")
        async def analyze(request: AnalysisRequest):
            result = analyze_drug_interactions(
                age=request.age,
                gender=request.gender,
                conditions=request.conditions,
                current_medications=[med.model_dump() for med in request.currentMedications],
                new_medications=[med.model_dump() for med in request.newMedications]
            )
            return result

        return app

    except ImportError:
        print("FastAPI yüklü değil. 'pip install fastapi uvicorn' ile yükleyebilirsiniz.")
        return None


# Test fonksiyonu
def test_analysis():
    """Test analizi yapar"""
    result = analyze_drug_interactions(
        age=45,
        gender="male",
        conditions=["Hipertansiyon", "Diyabet"],
        current_medications=[
            {"id": "1", "name": "Metformin", "dosage": "850mg"},
            {"id": "2", "name": "Lisinopril", "dosage": "10mg"}
        ],
        new_medications=[
            {"id": "3", "name": "Aspirin", "dosage": "100mg"}
        ]
    )

    print("Analiz Sonucu:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return result


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "server":
        # FastAPI server başlat
        app = create_fastapi_app()
        if app:
            import uvicorn
            uvicorn.run(app, host="0.0.0.0", port=8080)
    else:
        # Test çalıştır
        print("Drug Interaction Analysis Agent - Test\n")
        print("="*50)
        test_analysis()
