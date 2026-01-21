# 🤖 OpenAI Agent + Ollama FunctionGemma (Lokal)

## 📋 Genel Bakış

Bu sistem, ilaç etkileşim analizi için **üç katmanlı** ve **tamamen lokal** bir mimari kullanır:

```
┌─────────────────┐
│  Frontend (UI)  │ → Next.js (port 3000)
└────────┬────────┘
         │
┌────────▼────────────────────────────────┐
│  OpenAI Agent API (port 8081)           │
│  - Ollama FunctionGemma: Tool calling   │ 🦙 LOKAL
│  - OpenAI GPT-4: Clinical evaluation   │
└────────┬────────────────────────────────┘
         │
┌────────▼────────────────────────────────┐
│  RAG API (port 8080)                    │
│  - 253K ilaç veritabanı                 │ 🚀 LOKAL
│  - Etkileşim analizi                    │
└─────────────────────────────────────────┘
```

## 🎯 Nasıl Çalışır?

### 1. Ollama FunctionGemma (Tool Caller) - LOKAL 🦙
- Kullanıcı isteğini alır
- RAG API'yi tool olarak çağırır (lokal)
- İlaç verilerini toplar
- **Google API gerekmez!**

### 2. OpenAI Agent (Evaluator)
- Ollama'dan gelen verileri alır
- Klinik değerlendirme yapar
- Standardize JSON formatında döner

### 3. RAG API (Data Source) - LOKAL 🚀
- 253,426 ilaç kaydı
- Lokal veritabanı (in-memory)
- Hızlı etkileşim analizi

---

## ⚙️ Kurulum

### 1. Ollama Yükleyin (Lokal FunctionGemma için)

```bash
# macOS
brew install ollama

# Ollama servisini başlatın
ollama serve

# (Yeni terminal) FunctionGemma modelini indirin
ollama pull functiongemma
```

> **Ollama indirmek için:** https://ollama.com/download

### 2. OpenAI API Key Ekleyin

`.env` dosyasını düzenleyin:

```bash
# OpenAI API Key (evaluator için)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

> **OpenAI API Key almak için:** https://platform.openai.com/api-keys
> 
> ~~Google API artık GEREKMİYOR - Ollama lokal çalışıyor!~~

### 2. Paketleri Yükleyin

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Servisleri Başlatın

**Terminal 1: RAG API (port 8080)**
```bash
source venv/bin/activate
python drug_interaction_agent.py server
```

**Terminal 2: OpenAI Agent API (port 8081)**
```bash
source venv/bin/activate
python openai_agent.py server
```

**Terminal 3: Frontend (port 3000)**
```bash
npm run dev
```

---

## 🧪 Test

### Basit Test (OpenAI Agent)

```bash
source venv/bin/activate
python openai_agent.py
```

Bu komut test senaryosu çalıştırır:
- Hasta: 45 yaş, erkek, hipertansiyon
- Mevcut ilaç: Lisinopril 10mg
- Yeni ilaç: Ibuprofen 400mg

### API Test (curl)

```bash
curl -X POST http://localhost:8081/analyze-openai \
  -H "Content-Type: application/json" \
  -d '{
    "age": 65,
    "gender": "female",
    "conditions": ["Diyabet", "Hipertansiyon"],
    "currentMedications": [
      {"id": "1", "name": "Metformin", "dosage": "850mg", "frequency": "2x1"},
      {"id": "2", "name": "Lisinopril", "dosage": "10mg", "frequency": "1x1"}
    ],
    "newMedications": [
      {"id": "3", "name": "Ibuprofen", "dosage": "400mg", "frequency": "3x1"}
    ]
  }'
```

### Health Check

```bash
# RAG API
curl http://localhost:8080/health

# OpenAI Agent API
curl http://localhost:8081/health
```

---

## 📊 API Endpoints

### OpenAI Agent API (port 8081)

#### `POST /analyze-openai`

**Request:**
```json
{
  "age": 45,
  "gender": "male",
  "conditions": ["Hipertansiyon"],
  "currentMedications": [
    {"id": "1", "name": "Lisinopril", "dosage": "10mg"}
  ],
  "newMedications": [
    {"id": "2", "name": "Aspirin", "dosage": "100mg"}
  ]
}
```

**Response:**
```json
{
  "risk_score": 3,
  "results_found": true,
  "clinical_summary": "2 ilaç RAG veritabanında analiz edildi. ✅ DÜŞÜK RİSK...",
  
  "interaction_details": [
    {
      "drugs": ["Lisinopril", "Aspirin"],
      "severity": "Low",
      "mechanism": "Potansiyel düşük risk etkileşimi"
    }
  ],
  
  "alternatives": null,
  
  "monitoring_plan": [
    {
      "test": "Kreatinin ve eGFR",
      "frequency": "3 ayda bir",
      "reason": "Böbrek fonksiyonunu takip etmek için"
    }
  ],
  
  "dosage_warnings": null,
  "special_population_alerts": null,
  "patient_safety_notes": null
}
```

---

## 🔄 Frontend Entegrasyonu

Frontend'de yeni endpoint kullanmak için `/app/page.tsx` dosyasını güncelleyin:

```typescript
// Mevcut endpoint (Anthropic RAG)
const PYTHON_API_URL = "http://localhost:8080/analyze"

// Yeni endpoint (OpenAI + FunctionGemma)
const OPENAI_API_URL = "http://localhost:8081/analyze-openai"

// Fetch'i OpenAI endpoint'e yönlendir
const response = await fetch(OPENAI_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    age: formData.age,
    gender: formData.gender,
    conditions: formData.conditions,
    currentMedications: formData.currentMedications,
    newMedications: formData.newMedications
  })
})
```

---

## 🛠️ Sorun Giderme

### "No module named 'openai'"
```bash
source venv/bin/activate
pip install openai google-generativeai
```

### "OPENAI_API_KEY not found"
`.env` dosyasında API key'inizi kontrol edin.

### RAG API'ye bağlanamıyor
Port 8080'de RAG API'nin çalıştığından emin olun:
```bash
lsof -ti:8080
```

### FunctionGemma tool calling çalışmıyor
Google AI Studio key'inizin doğru olduğundan emin olun:
```bash
echo $GOOGLE_API_KEY
```

---

## 📝 Notlar

- **Maliyet:** OpenAI GPT-4 kullanımı ücretlidir (~$0.01/request)
- **FunctionGemma:** Google Gemini API ücretsiz tier'da kullanılabilir
- **RAG API:** Lokal, maliyet yok
- **Performans:** Toplam yanıt süresi ~2-5 saniye

---

## 🔐 Güvenlik

- API key'leri `.env` dosyasında saklayın
- `.env` dosyasını git'e eklemeyin (`.gitignore`'da var)
- Production'da environment variables kullanın

---

## 📚 Daha Fazla Bilgi

- **OpenAI Docs:** https://platform.openai.com/docs
- **Google AI Studio:** https://ai.google.dev/gemini-api/docs
- **RAG Sistem Dokümantasyonu:** `rag/README.md`
