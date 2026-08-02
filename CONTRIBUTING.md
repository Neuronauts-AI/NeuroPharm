# Katkı Rehberi — Neuropharm

Bu depo [Neuronauts AI GitHub standardını](https://github.com/Neuronauts-AI/website/tree/main/docs/github-standards) izler. Burada yalnızca bu depoya özel kısımlar var.

## Önce: doğru dal

Geliştirme **`main`** üzerinde yapılır. Deponun GitHub'daki varsayılan dalı hâlâ `claude/doctor-prescription-panel-DUla2` olduğu için klonladıktan sonra dalı elle değiştirmeniz gerekiyor:

```bash
git clone https://github.com/Neuronauts-AI/NeuroPharm.git
cd NeuroPharm
git checkout main
```

O dal Mart 2026'daki kimlik doğrulama, geri bildirim ve OpenRouter çalışmalarını içermiyor — üzerine geliştirme yapmayın.

## Kurulum

```bash
export OPEN_ROUTER_API_KEY=sk-or-...
export APP_LOGIN_PASSWORD=kendi-parolaniz
docker compose up -d --build
```

Arayüz <http://localhost:3000>, API dokümanı <http://localhost:8081/docs>.

Docker olmadan:

```bash
pip install -r requirements.txt
OPENROUTER_API_KEY=sk-or-... uvicorn backend.main:app --host 0.0.0.0 --port 8081

npm ci
PYTHON_API_URL=http://localhost:8081 npm run dev
```

> `backend/main.py` doğrudan `python backend/main.py` ile çalıştırılırsa **8080** portunu açar; geri kalan her şey 8081 bekler. `uvicorn` kullanın veya portu açıkça verin.

## Test

**Bu depoda otomatik test yok.** Bu bir eksiklik, tercih değil — davranış değiştiren bir PR açıyorsanız ilk testi yazmak için iyi bir fırsat.

Asgari elle doğrulama ve PR'da ne denediğinizin yazılması beklenir:

```bash
curl -s localhost:8081/health          # openfda_status: healthy, openrouter_configured: true
curl -s localhost:8081/                # servis bilgisi
```

Arayüzde: giriş → hasta seç → ilaç ekle → analiz → sohbet. Hazır senaryolardan biriyle (`/api/analyze/presets`) API anahtarı harcamadan da deneyebilirsiniz.

Lint:

```bash
npm run lint
```

## Bu depoya özel dikkat noktaları

- **Klinik çıktı sorumluluk taşır.** Bu bir karar destek aracıdır, tıbbi cihaz değildir. Modelin ürettiği metni kesin bilgi gibi sunan, uyarıyı zayıflatan veya sorumluluk reddini kaldıran değişiklik yapmayın.
- **Hasta verisi loglara düşebilir.** `backend_logs/` altındaki istek logları ve geri bildirim kayıtları hasta bağlamı içerebilir. Bunları commit etmeyin, issue'ya yapıştırmayın, ekran görüntüsüne almayın.
- **API anahtarı backend'de kalır.** OpenRouter çağrısını istemci tarafına taşımayın; anahtar tarayıcıya inmemeli.
- **FDA alanları kırpılır.** `services/openfda.py` içindeki `limit_text_length`, etiket metnini istem sınırına sığdırmak için kısaltır. Sınırı büyütmeden önce maliyeti ve bağlam taşmasını düşünün.
- **Model tercihi `.env`'e yazılır.** `runtime_model.py` arayüzden yapılan değişikliği diske kaydeder. Konteynerde kalıcı değildir.
- **Hazır senaryolar gerçek analizlerden üretilmiştir.** `data/precomputed-real-analyses.json` ve `lib/precomputedAnalysisScenarios.ts` birlikte değişir; `scripts/` altındaki üreticilerle yenilenir.

## Akış

1. `git switch -c feat/kisa-aciklama` (`main`'den)
2. Küçük commit'ler, [Conventional Commits](https://www.conventionalcommits.org/)
3. PR aç, şablonu doldur
4. 1 onay al
5. **Squash merge**, sonra dalı sil

## Depoya girmeyecekler

`.env`, OpenRouter anahtarı, giriş parolası, `backend_logs/`, hasta verisi, `node_modules/`, derleme çıktısı.
