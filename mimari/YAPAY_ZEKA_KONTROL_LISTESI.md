# YAPAY ZEKA İÇİN İLAÇ ANALİZİ KONTROL LİSTESİ

## Hızlı Başvuru Kılavuzu

Bu doküman, yapay zeka modelinin ilaç verisi analiz ederken hangi sırayla hangi alanları kontrol etmesi gerektiğini gösterir.

---

## ⚠️ KRİTİK ÖNCELIK 1: GÜVENLİK KONTROLLERI

### 1.1 BLACK BOX Uyarısı Kontrolü
```python
ALAN: boxed_warning
DOLULUĞU: %12.6 (sadece kritik ilaçlarda var)
ÖNCELİK: ★★★★★

KONTROL:
✓ Bu alan VARSA → FDA'nın en ciddi uyarısı
✓ İçeriği MUTLAKA hastaya iletilmeli
✓ Örnek: İntihar riski, ölüm riski, organ hasarı

PROMPT ÖRNEĞİ:
"boxed_warning alanını kontrol et. Varsa, içeriğini 3 madde halinde özetle ve hastaya acil söylenmesi gereken kritik bilgileri vurgula."
```

### 1.2 Kontrendikasyon Kontrolü
```python
ALAN: contraindications
DOLULUĞU: %34.2
ÖNCELİK: ★★★★★

KONTROL:
✓ İlacın KESİNLİKLE kullanılmaması gereken durumlar
✓ Hastanın mevcut durumu ile çapraz kontrol

PROMPT ÖRNEĞİ:
"contraindications alanından hastanın gebelik, emzirme, böbrek/karaciğer yetmezliği durumlarında kesin yasak var mı kontrol et."
```

### 1.3 Ciddi Uyarılar
```python
ALAN: warnings
DOLULUĞU: %74.3 (EN DOLU ALANLARDAN BİRİ)
ÖNCELİK: ★★★★☆

KONTROL:
✓ Ciddi yan etkiler
✓ Özel dikkat gerektiren durumlar
✓ Acil durum belirtileri

PROMPT ÖRNEĞİ:
"warnings alanından yaşamı tehdit eden yan etkileri ve acil servise gidilmesi gereken belirtileri çıkar."
```

---

## 📋 ÖNCELIK 2: DOZ VE KULLANIM

### 2.1 Endikasyon Kontrolü
```python
ALAN: indications_and_usage
DOLULUĞU: %97.4 (NEREDEYSE HER İLAÇTA VAR)
ÖNCELİK: ★★★★★

KONTROL:
✓ İlaç ne için kullanılır?
✓ Hastanın tanısı uygun mu?
✓ FDA onaylı kullanım alanları

PROMPT ÖRNEĞİ:
"indications_and_usage alanından ilacın hangi hastalıklar için FDA onaylı olduğunu listele. Hastanın 'tip 2 diyabet' tanısı bu kullanım alanına uyuyor mu?"
```

### 2.2 Doz Bilgileri
```python
ALAN: dosage_and_administration
DOLULUĞU: %97.6 (NEREDEYSE HER İLAÇTA VAR)
ÖNCELİK: ★★★★★

KONTROL:
✓ Başlangıç dozu
✓ Maksimum günlük doz
✓ Özel popülasyonlarda doz ayarı (yaşlı, çocuk, böbrek/karaciğer)
✓ Uygulama zamanı (tok/aç karın)

PROMPT ÖRNEĞİ:
"dosage_and_administration alanından şunları çıkar:
1. Erişkin başlangıç dozu
2. Maksimum günlük doz
3. Yaşlılarda (>65 yaş) doz ayarlaması
4. Böbrek yetmezliğinde doz ayarlaması
5. Ne zaman alınacağı (sabah/akşam, yemek ile/ayrı)"
```

### 2.3 Aktif Maddeler
```python
ALAN: active_ingredient
DOLULUĞU: %61.8
ÖNCELİK: ★★★★☆

KONTROL:
✓ Etken madde nedir?
✓ Miktarı nedir?
✓ Kombine ilaç mı?

PROMPT ÖRNEĞİ:
"active_ingredient alanından etken madde ve miktarını çıkar. Kombine ilaç ise tüm bileşenleri listele."
```

---

## 🔄 ÖNCELIK 3: ETKİLEŞİM KONTROLLERI

