# İLAÇ VERİSİ YAPISI ANALİZİ VE YZ EĞİTİM REHBERİ

## Genel Bakış

Bu dokümanda FDA openFDA drug label veri setinin yapısı analiz edilmiş ve yapay zeka modelinin klinik çıkarımlar yapabilmesi için hangi veri alanlarını incelemesi gerektiği kategorize edilmiştir.

**Toplam Veri Alanı:** 87 farklı alan
**Veri Formatı:** JSON (openFDA API formatı)

---

## 1. ETKİLEŞİM (Drug Interactions)

### Yapay Zeka İncelemesi Gereken Alanlar:

```json
{
  "drug_interactions": "İlaç-ilaç etkileşimleri detaylı açıklaması",
  "precautions": "Önlemler ve dikkat edilmesi gerekenler",
  "contraindications": "Kontrendikasyonlar (kesin yasaklar)",
  "drug_and_or_laboratory_test_interactions": "İlaç-laboratuvar etkileşimleri"
}
```

### Klinik Önem:
- **drug_interactions**: Diğer ilaçlarla beraber kullanımda olabilecek riskler
- **contraindications**: Hangi durumlarda KESİNLİKLE kullanılmamalı
- **precautions**: Dikkatli kullanılması gereken durumlar

### Örnek Prompt:
> "Bu ilacın drug_interactions, precautions ve contraindications alanlarını analiz et. Hastanın kullandığı diğer ilaçlarla potansiyel etkileşimleri belirle."

---

## 2. DİKKAT EDİLMESİ GEREKEN KLİNİK NOKTALAR

### Yapay Zeka İncelemesi Gereken Alanlar:

```json
{
  "warnings": "Genel uyarılar",
  "boxed_warning": "BLACK BOX uyarılar (en kritik)",
  "warnings_and_cautions": "Uyarılar ve önlemler",
  "precautions": "Genel önlemler",
  "contraindications": "Kontrendikasyonlar",
  "when_using": "Kullanırken dikkat edilecekler",
  "stop_use": "Hangi durumlarda kullanım durdurulmalı",
  "do_not_use": "Hangi durumlarda kullanılmamalı",
  "ask_doctor": "Doktora danışılması gereken durumlar",
  "ask_doctor_or_pharmacist": "Doktor veya eczacıya danışılması gerekenler"
}
```

### Klinik Önem:
- **boxed_warning**: FDA'nın en şiddetli uyarısı - ÖNCELİK 1
- **warnings**: Ciddi yan etkiler ve riskler
- **stop_use**: Hangi semptomlarda kullanımı durdurulmalı

### Örnek Prompt:
> "Önce boxed_warning alanını kontrol et. Varsa kritik uyarıları belirle. Sonra warnings ve stop_use alanlarından hastayı acilen ilgilendiren durumları listele."

---

## 3. DOZ VE KULLANIM ÖNERİLERİ

### Yapay Zeka İncelemesi Gereken Alanlar:

```json
{
  "dosage_and_administration": "Doz ve uygulama talimatları",
  "directions": "Kullanım yönergeleri",
  "indications_and_usage": "Endikasyonlar ve kullanım alanları",
  "purpose": "İlacın amacı",
  "active_ingredient": "Aktif maddeler",
  "dosage_forms_and_strengths": "Dozaj formları ve güçleri",
  "openfda.route": "Uygulama yolu (oral, IV, topical vb.)"
}
```

### Klinik Önem:
- **dosage_and_administration**: Başlangıç dozu, maksimum doz, özel popülasyonlar
- **indications_and_usage**: Hangi hastalıklarda kullanılır
- **active_ingredient**: Etken maddeler ve miktarları

### Örnek Prompt:
> "Dosage_and_administration alanından başlangıç dozunu, maksimum günlük dozu ve yaşlı hastalarda doz ayarlamasını çıkar. İndications_and_usage ile bu hastanın durumuna uygun olup olmadığını kontrol et."

---

## 4. İZLEM VE TAKİP ÖNERİLERİ

### Yapay Zeka İncelemesi Gereken Alanlar:

```json
{
  "clinical_pharmacology": "Klinik farmakoloji",
  "laboratory_tests": "Gerekli laboratuvar testleri",
  "information_for_patients": "Hasta bilgilendirmesi",
  "pediatric_use": "Pediatrik kullanım",
  "geriatric_use": "Geriatrik kullanım",
  "pregnancy": "Gebelik kategorisi ve bilgileri",
  "nursing_mothers": "Emzirme döneminde kullanım",
  "use_in_specific_populations": "Özel popülasyonlarda kullanım",
  "pharmacokinetics": "Farmakokinetik özellikler",
  "pharmacodynamics": "Farmakodinamik özellikler"
}
```

