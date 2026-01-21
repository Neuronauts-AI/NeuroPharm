# İLAÇ VERİSİ ANALİZ DOKÜMANLARI

## 📋 İçindekiler

Bu klasörde FDA openFDA drug label veri setinin yapısını anlatan ve yapay zeka modelleri için klinik çıkarım rehberleri içeren 3 adet doküman bulunmaktadır.

---

## 📁 Dokümanlar

### 1. VERI_YAPISI_ANALIZ.md
**Amaç:** Veri yapısının genel anlayışı ve kategorizasyonu

**İçerik:**
- 87 farklı veri alanının tam listesi
- 7 klinik kategori altında alan gruplandırması:
  1. Etkileşim (Drug Interactions)
  2. Dikkat Edilmesi Gereken Klinik Noktalar
  3. Doz ve Kullanım Önerileri
  4. İzlem ve Takip Önerileri
  5. Alternatif Öneriler
  6. İleri Dönem Yan Etkiler
  7. Hastaya Söylenmesi Gereken Noktalar
- Her kategori için örnek prompt'lar
- Alan doluluğu istatistikleri
- Veri hiyerarşisi şeması

**Kime Göre:**
- Veri bilimciler
- Proje yöneticileri
- Yapay zeka mimarları
- Veriyi ilk defa inceleyenler

**Kullanım:**
```
"Bu veri setinde ne var? Hangi alanlar hangi klinik soru için kullanılır?"
→ Bu dokümanı okuyun
```

---

### 2. YAPAY_ZEKA_KONTROL_LISTESI.md
**Amaç:** YZ modelinin adım adım ne yapacağını gösteren operasyonel rehber

**İçerik:**
- 8 öncelik seviyesinde kontrol listesi
- Her alan için:
  - Doluluğu (%)
  - Öncelik yıldızı (★★★★★)
  - Kontrol edilmesi gerekenler
  - Örnek prompt
- Akış şeması (baştan sona kontrol sırası)
- Hızlı referans tablosu
- Alan yoksa ne yapılacağı rehberi
- Dil ve ton önerileri

**Kime Göre:**
- Prompt mühendisleri
- Yapay zeka eğiticileri
- Klinik karar destek sistemi geliştiricileri
- Sağlık sektörü chatbot geliştiricileri

**Kullanım:**
```
"Yapay zekaya bir hasta verisi ve ilaç bilgisi veriyorum, ne sırayla ne yapmalı?"
→ Bu dokümanı kullanın (checklistler ve akış şeması)
```

**Öne Çıkan Bölümler:**
- ⚠️ Kritik Öncelik 1: Güvenlik Kontrolleri
  - Black Box Uyarısı (12.6% doluluğa rağmen KRİTİK)
  - Kontrendikasyon
  - Ciddi Uyarılar
- 📋 Öncelik 2: Doz ve Kullanım (97%+ dolu)
- 🔄 Öncelik 3: Etkileşim Kontrolleri
- 👥 Öncelik 4: Özel Popülasyonlar (yaşlı/çocuk/gebe)
- 💊 Öncelik 5: Yan Etkiler
- 🎯 Öncelik 6: Hasta Eğitimi

---

### 3. TEKNIK_IMPLEMENTASYON_REHBERI.md
**Amaç:** Kod seviyesinde implementasyon rehberi

**İçerik:**
- JSON schema detayları
- Python kod örnekleri:
  - `get_text_from_field()` - Metin alanlarını işleme
  - `safety_check()` - Güvenlik kontrolü
  - `extract_dosage_info()` - Doz çıkarımı
  - `analyze_adverse_reactions()` - Yan etki analizi
  - `check_drug_interactions()` - Etkileşim kontrolü
- Prompt template'leri (hazır kullanıma uygun)
- Performans optimizasyonu (indeksleme, caching)
- Hata yönetimi
- Unit test örnekleri

**Kime Göre:**
- Backend geliştiriciler
- Python developer'lar
- NLP mühendisleri
- Sistem entegratörleri

**Kullanım:**
```
"Bu veriyi Python'da nasıl işlerim? Hangi fonksiyonları yazmalıyım?"
→ Bu dokümanı kullanın (copy-paste edilebilir kod blokları)
```

**Öne Çıkan Bölümler:**
- Bölüm 2: Alan Tipleri ve İşleme (string array, openfda object)
- Bölüm 3: Klinik Çıkarım Fonksiyonları (5 adet hazır fonksiyon)
- Bölüm 4: Prompt Template'leri (hemen kullanıma hazır)
- Bölüm 5: Örnek Kullanım Senaryoları
- Bölüm 6: Performans Optimizasyonu

