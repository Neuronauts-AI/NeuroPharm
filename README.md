# Neuropharm — İlaç Etkileşim Analiz Sistemi

Neuropharm, hekimin reçete yazarken karşılaştığı **ilaç–ilaç** ve **ilaç–hastalık** etkileşimlerini değerlendiren bir klinik karar destek arayüzüdür. Veriyi statik bir tablodan değil, her sorguda **OpenFDA ilaç etiketlerinden** canlı olarak çeker; ham FDA metnini bir dil modeli klinik eczacı bakış açısıyla yorumlayıp Türkçeleştirir ve hastanın yaşı, cinsiyeti ile tanılarına göre risk değerlendirmesi üretir.

> ⚠️ **Bu bir klinik karar destek aracıdır, tıbbi cihaz değildir.** Ürettiği değerlendirme hekimin kararının yerine geçmez, onu desteklemek içindir. Çıktı bir dil modelinden gelir ve doğrulanmadan klinik kararda kullanılmamalıdır.

**Demo:** <https://neuropharm.up.railway.app/> — parola korumalıdır (bkz. [Güvenlik](#güvenlik))
**Yığın:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 — FastAPI · Python 3.13 — OpenRouter → Claude — OpenFDA
**Durum:** demo yayında · otomatik test ve CI yok
**Düzen:** uygulama — bkz. [org GitHub standardı](https://github.com/Neuronauts-AI/website/blob/main/docs/github-standards/01-repo-structure.md)

> **Hangi dal doğru?** Bu deponun kaynağı `main` dalıdır. Deponun GitHub'daki *varsayılan* dalı yanlışlıkla `claude/doctor-prescription-panel-DUla2` olarak kalmış; o dal Mart 2026'daki geliştirmeleri (kimlik doğrulama, geri bildirim sistemi, OpenRouter geçişi, model tercihi) **içermiyor**. Bkz. [Bilinen sorunlar](#bilinen-sorunlar).

---

## Ne yapar

| Yetenek | Açıklama |
|---|---|
| **Canlı FDA verisi** | Her analizde `api.fda.gov/drug/label.json` sorgulanır: etkileşimler, kontrendikasyonlar, kara kutu uyarıları, dozaj, geriatrik/pediatrik/gebelik notları |
| **Önbellek + prefetch** | İlaç seçilir seçilmez FDA verisi arka planda çekilip bellekte tutulur, böylece analiz anında beklenmez |
| **Klinik AI değerlendirmesi** | Ham etiket metni, yapılandırılmış Türkçe bir klinik değerlendirmeye dönüştürülür: özet, etkileşim listesi, alternatif ilaçlar, izlem planı, dozaj uyarıları |
| **Hasta yönetimi** | Hasta ekleme/düzenleme, mevcut ilaç listesi, tanılar; analiz sonrası reçete kaydı |
| **Özel popülasyon taraması** | Geriatrik (65+), pediatrik ve gebelik durumlarına özel risk kontrolü |
| **Anamnez belgesi analizi** | PDF, DOCX veya TXT yüklenir; hasta bilgisi metinden çıkarılıp analiz çalıştırılır |
| **AI sohbet** | Analiz sonucu bağlamında, akış (streaming) destekli soru-cevap |
| **Hazır senaryolar** | Gerçek analizlerden üretilmiş **10 hazır vaka**, API anahtarı harcamadan demo yapmayı sağlar |
| **Klinik geri bildirim** | Hekimden etkileşim bazlı ve oturum bazlı geri bildirim toplayan iki katmanlı sistem; klinik doğrulama verisi biriktirir |
| **Model tercihi** | Kullanılan OpenRouter modeli arayüzden değiştirilip kalıcı hâle getirilebilir |
| **Koyu/açık tema** | |

Yerel ilaç arama dizini `public/data/optimized_medicines.json` içinde **18.677 kayıt** taşır; arama bu dosyadan yapılır, FDA sorgusu yalnızca analiz anında atılır.

---

## Mimari

Tek bir Docker imajında iki süreç çalışır: Next.js (3000) ve FastAPI (8081). Tarayıcı yalnızca Next.js ile konuşur; Next.js API route'ları isteği FastAPI'ye geçirir. FDA ve OpenRouter'a **yalnızca backend** çıkar — anahtar tarayıcıya hiç inmez.

```
┌──────────────── Docker container ─────────────────┐
│                                                    │
│   Next.js 16  :3000  ──proxy──▶  FastAPI  :8081    │
│   (app/api/*)                    (backend/)        │
└──────────────────────────────────────┬─────────────┘
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
             api.fda.gov/drug/label.json    openrouter.ai/api/v1
             (ilaç etiketleri)              (anthropic/claude-sonnet-4.6)
```

### Analiz akışı

1. **Prefetch** — hasta/ilaç seçildiğinde FDA verisi arka planda çekilip `FDA_DATA_CACHE`'e alınır
2. **İstek** — tarayıcı → Next.js `/api/analyze` → FastAPI `POST /analyze`
3. **Veri toplama** — her ilaç için OpenFDA etiketi alınır, uzun alanlar kırpılır (istem sınırını taşırmamak için)
4. **Değerlendirme** — ham veri + hasta bağlamı, klinik sistem istemiyle OpenRouter üzerinden modele gönderilir
5. **Sonuç** — model yapılandırılmış Türkçe JSON döner; arayüz bunu bölümlere ayırıp gösterir

---

## Kurulum

### Gereksinimler

- Docker ve Docker Compose
- **OpenRouter API anahtarı** — <https://openrouter.ai>

### Docker ile (önerilen)

```bash
git clone https://github.com/Neuronauts-AI/NeuroPharm.git
cd NeuroPharm
git checkout main          # varsayılan dal henüz main değil — bkz. Bilinen sorunlar

export OPEN_ROUTER_API_KEY=sk-or-...   # dikkat: compose bu ismi okur
export APP_LOGIN_PASSWORD=...          # kendi parolanızı belirleyin

docker compose up -d --build
```

- Arayüz: <http://localhost:3000>
- API dokümantasyonu (FastAPI otomatik): <http://localhost:8081/docs>

### Docker olmadan

```bash
# Backend
pip install -r requirements.txt
OPENROUTER_API_KEY=sk-or-... uvicorn backend.main:app --host 0.0.0.0 --port 8081

# Frontend (ayrı terminal)
npm ci
PYTHON_API_URL=http://localhost:8081 npm run dev
```

---

## Ortam değişkenleri

| Değişken | Zorunlu | Ne işe yarar |
|---|---|---|
| `OPENROUTER_API_KEY` | **evet** | OpenRouter anahtarı. `OPEN_ROUTER_API_KEY` de kabul edilir. Yoksa backend açılışta hata verir |
| `APP_LOGIN_PASSWORD` | **evet (üretimde)** | Giriş parolası. **Ayarlanmazsa kodda gömülü bir varsayılana düşer** — üretimde mutlaka ayarlayın |
| `LLM_MODEL` | hayır | Varsayılan `anthropic/claude-sonnet-4.6`. Çalışma anında arayüzden de değiştirilebilir |
| `DEFAULT_LLM_PROVIDER` | hayır | Varsayılan `openrouter`. Şu an **tek desteklenen sağlayıcı** budur; başka değer verilse de openrouter'a düşülür |
| `PYTHON_API_URL` | hayır | Next.js'in backend'i bulduğu adres. Docker'da `http://localhost:8081` |
| `NODE_ENV` | hayır | `production` olduğunda oturum çerezi `secure` işaretlenir |

> `docker-compose.yml`, konteynere `OPENROUTER_API_KEY` değişkenini **host'taki `OPEN_ROUTER_API_KEY`** değişkeninden doldurur. Docker Compose kullanıyorsanız host tarafında bu ismi kullanın.

---

## API

FastAPI, `:8081` üzerinde. Next.js tarafındaki `/api/*` route'ları bunların önünde ince birer vekildir.

| Uç nokta | Ne yapar |
|---|---|
| `GET /` | Servis bilgisi |
| `GET /health` | Sağlık kontrolü — OpenFDA erişimi ve anahtarın tanımlı olup olmadığı |
| `POST /analyze` | Hasta bilgisi + ilaç listeleriyle etkileşim analizi |
| `POST /analyze/file` | Anamnez belgesi (PDF/DOCX/TXT, **maks. 10 MB**) yükleyerek analiz |
| `POST /chat` | Analiz bağlamında soru-cevap |
| `POST /chat/stream` | Aynısı, `text/plain` akışı olarak |
| `POST /prefetch` | Verilen ilaçların FDA verisini önden önbelleğe alır |
| `POST /feedback/quick` | Etkileşim bazlı hızlı geri bildirim |
| `POST /feedback/session` | Oturum bazlı geri bildirim (karar etkisi, puanlar, NPS) |
| `GET /feedback/stats` | Toplu klinik metrikler |
| `GET /feedback/list` | Ham geri bildirim kayıtları (filtrelenebilir) |
| `GET /feedback/export` | Araştırma için tam dışa aktarım |
| `GET /settings/model` | Geçerli model tercihi |
| `POST /settings/model` | Model tercihini değiştirir ve kalıcılaştırır |

Tüm istekler için gövde sınırı **15 MB**'tır.

### `POST /analyze`

```json
{
  "age": 58,
  "gender": "male",
  "conditions": ["kalp hastalığı", "yüksek kolesterol"],
  "currentMedications": [
    {"id": "1", "name": "aspirin", "dosage": "100mg"},
    {"id": "2", "name": "atorvastatin", "dosage": "20mg"}
  ],
  "newMedications": [
    {"id": "3", "name": "warfarin", "dosage": "5mg"}
  ]
}
```

Yanıt; `clinical_summary`, `interaction_details`, `alternatives`, `monitoring_plan`, `dosage_warnings`, `special_population_alerts` ve `patient_safety_notes` alanlarını taşır.

### `POST /analyze/file`

```bash
curl -X POST http://localhost:8081/analyze/file \
  -F "file=@anamnez.pdf" \
  -F 'new_medications_json=[{"id":"1","name":"metformin","dosage":"500mg"}]'
```

---

## Güvenlik

- **Tüm uygulama parola arkasındadır.** `middleware.ts`, `/login` ve `/api/auth/*` dışındaki her yolu giriş sayfasına yönlendirir. Başarılı girişte 12 saat ömürlü, `httpOnly` bir `np_auth` çerezi yazılır.
- **`APP_LOGIN_PASSWORD` üretimde mutlaka ayarlanmalıdır.** Ayarlanmazsa kod içine gömülü bir varsayılan parolaya düşülür; bu depo public olduğu için o varsayılan herkes tarafından okunabilir durumdadır.
- Parola **tek ve paylaşılan** bir sırdır; kullanıcı bazlı kimlik veya yetki ayrımı yoktur. Kimin ne yaptığı ayırt edilemez.
- `backend_logs/` altındaki istek logları ve geri bildirim kayıtları **hasta bağlamı içerebilir**. `/logs` sayfası ve `/api/logs` uçları bunları aynı paylaşılan parolanın arkasından sunar. Gerçek hasta verisiyle çalışılacaksa bu yüzey daraltılmalıdır.
- API anahtarı yalnızca backend'de kullanılır, tarayıcıya gönderilmez.
- Açık bildirimi için: [`SECURITY.md`](SECURITY.md)

---

## Yerleşim

```
app/                         Next.js App Router
  page.tsx                   doktor reçete paneli (ana ekran)
  login/page.tsx             parola ekranı
  feedback/page.tsx          klinik geri bildirim paneli
  logs/page.tsx              istek log görüntüleyici
  api/                       FastAPI'ye vekillik eden route'lar
backend/
  main.py                    FastAPI uygulaması, CORS, boyut sınırı, log ara katmanı
  config.py                  OpenRouter istemcisi, model ve anahtar çözümlemesi
  runtime_model.py           model tercihinin kalıcılaştırılması
  models.py                  Pydantic istek/yanıt modelleri
  logger.py                  istek loglama
  routes/                    analyze · chat · prefetch · health · feedback · model_settings
  services/
    openfda.py               OpenFDA istemcisi + bellek içi önbellek
    llm.py                   klinik sistem istemi ve model çağrısı
    anamnesis.py             PDF/DOCX/TXT okuma, hasta bilgisi çıkarımı
    chat.py                  sohbet servisi
components/                  React bileşenleri (hasta listesi, ilaç arama, sonuç, sohbet, geri bildirim)
lib/
  precomputedAnalysisScenarios.ts   10 hazır senaryonun imzaları
  mockData.ts
data/precomputed-real-analyses.json   gerçek analizlerden üretilmiş hazır sonuçlar
public/data/optimized_medicines.json  18.677 kayıtlık yerel ilaç arama dizini
scripts/                     hazır senaryoları üreten yardımcı betikler
Dockerfile                   çok aşamalı build (node:20-alpine → python:3.13-slim)
start.sh                     tek konteynerde uvicorn + Next.js
```

---

## Bilinen sorunlar

- **Varsayılan dal yanlış.** Depo `claude/doctor-prescription-panel-DUla2` dalını varsayılan gösteriyor; oysa geliştirme `main` üzerinde. O dal Mart 2026'daki kimlik doğrulama, geri bildirim sistemi, OpenRouter geçişi ve model tercihi çalışmalarını içermiyor. Klonlayan herkes eksik kodu alıyor. Düzeltmesi tek komut:
  ```bash
  gh api repos/Neuronauts-AI/NeuroPharm -X PATCH -f default_branch=main
  ```
- **`.env.example` güncel değil.** İçinde `FAL_KEY` yazıyor, ama kod artık `OPENROUTER_API_KEY` / `OPEN_ROUTER_API_KEY` okuyor. `FAL_KEY` ayarlamak hiçbir işe yaramaz; dosya bu README'deki tabloya göre yenilenmeli.
- **`backend/main.py` doğrudan çalıştırılırsa 8080 portunu açar**, oysa `start.sh`, `docker-compose.yml` ve `Dockerfile` 8081 kullanıyor. `uvicorn` ile elle başlatırken portu açıkça verin.
- **Model tercihi `.env` dosyasına yazılır.** `runtime_model.py`, arayüzden yapılan model değişikliğini hem `data/runtime-model.json` hem `.env` içine kaydeder. Konteynerde bu dosya kalıcı değildir — yeniden dağıtımda tercih `LLM_MODEL` değerine döner.
- **CORS her kaynağa açık.** `allow_origins=["*"]` ile `allow_credentials=True` birlikte kullanılıyor. Backend doğrudan internete açılacaksa daraltılmalı.
- **Otomatik test ve CI yok.** Değişiklikler yalnızca elle doğrulanıyor.
- Hasta kayıtları ve sohbet geçmişi için veritabanı yok; kalıcılık `backend_logs/` altındaki dosyalara ve tarayıcı durumuna dayanıyor.

---

## Katkı

[`CONTRIBUTING.md`](CONTRIBUTING.md) · Dal, commit ve PR kuralları için [org standardı](https://github.com/Neuronauts-AI/website/blob/main/docs/github-standards/04-branching-and-prs.md).

## Lisans

**Apache License 2.0** — bkz. [`LICENSE`](LICENSE). Depo public olduğu için bu lisans, kodun üçüncü taraflarca serbestçe kullanılıp ticarileştirilebileceği anlamına gelir.