### 3.1 İlaç-İlaç Etkileşimleri
```python
ALAN: drug_interactions
DOLULUĞU: %28.5 (sadece etkileşimi olan ilaçlarda)
ÖNCELİK: ★★★★★

KONTROL:
✓ Hastanın kullandığı diğer ilaçlar
✓ Ciddi etkileşimler
✓ Orta düzey etkileşimler
✓ Besinlerle etkileşim

PROMPT ÖRNEĞİ:
"Hasta şu ilaçları kullanıyor: [Warfarin, Metformin, Lisinopril].
drug_interactions alanından bu ilaçlardan herhangi biri ile etkileşim var mı kontrol et. Varsa:
1. Etkileşimin ciddiyeti (ciddi/orta/hafif)
2. Etkileşimin mekanizması
3. Klinik önemi
4. Yönetim önerisi"
```

### 3.2 Önlemler
```python
ALAN: precautions
DOLULUĞU: %11.7
ÖNCELİK: ★★★☆☆

KONTROL:
✓ Genel önlemler
✓ Dikkat edilmesi gerekenler

NOT: Düşük doluluğa sahip ama varsa önemli
```

---

## 👥 ÖNCELIK 4: ÖZEL POPÜLASYONLAR

### 4.1 Yaşlı Hastalar (≥65 yaş)
```python
ALAN: geriatric_use
DOLULUĞU: %25.5
ÖNCELİK: ★★★★☆ (yaşlı hasta için)

KONTROL:
✓ Doz ayarlaması gerekli mi?
✓ Özel yan etkiler var mı?
✓ Düşme riski var mı?
✓ Kognitif etkileri var mı?

PROMPT ÖRNEĞİ:
"Hasta 78 yaşında. geriatric_use alanından:
1. Doz değişikliği önerisi
2. Yaşlılarda sık görülen yan etkiler
3. Düşme/sedasyon riski
4. Özel takip gereksinimleri"
```

### 4.2 Çocuk Hastalar (<18 yaş)
```python
ALAN: pediatric_use
DOLULUĞU: %28.4
ÖNCELİK: ★★★★☆ (çocuk hasta için)

KONTROL:
✓ FDA onayı var mı?
✓ Yaş gruplarına göre doz
✓ Güvenlilik profili

PROMPT ÖRNEĞİ:
"Hasta 8 yaşında, 25 kg. pediatric_use alanından:
1. Bu yaş grubu için FDA onayı var mı?
2. Doz hesaplaması (mg/kg varsa)
3. Çocuklarda özel uyarılar"
```

### 4.3 Gebelik
```python
ALAN: pregnancy
DOLULUĞU: %28.0
ÖNCELİK: ★★★★★ (gebe hasta için)

KONTROL:
✓ Gebelik kategorisi (A/B/C/D/X)
✓ Trimester bazlı riskler
✓ Teratojenite

PROMPT ÖRNEĞİ:
"Hasta gebe, 2. trimester. pregnancy alanından:
1. Gebelik kategorisi
2. Fetal riskler
3. Kullanım önerisi (kesinlikle kullanılmamalı / fayda-risk değerlendirmesi / güvenli)
4. Alternatif ilaç önerisi gerekli mi?"
```

### 4.4 Emzirme
```python
ALAN: nursing_mothers
DOLULUĞU: %13.9
ÖNCELİK: ★★★★☆ (emziren hasta için)

KONTROL:
✓ Anne sütüne geçiyor mu?
✓ Bebeğe riski var mı?

PROMPT ÖRNEĞİ:
"Hasta emziriyor. nursing_mothers alanından:
1. Anne sütüne geçiş durumu
2. Bebeğe potansiyel riskler
3. Emzirmeye devam edilebilir mi?"
```

---

## 💊 ÖNCELIK 5: YAN ETKİLER

### 5.1 Advers Reaksiyonlar
```python
ALAN: adverse_reactions
DOLULUĞU: %35.6
ÖNCELİK: ★★★★☆

KONTROL:
✓ Sık görülen yan etkiler (>10%)
✓ Az görülen yan etkiler (1-10%)
✓ Nadir ama ciddi yan etkiler (<1%)

PROMPT ÖRNEĞİ:
"adverse_reactions alanından:
1. En sık 5 yan etki ve görülme oranları
2. Ciddi ama nadir yan etkiler
3. Hangi yan etkiler için acil servise gidilmeli
4. Geçici vs kalıcı yan etkiler"
```

### 5.2 Aşırı Doz
```python
ALAN: overdosage
DOLULUĞU: %31.4
ÖNCELİK: ★★★☆☆

KONTROL:
✓ Aşırı doz belirtileri
✓ Antidot var mı?
✓ Acil müdahale

PROMPT ÖRNEĞİ:
"overdosage alanından:
1. Aşırı doz belirtileri
2. Spesifik antidot
3. Acil yönetim önerileri"
```