### Klinik Önem:
- **laboratory_tests**: Hangi testler düzenli takip edilmeli
- **pediatric_use / geriatric_use**: Yaş gruplarına özel dikkat edilecekler
- **pregnancy**: Gebelik kategorisi (A, B, C, D, X)
- **use_in_specific_populations**: Böbrek/karaciğer yetmezliği vb.

### Örnek Prompt:
> "Hastanın yaşı 75 ve böbrek yetmezliği var. Geriatric_use ve use_in_specific_populations alanlarından doz ayarlaması gerekip gerekmediğini kontrol et. Laboratory_tests alanından takip edilmesi gereken parametreleri belirle."

---

## 5. ALTERNATİF ÖNERİLER

### Yapay Zeka İncelemesi Gereken Alanlar:

```json
{
  "openfda": {
    "generic_name": "Jenerik adı",
    "brand_name": "Marka adları (liste)",
    "substance_name": "Aktif madde adları",
    "manufacturer_name": "Üretici firma",
    "product_ndc": "Ürün NDC kodları",
    "pharm_class_epc": "Farmakolojik sınıf (EPC)",
    "pharm_class_moa": "Etki mekanizması sınıfı",
    "pharm_class_pe": "Farmakolojik etki sınıfı"
  }
}
```

### Klinik Önem:
- **generic_name vs brand_name**: Aynı etken maddeyi içeren alternatif ürünler
- **pharm_class_moa**: Aynı mekanizmadaki alternatif ilaçları bulmak için
- **substance_name**: Kombine ürünlerde hangi maddeler var

### Örnek Prompt:
> "Bu ilacın generic_name'ini bul. Aynı substance_name'e sahip diğer brand_name alternatiflerini listele. Pharm_class_moa alanından benzer etki mekanizmalı alternatifleri önermek için sınıfı belirle."

---

## 6. İLERİ DÖNEM YAN ETKİLER

### Yapay Zeka İncelemesi Gereken Alanlar:

```json
{
  "adverse_reactions": "Advers reaksiyonlar (klinik çalışmalar)",
  "side_effects": "Yan etkiler",
  "postmarketing_experience": "Piyasaya sürülme sonrası deneyimler",
  "overdosage": "Aşırı doz durumu ve yönetimi",
  "drug_abuse_and_dependence": "Kötüye kullanım ve bağımlılık",
  "carcinogenesis_and_mutagenesis_and_impairment_of_fertility": "Kanserojenite ve fertilite"
}
```

### Klinik Önem:
- **adverse_reactions**: Hangi yan etkiler ne sıklıkta görülüyor
- **postmarketing_experience**: Klinik çalışmalarda görülmemiş nadir yan etkiler
- **overdosage**: Aşırı doz belirtileri ve acil müdahale

### Örnek Prompt:
> "Adverse_reactions alanından en sık görülen (%10+) yan etkileri listele. Postmarketing_experience alanında ciddi ama nadir görülen yan etkileri kontrol et. Overdosage alanından aşırı doz belirtilerini ve antidot bilgisini çıkar."

---

## 7. HASTAYA SÖYLENMESİ GEREKEN NOKTALAR

### Yapay Zeka İncelemesi Gereken Alanlar:

```json
{
  "information_for_patients": "Hasta bilgilendirme metni",
  "spl_patient_package_insert": "Hasta kullanma talimatı",
  "spl_medguide": "FDA onaylı ilaç rehberi",
  "warnings": "Uyarılar",
  "keep_out_of_reach_of_children": "Çocuklardan uzak tutma uyarısı",
  "when_using": "Kullanırken dikkat edilecekler",
  "stop_use": "Ne zaman kullanımı durdurmalı",
  "storage_and_handling": "Saklama koşulları",
  "how_supplied": "Nasıl tedarik edilir",
  "instructions_for_use": "Kullanım talimatları"
}
```

### Klinik Önem:
- **information_for_patients**: Hasta eğitimi için en önemli alan
- **storage_and_handling**: Saklama koşulları (sıcaklık, ışık vb.)
- **instructions_for_use**: Özellikle enjektörler, inhaler vb. için kritik

### Örnek Prompt:
> "Information_for_patients alanından hastaya basit dille anlatılacak önemli noktaları çıkar. Storage_and_handling'den saklama koşullarını belirle. Warnings'den hastanın günlük yaşamda dikkat etmesi gerekenleri listele."

---

## YAPAY ZEKA PROMPT ÖRNEKLERİ

