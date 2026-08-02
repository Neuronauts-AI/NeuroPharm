# Neuropharm — Devir Belgesi

> Bu belge, projeyi devralan kişi için hazırlanmıştır.
> Ölçüt: bunu okuyan bir mühendis, kimseye soru sormadan projeyi ayağa kaldırabilmeli.
>
> ⚠️ Bu depo **public**. Buraya hiçbir anahtar, parola veya kişisel bilgi yazılmaz —
> yalnızca neyin nerede durduğunun envanteri tutulur.
> `<doldurulacak>` alanları yalnızca hesap sahiplerinin bilebileceği bilgilerdir.

**Son güncelleme:** 2026-08-02
**Mevcut sahip:** `<doldurulacak>` · **Yedek:** `<doldurulacak>`

---

## 1. Proje özeti

Hekimin reçete yazarken karşılaştığı ilaç–ilaç ve ilaç–hastalık etkileşimlerini değerlendiren klinik karar destek arayüzü. OpenFDA ilaç etiketlerinden canlı çekilen veriyi bir dil modeliyle klinik eczacı bakış açısından yorumlar, Türkçe yapılandırılmış bir değerlendirme üretir.

**Durum:** demo yayında (<https://neuropharm.up.railway.app/>), otomatik test ve CI yok.

**Klinik konum:** Karar destek aracıdır, **tıbbi cihaz değildir**. Devralan kişi bu ayrımı korumalıdır.

---

## 2. Teknoloji yığını

| Katman | Teknoloji | Neden |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 | |
| Backend | FastAPI, Python 3.13, Uvicorn | |
| LLM | OpenRouter → `anthropic/claude-sonnet-4.6` | Mart 2026'da FAL AI'dan OpenRouter'a geçildi; tek sağlayıcı |
| Veri | OpenFDA `api.fda.gov/drug/label.json` | Statik tablo yerine canlı etiket verisi |
| Paketleme | Docker, çok aşamalı (node:20-alpine → python:3.13-slim) | Tek imajda iki süreç |
| Kalıcılık | **Veritabanı yok** — dosya tabanlı | Loglar ve geri bildirim `backend_logs/` altında |

---

## 3. Sıfırdan ayağa kaldırma

```bash
git clone https://github.com/Neuronauts-AI/NeuroPharm.git
cd NeuroPharm
git checkout main                       # varsayılan dal yanlış — §7

export OPEN_ROUTER_API_KEY=<anahtar>
export APP_LOGIN_PASSWORD=<parola>
docker compose up -d --build
```

Arayüz `:3000`, API `:8081`, dokümantasyon `:8081/docs`.

---

## 4. Deploy ve çalışma ortamı

- **Hedef:** Railway — <https://neuropharm.up.railway.app/>
- **Hangi hesabın altında:** `<doldurulacak>`
- **Deploy tetikleyici:** `<doldurulacak — otomatik mi, elle mi>`
- **Sağlık kontrolü:** `GET /health` (Docker healthcheck hem `:8081/health` hem `:3000` yoklar)
- **Loglar:** konteyner içinde `backend_logs/`; compose'da host'a bağlanır. **Railway'de kalıcı volume yoksa her dağıtımda silinir** — geri bildirim verisi de dahil.

### Servis değişkenleri

| Değişken | Zorunlu | Not |
|---|---|---|
| `OPENROUTER_API_KEY` | **evet** | `OPEN_ROUTER_API_KEY` de kabul edilir. Yoksa backend açılmaz |
| `APP_LOGIN_PASSWORD` | **evet** | Ayarlanmazsa koddaki varsayılana düşer — public depoda okunabilir |
| `LLM_MODEL` | hayır | Varsayılan `anthropic/claude-sonnet-4.6` |
| `DEFAULT_LLM_PROVIDER` | hayır | `openrouter` |
| `PYTHON_API_URL` | hayır | Docker'da `http://localhost:8081` |

---

## 5. Devri gereken hesap ve anahtarlar

> Envanterdir — **değerler buraya yazılmaz**, hele bu depo public iken.

| Ne | Nerede | Kimin üzerinde | Devir |
|---|---|---|---|
| Railway projesi | Railway | `<doldurulacak>` | evet |
| OpenRouter hesabı ve API anahtarı | OpenRouter + `<parola yöneticisi>` | `<doldurulacak>` | evet, **döndürülmeli** |
| `APP_LOGIN_PASSWORD` | Railway servis değişkeni | — | **döndürülmeli** |
| Alan adı (kullanılıyorsa) | `<sağlayıcı>` | `<doldurulacak>` | `<doldurulacak>` |

OpenFDA anahtar gerektirmez; kimlik doğrulamasız çağrılıyor (hız sınırı vardır).

---

## 6. Tamamlananlar

- Doktor reçete paneli: hasta yönetimi, ilaç arama (18.677 kayıtlık yerel dizin), reçete kaydı
- Canlı OpenFDA entegrasyonu, bellek içi önbellek ve prefetch
- Klinik değerlendirme: özet, etkileşimler, alternatifler, izlem planı, dozaj ve özel popülasyon uyarıları
- Anamnez belgesi (PDF/DOCX/TXT, maks. 10 MB) yükleyip hasta bilgisi çıkarımı
- Analiz bağlamında AI sohbet, akış destekli
- 10 hazır senaryo — gerçek analizlerden üretildi, API maliyeti olmadan demo
- İki katmanlı klinik geri bildirim sistemi + istatistik/dışa aktarım uçları
- Parola tabanlı erişim kapısı (middleware + `np_auth` çerezi)
- Arayüzden model değiştirme ve kalıcılaştırma
- Koyu/açık tema
- Tek konteyner Docker dağıtımı, healthcheck

---

## 7. Yarım kalanlar ve bilinen sorunlar

| Konu | Durum | Not |
|---|---|---|
| **Varsayılan dal yanlış** | **açık — en acil** | `claude/doctor-prescription-panel-DUla2` varsayılan; `main` gerçek kaynak. `gh api repos/Neuronauts-AI/NeuroPharm -X PATCH -f default_branch=main` |
| Otomatik test | **yok** | Hiç test yok |
| CI | **yok** | Şablon: `website` deposunda `templates/workflows/ci-node.yml` |
| Kimlik doğrulama | zayıf | Tek paylaşılan parola, kullanıcı ayrımı yok, denetim izi yok. Gerçek klinik kullanım için yetersiz |
| Log yüzeyi | risk | `/logs` ve `/api/logs` hasta bağlamı içerebilen kayıtları aynı paylaşılan parolayla sunuyor |
| CORS | gevşek | `allow_origins=["*"]` + `allow_credentials=True` |
| Port tutarsızlığı | küçük | `backend/main.py` doğrudan çalıştırılırsa 8080; geri kalanı 8081 |
| Model tercihi kalıcılığı | tasarım gereği kırılgan | `.env`'e yazılıyor; konteynerde yeniden dağıtımda kayboluyor |
| Veritabanı yok | bilinçli ödün | Hasta kayıtları kalıcı değil; ürünleşmede ilk çözülecek konu |

---

## 8. Mimari notlar

**İki süreç, tek konteyner.** `start.sh` uvicorn'u arka planda 8081'de, Next.js standalone sunucusunu ön planda 3000'de başlatır. Tarayıcı yalnızca Next.js'i görür; `app/api/*` route'ları FastAPI'ye vekillik eder. Bu sayede OpenRouter anahtarı istemciye hiç inmez.

**Neden prefetch var.** OpenFDA çağrısı analiz anında yapılırsa kullanıcı saniyelerce bekler. `POST /prefetch`, ilaç seçilir seçilmez veriyi `FDA_DATA_CACHE`'e alır; analiz anında yalnızca model çağrısı kalır.

**Neden FDA metni kırpılıyor.** Etiketler çok uzun; `limit_text_length` alanları kısaltarak istemi model bağlam sınırına sığdırır. Sınırı büyütmek maliyeti ve taşma riskini artırır.

**Hazır senaryolar.** `data/precomputed-real-analyses.json` gerçek analiz çıktılarından üretildi; `lib/precomputedAnalysisScenarios.ts` hasta imzasını taşır. Girdi imzası bir senaryoyla eşleşirse kayıtlı sonuç oynatılır — demo sırasında hem hızlı hem maliyetsiz.

---

## 9. Kime sorulur

| Konu | Kişi |
|---|---|
| Ürün / klinik kapsam | `<doldurulacak>` |
| Frontend | `<doldurulacak>` |
| Backend / model | `<doldurulacak>` |
| Altyapı / Railway | `<doldurulacak>` |