---

## 🎯 ÖNCELIK 6: HASTA EĞİTİMİ

### 6.1 Hasta Bilgilendirme
```python
ALAN: information_for_patients
DOLULUĞU: %28.4
ÖNCELİK: ★★★★☆

KONTROL:
✓ Hastaya anlatılması gerekenler
✓ Günlük yaşam önerileri
✓ Ne zaman doktora başvurmalı

PROMPT ÖRNEĞİ:
"information_for_patients alanını basit Türkçe'ye çevir. Hasta için 5 maddelik bilgilendirme metni hazırla:
1. İlaç ne işe yarar
2. Nasıl kullanılır
3. Nelere dikkat edilmeli
4. Hangi durumlarda doktora başvurmalı
5. Saklama koşulları"
```

### 6.2 Kullanım Sırasında Dikkat
```python
ALAN: when_using
DOLULUĞU: %30.7
ÖNCELİK: ★★★☆☆

KONTROL:
✓ Araç kullanımı
✓ Alkol tüketimi
✓ Güneşe maruz kalma
✓ Diğer faaliyetler

PROMPT ÖRNEĞİ:
"when_using alanından hastaya günlük yaşamda nelere dikkat etmesi gerektiğini listele."
```

### 6.3 Kullanımı Durdurma
```python
ALAN: stop_use
DOLULUĞU: %35.8
ÖNCELİK: ★★★★☆

KONTROL:
✓ Hangi belirtilerde durdurulmalı
✓ Acil durum belirtileri

PROMPT ÖRNEĞİ:
"stop_use alanından hangi belirtiler görüldüğünde ilacı durdurmalı ve doktora başvurmalı?"
```

### 6.4 Saklama Koşulları
```python
ALAN: storage_and_handling
DOLULUĞU: %28.5
ÖNCELİK: ★★☆☆☆

KONTROL:
✓ Sıcaklık aralığı
✓ Işıktan koruma
✓ Nem kontrolü
✓ Son kullanma

PROMPT ÖRNEĞİ:
"storage_and_handling alanından:
1. İdeal saklama sıcaklığı
2. Özel saklama koşulları (ışık, nem vb.)
3. Açıldıktan sonra raf ömrü"
```

---

## 🔬 ÖNCELIK 7: KLİNİK FARMAKOLOJİ

### 7.1 Etki Mekanizması
```python
ALAN: clinical_pharmacology
DOLULUĞU: %33.7
ÖNCELİK: ★★★☆☆

KONTROL:
✓ Nasıl çalışır?
✓ Farmakokinetik (emilim, dağılım, metabolizma, atılım)
✓ Farmakodynamik (etki mekanizması)

PROMPT ÖRNEĞİ:
"clinical_pharmacology alanından:
1. İlacın etki mekanizması (basit dille)
2. Ne kadar sürede etki gösterir
3. Vücutta ne kadar kalır (yarılanma ömrü)
4. Nasıl metabolize olur ve atılır"
```

### 7.2 Laboratuvar Testleri
```python
ALAN: laboratory_tests
DOLULUĞU: %3.6 (ÇOK DÜŞÜK ama varsa ÇOK ÖNEMLİ)
ÖNCELİK: ★★★★★ (varsa)

KONTROL:
✓ Hangi testler takip edilmeli
✓ Ne sıklıkla kontrol edilmeli
✓ Kritik değerler

PROMPT ÖRNEĞİ:
"laboratory_tests alanı VAR MI kontrol et. Varsa:
1. Hangi laboratuvar testleri izlenmeli
2. Ne sıklıkla yapılmalı
3. Hangi değerler tehlikeli kabul edilir"
```

---

## 🔄 ÖNCELIK 8: ALTERNATİF İLAÇ ÖNERME

### 8.1 OpenFDA Verileri ile Alternatif Bulma
```python
ALANLAR: openfda.generic_name, openfda.brand_name, openfda.substance_name, openfda.pharm_class_moa
DOLULUĞU: %90+ (yapılandırılmış data)
ÖNCELİK: ★★★★☆

KONTROL:
✓ Jenerik eşdeğerleri
✓ Aynı etki mekanizmalı ilaçlar
✓ Farklı dozaj formları

PROMPT ÖRNEĞİ:
"1. openfda.generic_name'den jenerik adını al
2. openfda.brand_name'den tüm marka adlarını listele
3. openfda.pharm_class_moa'dan etki mekanizması sınıfını bul
4. Aynı sınıftan alternatif ilaçları öner (veri setinde ara)"
```

---