---

## 🎯 Hangi Dokümanı Ne Zaman Kullanmalı?

### Senaryo 1: "Veri setini ilk defa görüyorum, ne var ne yok?"
→ **VERI_YAPISI_ANALIZ.md**
- Sayfa 1-3: Genel bakış
- Sayfa 4-10: Kategori-alan eşleştirmeleri
- En son sayfa: Tüm alanların listesi

### Senaryo 2: "Bir chatbot yapıyorum, YZ'ye nasıl talimat vereyim?"
→ **YAPAY_ZEKA_KONTROL_LISTESI.md**
- Öncelik bölümlerini sırayla okuyun (1-8)
- "Kontrol Sırası Özeti" akış şemasını kullanın
- Hızlı Referans Tablosu'nu bookmark'layın

### Senaryo 3: "Python'da kod yazacağım, nasıl başlayacağım?"
→ **TEKNIK_IMPLEMENTASYON_REHBERI.md**
- Bölüm 1: Veri yapısını anlayın
- Bölüm 2-3: Fonksiyonları kopyalayın
- Bölüm 5: Senaryo örneklerinden birine bakın
- Bölüm 8: Testleri çalıştırın

### Senaryo 4: "Hızlıca bir şey aramak istiyorum"
→ **README (bu dosya)** + **Hızlı Referans Tablosu (aşağıda)**

---

## ⚡ HIZLI REFERANS TABLOSU

| Klinik Soru | İncelenecek Alanlar | Doluluğu | Doküman Bölümü |
|-------------|---------------------|----------|----------------|
| **Bu ilacı kullanabilir mi?** | `contraindications`, `boxed_warning`, `warnings` | %34, %13, %74 | Kontrol Listesi → Öncelik 1 |
| **Ne kadar almalı?** | `dosage_and_administration`, `geriatric_use`, `pediatric_use` | %98, %26, %28 | Kontrol Listesi → Öncelik 2 |
| **Diğer ilaçlarla sorun olur mu?** | `drug_interactions` | %29 | Kontrol Listesi → Öncelik 3 |
| **Gebe kullanabilir mi?** | `pregnancy`, `contraindications` | %28, %34 | Kontrol Listesi → Öncelik 4 |
| **Yan etkileri neler?** | `adverse_reactions`, `warnings` | %36, %74 | Kontrol Listesi → Öncelik 5 |
| **Nasıl saklamalı?** | `storage_and_handling` | %29 | Kontrol Listesi → Öncelik 6 |
| **Ne zaman doktora gitmeli?** | `stop_use`, `warnings`, `adverse_reactions` | %36, %74, %36 | Kontrol Listesi → Öncelik 5-6 |
| **Hangi testleri takip etmeli?** | `laboratory_tests` (varsa) | %4 | Kontrol Listesi → Öncelik 7 |
| **Alternatif ilaç var mı?** | `openfda.generic_name`, `pharm_class_moa` | %90+ | Veri Yapısı → Bölüm 5 |

---

## 📊 ÖNEMLİ İSTATİSTİKLER

### En Dolu Alanlar (Neredeyse Her İlaçta Var)
1. `dosage_and_administration` - %97.6 ✓
2. `indications_and_usage` - %97.4 ✓
3. `warnings` - %74.3 ✓

### Düşük Dolu Ama Kritik Alanlar (Varsa Çok Önemli)
1. `boxed_warning` - %12.6 ⚠️ BLACK BOX UYARISI
2. `laboratory_tests` - %3.6 ⚠️ İzlem testleri
3. `instructions_for_use` - %2.7 ⚠️ Özel kullanım talimatları

### OpenFDA Alanları (Yapılandırılmış, %90+ dolu)
- `brand_name`, `generic_name`, `manufacturer_name`
- `product_ndc`, `route`, `substance_name`
- `pharm_class_epc`, `pharm_class_moa`, `pharm_class_pe`

---

## 🚀 HIZLI BAŞLANGIÇ

### Adım 1: Veriyi Yükleme
```python
import json

with open('drug-label-0001-of-0013.json', 'r') as f:
    data = json.load(f)

# İlk ilacı al
first_drug = data['results'][0]
print(f"İlaç: {first_drug['openfda']['brand_name'][0]}")
```

### Adım 2: Temel Alanları Okuma
```python
# Dozu oku
dosage = first_drug.get('dosage_and_administration', ['Bilgi yok'])[0]
print(f"Doz: {dosage[:200]}...")

# Uyarıları oku
warnings = first_drug.get('warnings', ['Bilgi yok'])[0]
print(f"Uyarı: {warnings[:200]}...")
```

