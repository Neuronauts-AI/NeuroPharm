# Neuropharm: İlaç Etkileşim Analiz Sistemi
## Proje Analiz ve Teknik Tanıtım Sunumu

---

## 1. Veri Kaynağı: OpenFDA Güvencesi

Sağlık teknolojilerinde en kritik bileşen **veri güvenilirliğidir**. Neuropharm, verilerini dünyanın en saygın sağlık otoritelerinden biri olan **FDA (Amerikan Gıda ve İlaç Dairesi)** veritabanından sağlar.

- **Kaynak:** OpenFDA API (`api.fda.gov`)
- **Güvenilirlik:** Onaylı ilaç etiketleri, resmi uyarılar ve klinik veriler.
- **Kapsam:**
  - İlaç Etkileşimleri (Drug Interactions)
  - Kara Kutu Uyarıları (Boxed Warnings)
  - Kontrendikasyonlar
  - Yan Etkiler ve Dozaj Bilgileri
- **Yöntem:** Sistem, her analiz talebinde gerçek zamanlı olarak kaynağından en güncel veriyi çeker. Statik veritabanı kullanmaz, bu sayede **her zaman güncel** kalır.

---

## 2. Girdi İşleme: Yapılandırılmış Veri Akışı

Doğru analiz için girdinin doğru işlenmesi esastır. Sistemimiz, ham metin yerine **yapılandırılmış veri** (structured data) ile çalışır.

- **Hasta Verileri:**
  - Yaş (Pediatrik/Geriatrik analiz için kritik)
  - Cinsiyet
  - Mevcut Hastalıklar (ICD-10 uyumlu veya serbest metin)
- **İlaç Verileri:**
  - İlaç Adı (Etken madde veya marka adı)
  - Dozaj ve Kullanım Sıklığı
- **Akıllı Eşleştirme:**
  - Girilen ilaç isimleri (örn. TR ticari isimleri), uluslararası jenerik isimlere (örn. *Parasetamol* -> *Acetaminophen*) otomatik olarak dönüştürülür.

---

## 3. Hasta Hikayesi (Anamnez) Odaklı Analiz

Sistemimiz sadece "İlaç A ile İlaç B etkileşir mi?" sorusuna bakmaz; **"Bu hasta için bu ilaçlar güvenli mi?"** sorusunu yanıtlar.

- **Kişiselleştirilmiş Risk Değerlendirmesi:**
  - **Hastalık-İlaç Etkileşimi:** Hastanın mevcut hastalıkları (Örn: Böbrek yetmezliği, Hipertansiyon) ile ilaçların kontrendikasyonlarını çapraz sorgular.
  - **Yaş Grubu Analizi:** Yaşlı hastalarda (65+) riskli olabilecek ilaçlar için özel "Geriatric Use" taraması yapar.
  - **Özel Durumlar:** Hamilelik veya emzirme gibi durumları, ilaç etiketlerindeki özel uyarılarla eşleştirir.
- **Akıllı Filtreleme (Smart Filtering):**
  - Tüm veriyi doktora yığmak yerine, sadece hastanın durumunu etkileyen **Kritik (Red Flag)** ve **Önemli (Yellow Flag)** uyarıları filtreler.
  - Önemsiz yan etkiler (örn. hafif baş ağrısı), hastanın klinik tablosunda kritik değilse raporda öne çıkarılmaz.

---

## 4. Mimari ve Entegrasyon Yeteneği

Mevcut hastane bilgi yönetim sistemlerine (HBYS) ve diğer sağlık uygulamalarına kolayca entegre olabilen modern bir mimariye sahiptir.

### Katmanlı Mimari (3-Layer Architecture):
1.  **Veri Katmanı:** OpenFDA ve diğer güvenilir medikal API'ler.
2.  **Analiz Motoru (Backend):**
    - **Rule-Based Pre-processing:** Kurallı motorumuz, veriyi önce hızlıca tarar, ciddiyet skorlaması yapar ve gereksiz bilgiyi eler.
    - **AI Clinical Agent (OpenAI/Anthropic):** Elenen "yüksek kaliteli" veriyi bir klinik eczacı gibi yorumlar, özetler ve aksiyon önerileri (monitoring plan, alternatif ilaç) oluşturur.
3.  **API Gateway:** Sonuçları standart JSON formatında sunar.

### Entegrasyon Kolaylığı:
- **Teknoloji:** RESTful API (FastAPI)
- **Input/Output:** Standart JSON formatı.
- **Uyumluluk:** Herhangi bir web, mobil veya masaüstü uygulaması (E-Nabız benzeri sistemler, Doktor asistanı uygulamaları) tek bir API çağrısı ile bu analizi sistemine dahil edebilir.
- **Performans:** Hibrit yapı (Rule-based + AI) sayesinde analizler saniyeler içinde tamamlanır.

---

**Sonuç:** Neuropharm, OpenFDA'nın güvenilir verisini, hastanın detaylı klinik öyküsüyle birleştirerek yapay zeka destekli, kişiselleştirilmiş ve entegrasyona hazır profesyonel bir ilaç analiz raporu sunar.
