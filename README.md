# Neuropharm: İlaç Etkileşim Analiz Sistemi

Neuropharm, OpenFDA veritabanını ve **Claude Sonnet** (OpenRouter üzerinden) destekli klinik analiz motorunu kullanarak, hasta odaklı ilaç etkileşim analizleri sunan modern bir sağlık teknolojisi çözümüdür.Demo Linki: https://neuropharm.up.railway.app/

## Temel Özellikler

### 1. Güvenilir Veri Kaynağı (OpenFDA - Real-time)
- **Doğrudan Entegrasyon:** Sistem, statik bir veritabanı yerine, her sorguda doğrudan **fda.gov** API'lerine bağlanarak en güncel veriyi çeker.
- **Canlı Veri:** İlaç etiketleri, güncel kara kutu uyarıları ve kontrendikasyonlar anlık olarak sorgulanır.
- **Önbellekleme (Prefetch):** Hasta seçimi ve ilaç ekleme anında FDA verileri arka planda önceden çekilerek analiz süresi kısaltılır.

### 2. Klinik AI Ajanı (Claude Sonnet)
- **Model:** **OpenRouter** üzerinden **Anthropic Claude Sonnet** modeli kullanılır (`LLM_MODEL` ile değiştirilebilir).
- **Rolü:** OpenFDA'dan çekilen ham klinik veriyi, bir klinik eczacı bakış açısıyla analiz eder, özetler ve Türkçeleştirir.
- **Yeteneği:** Sadece veri listelemez; hastanın yaşına, cinsiyetine ve hastalıklarına göre risk değerlendirmesi yapar.

### 3. Hasta Odaklı Analiz (Doktor Reçete Paneli)
- **Hasta Yönetimi:** Hasta ekleme, düzenleme ve seçme işlemleri.
- **Manuel İlaç Girişi:** Doktor, sistemde kayıtlı olmayan ilaçları (yerel marka, majistral, yurt dışı ilaçlar) ad, doz, kullanım sıklığı ve serbest metin notuyla elle reçeteye ekleyebilir. Bu ilaçlar OpenFDA'da bulunamasa bile AI değerlendirmesine dâhil edilir.
- **Reçete Kaydetme:** Analiz sonrası ilaçlar hastanın profiline kaydedilebilir.
- **İlaç Alternatifleri:** AI, riskli ilaçlara güvenli alternatif önerir ve tek tıkla değiştirme imkânı sunar.
- **Özel Popülasyon Analizi:** Geriatrik (65+), Pediatrik ve Hamilelik durumlarına özel risk taraması.
- **Hastalık Çapraz Sorgusu:** Mevcut hastalıklar ile ilaç kontrendikasyonlarının eşleştirilmesi.

### 4. Anamnez Belgesi Analizi
- PDF, DOCX veya TXT formatındaki hasta anamnez belgelerini yükleyerek otomatik hasta bilgisi çıkarımı ve ilaç etkileşim analizi yapılabilir.

### 5. Yapay Zeka Sohbet Arayüzü
- Analiz sonuçları hakkında AI ile gerçek zamanlı (streaming) sohbet imkânı.

### 6. Koyu/Açık Tema
- Kullanıcı tercihi için dark/light mod desteği.

---

## Sistem Mimarisi

Sistem, tek bir Docker container içinde çalışan **hibrit** bir mimariye sahiptir:

```
┌─────────────────────────────────────────────────────┐
│                   Docker Container                   │
│                                                      │
│  ┌─────────────────┐      ┌─────────────────────┐   │
│  │  Next.js 16     │      │  FastAPI (uvicorn)  │   │
│  │  Port: 3000     │◄────►│  Port: 8081         │   │
│  └─────────────────┘      └────────┬────────────┘   │
└──────────────────────────────────┬─┼────────────────┘
                                   │ │
                    ┌──────────────┘ └──────────────┐
                    ▼                               ▼
           ┌────────────────┐            ┌─────────────────┐
           │ OpenFDA API    │            │ OpenRouter      │
           │ api.fda.gov    │            │ Claude Sonnet   │
           └────────────────┘            └─────────────────┘
```

### Analiz Akışı

1. **Prefetch:** Hasta seçimi/ilaç ekleme anında OpenFDA'dan veri arka planda çekilip önbelleğe alınır.
2. **Analiz İsteği:** Frontend, Next.js API route üzerinden FastAPI backend'e POST isteği gönderir.
3. **Veri Toplama:** Backend, ilaç isimlerini OpenFDA API'de arar; etiket bilgilerini (uyarılar, etkileşimler, dozaj) çeker.
4. **AI Analizi:** Ham veri, özel sistem promptu ile OpenRouter üzerinden Claude Sonnet modeline gönderilir.
5. **Sonuç:** AI, klinik değerlendirmeyi yapılandırılmış Türkçe JSON formatında döner.

---

## Kurulum ve Çalıştırma

Proje Docker ile tek komutla ayağa kaldırılabilir.