## 📊 KONTROL SIRASI ÖZETİ (Akış Şeması)

```
BAŞLA
  ↓
1. GÜVENLİK KONTROL (boxed_warning, contraindications, warnings)
  ↓
  Güvenli mi?
  ├─ HAYIR → DURDUR, riski bildir
  └─ EVET ↓

2. UYGUNLUK KONTROL (indications_and_usage)
  ↓
  Endikasyon uygun mu?
  ├─ HAYIR → Alternatif öner
  └─ EVET ↓

3. DOZ KONTROL (dosage_and_administration)
  ↓
  Özel popülasyon? (yaşlı/çocuk/gebe/böbrek-karaciğer)
  ├─ EVET → geriatric_use / pediatric_use / pregnancy / use_in_specific_populations
  └─ HAYIR ↓

4. ETKİLEŞİM KONTROL (drug_interactions)
  ↓
  Ciddi etkileşim var mı?
  ├─ EVET → Alternatif öner / Doz ayarla
  └─ HAYIR ↓

5. YAN ETKİ BİLGİLENDİRME (adverse_reactions)
  ↓
6. HASTA EĞİTİMİ (information_for_patients, when_using, stop_use, storage_and_handling)
  ↓
BİTİR
```

---

## 💡 YAPAY ZEKA İÇİN GENEL TAVSİYELER

### 1. Alan Yoksa Ne Yapmalı?
```python
IF alan YOK:
    → "Bu ilaç için [alan adı] bilgisi mevcut değil."
    → Genel bilgi verme, başka kaynaktan uydurma
    → İlgili alanlara yönlendir

ÖRNEK:
"laboratory_tests alanı bu ilaçta bulunmuyor. Ancak clinical_pharmacology alanından ilacın karaciğerde metabolize olduğu görülüyor, bu nedenle karaciğer fonksiyon testlerinin izlenmesi mantıklı olabilir. Doktorunuza danışın."
```

### 2. Öncelik Matrisi
```
KRİTİK (MUTLAKA KONTROL ET):
- boxed_warning (varsa)
- contraindications
- warnings
- dosage_and_administration
- indications_and_usage

YÜKSEK (ÇOK ÖNEMLİ):
- drug_interactions
- adverse_reactions
- Özel popülasyon alanları (hasta durumuna göre)

ORTA (ÖNEMLİ):
- clinical_pharmacology
- overdosage
- storage_and_handling

DÜŞÜK (VARSA GÜ İYİ):
- laboratory_tests (düşük dolulukta ama varsa kritik)
- instructions_for_use
```

### 3. Dil ve Ton
```
✓ Hastaya basit, anlaşılır Türkçe ile anlat
✓ Tıbbi terimleri açıkla
✓ Madde madde listele
✓ Acil durumları vurgula
✓ Doktora danışmanın önemini belirt

✗ Karmaşık tıbbi jargon kullanma
✗ Hastayı korkutma ama riskleri de gizleme
✗ Kesin tanı/tedavi önerisi verme
```

---

## HIZLI REFERANS TABLOSU

| Klinik Soru | Kontrol Edilecek Alanlar | Öncelik |
|-------------|-------------------------|---------|
| Bu ilacı kullanabilir mi? | contraindications, warnings, boxed_warning | ★★★★★ |
| Ne kadar kullanmalı? | dosage_and_administration, pediatric_use, geriatric_use | ★★★★★ |
| Diğer ilaçlarla sorun olur mu? | drug_interactions | ★★★★★ |
| Gebe kullanabilir mi? | pregnancy, contraindications | ★★★★★ |
| Hangi yan etkiler olabilir? | adverse_reactions, warnings | ★★★★☆ |
| Nasıl saklamalı? | storage_and_handling | ★★☆☆☆ |
| Ne zaman doktora gitmeli? | stop_use, warnings, adverse_reactions | ★★★★☆ |
| Takip gereken testler? | laboratory_tests (varsa) | ★★★★★ |
| Alternatif ilaç var mı? | openfda (generic_name, pharm_class_moa) | ★★★★☆ |

---

## SONUÇ

Bu kontrol listesi ile yapay zeka:
1. Sistematik olarak güvenlik kontrolü yapar
2. Klinik öneme göre önceliklendirir
3. Eksik veriyi tanır ve belirtir
4. Hastaya anlaşılır bilgi sunar
5. Doktor-hasta iletişimini destekler

**ÖNEMLİ:** Yapay zeka asla doktor yerine geçemez. Tüm çıktılar "bilgilendirme amaçlıdır, doktorunuza danışın" uyarısı içermelidir.