### Adım 3: Güvenlik Kontrolü Yapma
```python
# Black box var mı?
if 'boxed_warning' in first_drug:
    print("⚠️ KRİTİK: BLACK BOX UYARISI VAR!")
    print(first_drug['boxed_warning'][0][:300])

# Kontrendikasyon var mı?
if 'contraindications' in first_drug:
    print("Kontrendikasyonlar:")
    print(first_drug['contraindications'][0][:300])
```

---

## 🔧 DETAYLI IMPLEMENTASYON İÇİN

**Tam fonksiyonlar için:**
→ `TEKNIK_IMPLEMENTASYON_REHBERI.md` → Bölüm 3

**Prompt örnekleri için:**
→ `YAPAY_ZEKA_KONTROL_LISTESI.md` → Her öncelik bölümü

**Alan eşleştirmeleri için:**
→ `VERI_YAPISI_ANALIZ.md` → Kategorilere göre alanlar

---

## ❓ SSS

### S: Tüm ilaçlarda tüm alanlar dolu mu?
**C:** Hayır. OTC (reçetesiz) ilaçlarda farklı, reçeteli ilaçlarda farklı alanlar dolu olabilir. En güvenilir alanlar: `dosage_and_administration` (%98), `indications_and_usage` (%97), `warnings` (%74).

### S: Black box uyarısı olan kaç ilaç var?
**C:** İlk 1000 kayıtta %12.6 (126 ilaç). Bu düşük ama bu alanın olması KRİTİK anlamına gelir.

### S: Yapay zeka hangi alanı önce kontrol etmeli?
**C:**
1. `boxed_warning` (varsa)
2. `contraindications`
3. `warnings`
4. `dosage_and_administration`

Akış şeması için: `YAPAY_ZEKA_KONTROL_LISTESI.md` → "Kontrol Sırası Özeti"

### S: Laboratory tests alanı neden sadece %3.6 dolu?
**C:** Çoğu ilaç için rutin laboratuvar takibi gerekmez. Ama bu alan varsa (örn. warfarin için INR takibi), MÜ TLAKA kontrol edilmelidir.

### S: OpenFDA nedir, neden ayrı bir nesne?
**C:** OpenFDA, FDA'nın yapılandırılmış metadata'sıdır. İlaç arama, kategorize etme, alternatif bulma gibi işlemler için kullanılır. Klinik metin alanlarından farklı, daha yapılandırılmış veridir.

---

## 📞 DESTEK VE KAYNAK

### Bu Dokümanlar Hakkında
- **Oluşturulma Tarihi:** 21 Ocak 2026
- **Veri Seti:** FDA openFDA Drug Labels (253,426 ilaç kaydı)
- **Veri Güncelliği:** 17 Ocak 2026

### Ek Kaynaklar
- FDA openFDA API: https://open.fda.gov/apis/drug/label/
- Farmakolojik Sınıflar: https://www.fda.gov/industry/structured-product-labeling-resources/pharmacologic-class
- UNII Database: https://precision.fda.gov/uniisearch

---

## 📝 DEĞİŞİKLİK GEÇMİŞİ

**v1.0 (21 Ocak 2026)**
- İlk versiyon
- 3 ana doküman oluşturuldu
- 87 alan kategorize edildi
- Python kod örnekleri eklendi
- Prompt template'leri hazırlandı

---

## ⚖️ YASAL UYARI

Bu dokümanlar FDA openFDA veri setinin yapısını açıklamak için hazırlanmıştır.

**ÖNEMLİ:**
- Bu bilgiler tıbbi tavsiye değildir
- Yapay zeka çıktıları mutlaka sağlık profesyoneli tarafından doğrulanmalıdır
- İlaç reçeteleme/doz ayarlama yetkisi sadece lisanslı sağlık çalışanlarındadır
- Her kullanım senaryosunda "doktorunuza danışın" uyarısı eklenmelidir

---

## ✅ KONTROL LİSTESİ: Dokümanlara Hazır Mısınız?

Başlamadan önce kontrol edin:

- [ ] Hangi amaçla kullanacağınızı belirlediniz (chatbot/analiz/backend)
- [ ] Yukarıdaki "Hangi Dokümanı Ne Zaman Kullanmalı" tablosunu okudunuz
- [ ] Python 3.7+ kurulu (kod örnekleri için)
- [ ] JSON dosyaları erişilebilir durumda
- [ ] Klinik terminoloji ile aşinalık (veya tıbbi danışman desteği var)

Hazırsanız, uygun dokümanı seçin ve başlayın! 🚀