### Senaryo 1: Yeni Reçete Kontrolü
```
Hastanın verileri:
- Yaş: 68
- Mevcut ilaçlar: Warfarin, Metformin
- Durum: Hipertansiyon

İlaç: [İlaç adı]

Görev:
1. drug_interactions alanından Warfarin ve Metformin ile etkileşim kontrolü
2. geriatric_use alanından yaşlılarda doz ayarlaması
3. contraindications alanından hipertansiyon hastalarında kullanım
4. boxed_warning varsa kritik uyarıları belirt
5. adverse_reactions'dan yaşlılarda sık görülen yan etkileri listele
```

### Senaryo 2: Hasta Eğitimi
```
İlaç: [İlaç adı]

Görev:
1. purpose alanından ilacın ne için kullanıldığını basit dille açıkla
2. dosage_and_administration'dan nasıl ve ne zaman alınacağını özetle
3. when_using alanından kullanırken dikkat edilecekleri listele
4. stop_use alanından hangi belirtilerde doktora başvurulacağını belirt
5. storage_and_handling'den nasıl saklanacağını söyle
6. adverse_reactions'dan en sık 5 yan etkiyi hastaya uygun dille açıkla
```

### Senaryo 3: İlaç Değişikliği Önerisi
```
Mevcut ilaç: [İlaç A]
Problem: Yan etki / etkileşim / maliyet

Görev:
1. openfda.pharm_class_moa alanından etki mekanizması sınıfını belirle
2. openfda.generic_name ile aynı etken maddeyi içeren alternatifleri bul
3. Benzer pharm_class_moa'ya sahip farklı ilaçları önermek için sınıfı kullan
4. Her alternatif için adverse_reactions karşılaştırması yap
5. Her alternatif için drug_interactions kontrolü yap
```

---

## VERİ YAPISI HİYERARŞİSİ

```json
{
  "meta": {
    "disclaimer": "...",
    "terms": "...",
    "last_updated": "2026-01-17"
  },
  "results": [
    {
      // Ana İlaç Bilgileri
      "id": "unique-id",
      "set_id": "unique-set-id",
      "effective_time": "20250113",
      "version": "5",

      // Klinik Bilgiler (String Array)
      "boxed_warning": ["..."],
      "warnings": ["..."],
      "contraindications": ["..."],
      "drug_interactions": ["..."],
      "adverse_reactions": ["..."],
      "dosage_and_administration": ["..."],
      "indications_and_usage": ["..."],
      // ... (87 alan daha)

      // OpenFDA Yapılandırılmış Verisi
      "openfda": {
        "brand_name": ["İlaç Adı 1", "İlaç Adı 2"],
        "generic_name": ["ETKEN MADDE"],
        "substance_name": ["SUBSTANCE 1", "SUBSTANCE 2"],
        "route": ["ORAL"],
        "manufacturer_name": ["ÜRETİCİ"],
        "product_ndc": ["12345-678-90"],
        "pharm_class_epc": ["Sınıf"],
        "pharm_class_moa": ["Mekanizma"],
        "pharm_class_pe": ["Etki"]
      }
    }
  ]
}
```

---

## ÖNEMLİ NOTLAR

### 1. Veri Formatı
- Çoğu alan **string array** formatında: `["metin"]`
- Bazı alanlar birden fazla paragraf içerebilir
- `openfda` nesnesi yapılandırılmış veri içerir

### 2. Alan Mevcudiyeti
- Tüm alanlar her ilaçta bulunmayabilir
- OTC (reçetesiz) ilaçlarda farklı alanlar olabilir
- Reçeteli ilaçlarda daha detaylı bilgi vardır

### 3. Öncelik Sırası
Yapay zeka analizi için öncelik sırası:

1. **boxed_warning** - En kritik uyarılar
2. **contraindications** - Kesin yasaklar
3. **drug_interactions** - Etkileşimler
4. **warnings** - Önemli uyarılar
5. **adverse_reactions** - Yan etkiler
6. **dosage_and_administration** - Doz bilgileri
7. Diğer alanlar

### 4. Özel Popülasyonlar
Mutlaka kontrol edilmesi gerekenler:
- **pregnancy** - Gebelikte kullanım
- **nursing_mothers** - Emzirmede kullanım
- **pediatric_use** - Çocuklarda kullanım
- **geriatric_use** - Yaşlılarda kullanım
- **use_in_specific_populations** - Böbrek/karaciğer yetmezliği

---

## SONUÇ

Bu yapı analizi ile yapay zeka modeli, klinik olarak anlamlı çıkarımlar yapabilmek için hangi veri alanlarına odaklanması gerektiğini bilir. Her kategori için ilgili alanlar belirlenmiş ve örnek promptlar hazırlanmıştır.

**Kullanım önerisi:** Yapay zeka modeline görev verirken, yukarıdaki kategori-alan eşleştirmelerini ve örnek promptları kullanarak spesifik talimatlar verin.