### Gereksinimler
- Docker & Docker Compose
- OpenRouter API Anahtarı ([openrouter.ai/keys](https://openrouter.ai/keys) üzerinden)

### Hızlı Başlangıç

1. **Projeyi Klonlayın**
   ```bash
   git clone https://github.com/egeaydin1/druginteraction.git
   cd druginteraction
   ```

2. **Ortam Değişkenlerini Ayarlayın**
   Proje kökünde `.env` dosyası oluşturun:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
   ```

3. **Uygulamayı Başlatın**
   ```bash
   docker-compose up -d --build
   ```

4. **Erişim**
   - **Frontend (Doktor Paneli):** [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs:** [http://localhost:8081/docs](http://localhost:8081/docs)

---

## API Referansı

### `POST /analyze`
Manuel hasta bilgisi ile ilaç etkileşim analizi.

**İstek:**
```json
{
  "age": 65,
  "gender": "male",
  "conditions": ["Hipertansiyon"],
  "currentMedications": [
    {"id": "1", "name": "Lisinopril", "dosage": "10mg"}
  ],
  "newMedications": [
    {"id": "2", "name": "Ibuprofen", "dosage": "400mg"},
    {
      "id": "manual-1712345678",
      "name": "Talcid",
      "dosage": "500mg",
      "frequency": "Günde 2 kez",
      "notes": "Gastrik şikâyet için, 2 hafta",
      "isManual": true
    }
  ]
}
```

> `isManual: true` olan ilaçlar doktor tarafından elle yazılmıştır ve OpenFDA'da
> kaydı olmayabilir; bu ilaçlar `doctor_manual_entries` olarak modele ayrıca
> iletilir ve farmakolojik bilgi üzerinden değerlendirilir. `notes` alanı klinik
> bağlam olarak analize dâhil edilir.

**Yanıt:**
```json
{
  "results_found": true,
  "clinical_summary": "Lisinopril ve Ibuprofen birlikte kullanıldığında...",
  "interaction_details": [...],
  "alternatives": [...],
  "monitoring_plan": [...],
  "dosage_warnings": [...],
  "special_population_alerts": [...],
  "patient_safety_notes": {...},
  "last_updated": "15.01.2025"
}
```

---

### `POST /analyze/file`
Anamnez belgesi yükleyerek analiz (PDF, DOCX, TXT — maks. 10 MB).

```bash
curl -X POST http://localhost:8081/analyze/file \
  -F "file=@anamnez.pdf" \
  -F 'new_medications_json=[{"id":"1","name":"Metformin","dosage":"500mg"}]'
```

---

### `POST /chat` ve `POST /chat/stream`
Analiz sonucu bağlamında AI ile sohbet.

```json
{
  "message": "Bu ilaçların yan etkileri nelerdir?",
  "context": "<analiz sonucu metni>",
  "patient_info": {"age": 65, "gender": "male"},
  "history": []
}
```

`/chat/stream` uç noktası `text/plain` akışı döner.

---

### `POST /prefetch`
FDA verilerini önceden önbelleğe alarak analiz süresini kısaltır.

```json
{
  "medications": ["Lisinopril", "Ibuprofen"]
}
```

---

### `GET /health`
Servis durumu kontrolü.

---

## Proje Yapısı

```
druginteraction/
├── app/                    # Next.js app router
│   ├── api/                # API proxy routes (Next.js → FastAPI)
│   └── page.tsx            # Ana sayfa (Doktor Reçete Paneli)
├── backend/                # FastAPI backend
│   ├── routes/             # Endpoint tanımları
│   │   ├── analyze.py      # /analyze ve /analyze/file
│   │   ├── chat.py         # /chat ve /chat/stream
│   │   ├── prefetch.py     # /prefetch
│   │   └── health.py       # /health
│   ├── services/           # İş mantığı katmanı
│   │   ├── llm.py          # Claude Sonnet entegrasyonu (OpenRouter)
│   │   ├── openfda.py      # OpenFDA API istemcisi
│   │   ├── anamnesis.py    # Belge okuma ve hasta bilgisi çıkarımı
│   │   └── chat.py         # Sohbet servisi
│   ├── config.py           # OpenRouter istemci yapılandırması
│   ├── models.py           # Pydantic modelleri
│   └── logger.py           # İstek loglama sistemi
├── components/             # React bileşenleri
│   ├── PatientList.tsx     # Hasta listesi paneli
│   ├── PatientForm.tsx     # Hasta ekleme/düzenleme formu
│   ├── PatientDetails.tsx  # Hasta detay görünümü
│   ├── MedicineSearch.tsx  # İlaç arama ve seçimi
│   ├── AnalysisResult.tsx  # Analiz sonuç ekranı
│   ├── AnamnesisPanel.tsx  # Anamnez belgesi paneli
│   ├── AnalysisChat.tsx    # AI sohbet arayüzü
│   └── ThemeToggle.tsx     # Tema değiştirici
├── Dockerfile              # Çok aşamalı build (Node.js + Python)
├── docker-compose.yml      # Tek container deployment
├── start.sh                # uvicorn + Next.js başlatma scripti
└── requirements.txt        # Python bağımlılıkları
```

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | Python 3.13, FastAPI, Uvicorn |
| AI Model | Anthropic Claude Sonnet (OpenRouter) |
| Veri Kaynağı | OpenFDA API (api.fda.gov) |
| Containerization | Docker (çok aşamalı build) |

---

## Lisans

Bu proje **Apache License 2.0** ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
