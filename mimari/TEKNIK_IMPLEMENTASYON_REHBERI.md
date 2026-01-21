# TEKNİK İMPLEMENTASYON REHBERİ
## Yapay Zeka Modeli için İlaç Verisi İşleme

---

## 1. VERİ YAPISI (JSON Schema)

### 1.1 Ana Yapı
```json
{
  "meta": {
    "disclaimer": "string",
    "terms": "string",
    "license": "string",
    "last_updated": "YYYY-MM-DD",
    "results": {
      "skip": 0,
      "limit": 20000,
      "total": 253426
    }
  },
  "results": [
    {
      // İlaç kayıtları buraya
    }
  ]
}
```

### 1.2 İlaç Kaydı Yapısı
```json
{
  "id": "uuid-string",
  "set_id": "uuid-string",
  "effective_time": "YYYYMMDD",
  "version": "number-as-string",

  // Klinik Text Alanları (array of strings)
  "boxed_warning": ["text"],
  "warnings": ["text"],
  "warnings_and_cautions": ["text"],
  "contraindications": ["text"],
  "drug_interactions": ["text"],
  "adverse_reactions": ["text"],
  "dosage_and_administration": ["text"],
  "indications_and_usage": ["text"],
  "active_ingredient": ["text"],
  "purpose": ["text"],

  // Özel Popülasyonlar
  "pediatric_use": ["text"],
  "geriatric_use": ["text"],
  "pregnancy": ["text"],
  "nursing_mothers": ["text"],
  "use_in_specific_populations": ["text"],

  // Farmakolojik Bilgiler
  "clinical_pharmacology": ["text"],
  "pharmacokinetics": ["text"],
  "pharmacodynamics": ["text"],
  "mechanism_of_action": ["text"],

  // Hasta Bilgilendirme
  "information_for_patients": ["text"],
  "when_using": ["text"],
  "stop_use": ["text"],
  "do_not_use": ["text"],
  "ask_doctor": ["text"],
  "storage_and_handling": ["text"],
  "how_supplied": ["text"],

  // Diğer Önemli Alanlar
  "overdosage": ["text"],
  "laboratory_tests": ["text"],
  "precautions": ["text"],
  "description": ["text"],

  // Yapılandırılmış OpenFDA Verisi
  "openfda": {
    "application_number": ["string"],
    "brand_name": ["string", "string"],
    "generic_name": ["string"],
    "manufacturer_name": ["string"],
    "product_ndc": ["string"],
    "product_type": ["HUMAN PRESCRIPTION DRUG" | "HUMAN OTC DRUG"],
    "route": ["ORAL" | "TOPICAL" | "INTRAVENOUS" | ...],
    "substance_name": ["string", "string"],
    "pharm_class_epc": ["string"],  // Established Pharmacologic Class
    "pharm_class_moa": ["string"],  // Mechanism of Action
    "pharm_class_pe": ["string"],   // Physiologic Effect
    "rxcui": ["string"],
    "spl_id": ["string"],
    "spl_set_id": ["string"],
    "unii": ["string"],
    "package_ndc": ["string"],
    "is_original_packager": [true/false]
  }
}
```

---

## 2. ALAN TİPLERİ VE İŞLEME

### 2.1 String Array Alanlarının İşlenmesi

**Problem:** Çoğu alan `["uzun metin"]` formatında

```python
def get_text_from_field(drug_record, field_name):
    """
    İlaç kaydından metin alanı çıkarır
    """
    if field_name not in drug_record:
        return None

    field_value = drug_record[field_name]

    # Boş alan kontrolü
    if not field_value:
        return None

    # Array ise ilk elementi al (genelde tek element var)
    if isinstance(field_value, list):
        if len(field_value) > 0:
            return field_value[0]
        return None

    return field_value

# Kullanım
warnings_text = get_text_from_field(drug_record, "warnings")
if warnings_text:
    print(f"Uyarılar: {warnings_text[:200]}...")
else:
    print("Bu ilaçta uyarı bilgisi yok")
```

### 2.2 OpenFDA Alanlarının İşlenmesi

```python
def get_openfda_field(drug_record, field_name, default="Bilgi yok"):
    """
    OpenFDA yapılandırılmış verisinden alan çıkarır
    """
    if "openfda" not in drug_record:
        return default

    openfda = drug_record["openfda"]

    if field_name not in openfda:
        return default

    value = openfda[field_name]

    # Liste ise virgülle birleştir
    if isinstance(value, list):
        return ", ".join(value) if value else default

    return value

# Kullanım
brand = get_openfda_field(drug_record, "brand_name")
generic = get_openfda_field(drug_record, "generic_name")
route = get_openfda_field(drug_record, "route")

print(f"Marka: {brand}")
print(f"Jenerik: {generic}")
print(f"Uygulama Yolu: {route}")
```

---

## 3. KLİNİK ÇIKARIM FONKSİYONLARI

### 3.1 Güvenlik Kontrolü (Öncelik 1)

```python
def safety_check(drug_record, patient_info):
    """
    İlacın hasta için güvenli olup olmadığını kontrol eder

    Args:
        drug_record: İlaç verisi
        patient_info: dict {
            'age': int,
            'is_pregnant': bool,
            'is_nursing': bool,
            'current_meds': list,
            'conditions': list
        }

    Returns:
        dict {
            'is_safe': bool,
            'warnings': list,
            'critical_issues': list,
            'recommendations': list
        }
    """
    result = {
        'is_safe': True,
        'warnings': [],
        'critical_issues': [],
        'recommendations': []
    }

    # 1. BLACK BOX Uyarı Kontrolü
    boxed_warning = get_text_from_field(drug_record, "boxed_warning")
    if boxed_warning:
        result['critical_issues'].append({
            'severity': 'CRITICAL',
            'type': 'BLACK_BOX_WARNING',
            'message': boxed_warning[:500]  # İlk 500 karakter
        })
        result['is_safe'] = False

    # 2. Kontrendikasyon Kontrolü
    contraindications = get_text_from_field(drug_record, "contraindications")
    if contraindications:
        # Gebelik kontrolü
        if patient_info.get('is_pregnant') and ('pregnancy' in contraindications.lower()):
            result['critical_issues'].append({
                'severity': 'CRITICAL',
                'type': 'CONTRAINDICATION',
                'message': 'Gebelikte kontrendike'
            })
            result['is_safe'] = False

        # Emzirme kontrolü
        if patient_info.get('is_nursing') and ('nursing' in contraindications.lower() or 'lactation' in contraindications.lower()):
            result['critical_issues'].append({
                'severity': 'CRITICAL',
                'type': 'CONTRAINDICATION',
                'message': 'Emzirmede kontrendike'
            })
            result['is_safe'] = False

    # 3. Yaş Grupları Kontrolü
    age = patient_info.get('age', 0)

    if age < 18:
        pediatric_use = get_text_from_field(drug_record, "pediatric_use")
        if pediatric_use and ('not' in pediatric_use.lower() or 'contraindicated' in pediatric_use.lower()):
            result['warnings'].append({
                'severity': 'HIGH',
                'type': 'AGE_RESTRICTION',
                'message': 'Pediatrik kullanım konusunda uyarılar var'
            })

    if age >= 65:
        geriatric_use = get_text_from_field(drug_record, "geriatric_use")
        if geriatric_use:
            result['warnings'].append({
                'severity': 'MEDIUM',
                'type': 'AGE_CONSIDERATION',
                'message': 'Yaşlı hastalarda özel dikkat gerekiyor',
                'details': geriatric_use[:300]
            })

    # 4. İlaç Etkileşim Kontrolü
    drug_interactions = get_text_from_field(drug_record, "drug_interactions")
    if drug_interactions and patient_info.get('current_meds'):
        for med in patient_info['current_meds']:
            if med.lower() in drug_interactions.lower():
                result['warnings'].append({
                    'severity': 'HIGH',
                    'type': 'DRUG_INTERACTION',
                    'message': f'{med} ile potansiyel etkileşim',
                    'recommendation': 'Doktora danışın'
                })

    return result
```

### 3.2 Doz Önerileri Çıkarımı

```python
import re

def extract_dosage_info(drug_record, patient_info):
    """
    Dozaj bilgilerini çıkarır ve yorumlar

    Returns:
        dict {
            'starting_dose': str,
            'maximum_dose': str,
            'frequency': str,
            'special_populations': dict,
            'administration_time': str,
            'with_food': bool
        }
    """
    dosage_text = get_text_from_field(drug_record, "dosage_and_administration")

    if not dosage_text:
        return {'error': 'Dozaj bilgisi bulunamadı'}

    result = {}

    # Başlangıç dozu regex ile bul
    starting_patterns = [
        r'starting dose[:\s]+(\d+\s*(?:mg|g|mcg|ml))',
        r'initial dose[:\s]+(\d+\s*(?:mg|g|mcg|ml))',
        r'begin with[:\s]+(\d+\s*(?:mg|g|mcg|ml))'
    ]

    for pattern in starting_patterns:
        match = re.search(pattern, dosage_text, re.IGNORECASE)
        if match:
            result['starting_dose'] = match.group(1)
            break

    # Maksimum doz
    max_patterns = [
        r'maximum[:\s]+(\d+\s*(?:mg|g|mcg|ml))',
        r'max dose[:\s]+(\d+\s*(?:mg|g|mcg|ml))',
        r'do not exceed[:\s]+(\d+\s*(?:mg|g|mcg|ml))'
    ]

    for pattern in max_patterns:
        match = re.search(pattern, dosage_text, re.IGNORECASE)
        if match:
            result['maximum_dose'] = match.group(1)
            break

    # Frekans
    if 'once daily' in dosage_text.lower() or 'once a day' in dosage_text.lower():
        result['frequency'] = 'Günde 1 kez'
    elif 'twice daily' in dosage_text.lower() or 'two times' in dosage_text.lower():
        result['frequency'] = 'Günde 2 kez'
    elif 'three times' in dosage_text.lower():
        result['frequency'] = 'Günde 3 kez'

    # Yemekle ilişki
    if 'with food' in dosage_text.lower():
        result['with_food'] = True
        result['administration_time'] = 'Yemekle beraber'
    elif 'without food' in dosage_text.lower() or 'empty stomach' in dosage_text.lower():
        result['with_food'] = False
        result['administration_time'] = 'Aç karnına'

    # Özel popülasyonlar
    result['special_populations'] = {}

    age = patient_info.get('age', 0)
    if age >= 65:
        geriatric_use = get_text_from_field(drug_record, "geriatric_use")
        if geriatric_use:
            result['special_populations']['geriatric'] = 'Doz ayarlaması gerekebilir'

    if patient_info.get('renal_impairment'):
        use_in_specific = get_text_from_field(drug_record, "use_in_specific_populations")
        if use_in_specific and 'renal' in use_in_specific.lower():
            result['special_populations']['renal'] = 'Böbrek yetmezliğinde doz ayarı gerekli'

    return result
```

### 3.3 Yan Etki Analizi

```python
def analyze_adverse_reactions(drug_record):
    """
    Yan etkileri sıklık ve ciddiyete göre kategorize eder

    Returns:
        dict {
            'very_common': list,  # >10%
            'common': list,       # 1-10%
            'uncommon': list,     # 0.1-1%
            'serious': list,      # Ciddi ama nadir
            'emergency_signs': list  # Acil servise gidilmesi gereken
        }
    """
    adverse_text = get_text_from_field(drug_record, "adverse_reactions")

    if not adverse_text:
        return {'error': 'Yan etki bilgisi bulunamadı'}

    result = {
        'very_common': [],
        'common': [],
        'uncommon': [],
        'serious': [],
        'emergency_signs': []
    }

    # Sık görülen yan etkiler (basit keyword arama)
    very_common_keywords = ['very common', '>10%', 'most common', 'frequent']
    common_keywords = ['common', '1-10%', '1% to 10%']

    # Metin bölümlere ayrılıp analiz edilebilir
    sections = adverse_text.split('\n')

    for section in sections:
        section_lower = section.lower()

        # Ciddi yan etkiler
        if any(word in section_lower for word in ['serious', 'severe', 'life-threatening', 'death']):
            result['serious'].append(section.strip()[:200])

        # Acil belirtiler
        if any(word in section_lower for word in ['immediately', 'emergency', 'seek medical attention', 'call doctor']):
            result['emergency_signs'].append(section.strip()[:200])

    return result
```

### 3.4 Etkileşim Kontrolü

```python
def check_drug_interactions(drug_record, current_medications):
    """
    Mevcut ilaçlarla etkileşim kontrolü

    Args:
        drug_record: İlaç verisi
        current_medications: list of str - Hastanın kullandığı ilaçlar

    Returns:
        list of dict {
            'interacting_drug': str,
            'severity': str,
            'mechanism': str,
            'recommendation': str
        }
    """
    interactions_text = get_text_from_field(drug_record, "drug_interactions")

    if not interactions_text or not current_medications:
        return []

    interactions_text_lower = interactions_text.lower()
    found_interactions = []

    # Ciddiyet keyword'leri
    severity_high = ['contraindicated', 'serious', 'severe', 'avoid', 'do not use']
    severity_medium = ['caution', 'monitor', 'may increase', 'may decrease']

    for med in current_medications:
        med_lower = med.lower()

        # İlacın metinde geçip geçmediği kontrol et
        if med_lower in interactions_text_lower:
            # İlgili bölümü bul
            sentences = interactions_text.split('.')
            relevant_sentences = [s for s in sentences if med_lower in s.lower()]

            if relevant_sentences:
                context = '. '.join(relevant_sentences[:2])  # İlk 2 cümle

                # Ciddiyet belirle
                severity = 'LOW'
                if any(keyword in context.lower() for keyword in severity_high):
                    severity = 'CRITICAL'
                elif any(keyword in context.lower() for keyword in severity_medium):
                    severity = 'MEDIUM'

                found_interactions.append({
                    'interacting_drug': med,
                    'severity': severity,
                    'mechanism': context[:300],
                    'recommendation': 'Doktorunuza danışın' if severity == 'CRITICAL' else 'İzlem önerilir'
                })

    return found_interactions
```

---

## 4. PROMPT TEMPLATE'LERİ

### 4.1 Kapsamlı İlaç Analizi Prompt

```python
COMPREHENSIVE_ANALYSIS_PROMPT = """
İlaç Bilgileri:
- Marka Adı: {brand_name}
- Jenerik Adı: {generic_name}
- Etken Madde: {substance_name}

Hasta Bilgileri:
- Yaş: {age}
- Cinsiyet: {gender}
- Gebelik Durumu: {pregnancy_status}
- Emzirme Durumu: {nursing_status}
- Mevcut İlaçlar: {current_medications}
- Kronik Hastalıklar: {chronic_conditions}

GÖREV:
Aşağıdaki veri alanlarını SIRASIYLA analiz et ve klinik çıkarımlar yap:

1. GÜVENLİK KONTROLÜ (KRİTİK):
   - boxed_warning alanını kontrol et. Varsa içeriğini ÖZETle.
   - contraindications alanından hastanın durumu ile çelişen bir durum var mı?
   - warnings alanından en önemli 3 uyarıyı çıkar.

2. UYGUNLUK DEĞERLENDİRMESİ:
   - indications_and_usage alanından bu ilacın ne için kullanıldığını belirle.
   - Hastanın durumu ({chronic_conditions}) bu kullanım alanlarına uygun mu?

3. DOZ ÖNERİLERİ:
   - dosage_and_administration alanından:
     * Başlangıç dozu
     * Maksimum günlük doz
     * Uygulama sıklığı
     * Özel not: Hasta {age} yaşında, geriatric_use alanını kontrol et

4. ETKİLEŞİM ANALİZİ:
   - drug_interactions alanından hastanın kullandığı ilaçlar ({current_medications}) ile etkileşim var mı?
   - Varsa, ciddiyet derecesi ve öneriler neler?

5. YAN ETKİ BİLGİLENDİRME:
   - adverse_reactions alanından:
     * En sık görülen 5 yan etki
     * Ciddi ama nadir yan etkiler
     * Hangi belirtilerde acil servise gidilmeli

6. HASTA TALİMATLARI:
   - information_for_patients, when_using, stop_use alanlarından hastaya söylenmesi gereken önemli noktaları basit dille özetle.
   - storage_and_handling alanından saklama koşullarını belirt.

ÇIKTI FORMATI:
JSON formatında yapılandırılmış cevap:
{{
  "safety_assessment": {{
    "is_safe": true/false,
    "critical_warnings": [],
    "contraindications_found": []
  }},
  "dosage_recommendations": {{
    "starting_dose": "",
    "maximum_dose": "",
    "frequency": "",
    "special_instructions": ""
  }},
  "interactions": [
    {{
      "drug": "",
      "severity": "HIGH/MEDIUM/LOW",
      "recommendation": ""
    }}
  ],
  "side_effects": {{
    "very_common": [],
    "serious": [],
    "emergency_signs": []
  }},
  "patient_instructions": {{
    "how_to_take": "",
    "what_to_avoid": "",
    "when_to_call_doctor": "",
    "storage": ""
  }}
}}

VERİ ALANLARI:
{drug_data_json}
"""
```

### 4.2 Hızlı Güvenlik Kontrolü Prompt

```python
QUICK_SAFETY_PROMPT = """
İlaç: {drug_name}
Hasta Yaşı: {age}
Gebe mi: {is_pregnant}
Mevcut İlaçlar: {current_meds}

SADECE ŞU ALANLARI KONTROL ET:
1. boxed_warning - Varsa ÇOK KRİTİK
2. contraindications - Kesin yasaklar
3. drug_interactions - {current_meds} ile etkileşim var mı

CEVAP FORMATI:
- GÜVE NLİ / GÜVENSIZ
- Neden (kısa, 1-2 cümle)
- Öneri (ne yapılmalı)

VERİ:
boxed_warning: {boxed_warning}
contraindications: {contraindications}
drug_interactions: {drug_interactions}
"""
```

---

## 5. ÖRNEK KULLANIM SENARYOLARI

### Senaryo 1: Hasta Profili ve İlaç Uyumu

```python
def analyze_drug_for_patient(drug_record, patient_profile):
    """
    Komple hasta-ilaç uyum analizi
    """
    # 1. Temel bilgileri çıkar
    brand_name = get_openfda_field(drug_record, "brand_name")
    generic_name = get_openfda_field(drug_record, "generic_name")

    print(f"\n{'='*60}")
    print(f"İLAÇ ANALİZİ: {brand_name} ({generic_name})")
    print(f"{'='*60}\n")

    # 2. Güvenlik kontrolü
    safety = safety_check(drug_record, patient_profile)

    if not safety['is_safe']:
        print("⚠️ GÜVENLİK UYARISI!")
        for issue in safety['critical_issues']:
            print(f"  - [{issue['severity']}] {issue['type']}: {issue['message'][:100]}...")
        return

    print("✓ Güvenlik kontrolü: BAŞARILI")

    # 3. Doz önerileri
    dosage = extract_dosage_info(drug_record, patient_profile)
    print(f"\nDOZ ÖNERİLERİ:")
    print(f"  Başlangıç: {dosage.get('starting_dose', 'Bilgi yok')}")
    print(f"  Maksimum: {dosage.get('maximum_dose', 'Bilgi yok')}")
    print(f"  Sıklık: {dosage.get('frequency', 'Bilgi yok')}")

    # 4. Etkileşim kontrolü
    interactions = check_drug_interactions(drug_record, patient_profile.get('current_meds', []))
    if interactions:
        print(f"\n⚠️ ETKİLEŞİMLER BULUNDU:")
        for interaction in interactions:
            print(f"  - {interaction['interacting_drug']} [{interaction['severity']}]")
            print(f"    Öneri: {interaction['recommendation']}")
    else:
        print("\n✓ İlaç etkileşimi: Tespit edilmedi")

    # 5. Yan etki özeti
    adverse = analyze_adverse_reactions(drug_record)
    if 'serious' in adverse and adverse['serious']:
        print(f"\n⚠️ CİDDİ YAN ETKİLER:")
        for effect in adverse['serious'][:3]:
            print(f"  - {effect[:80]}...")

# Kullanım örneği
patient = {
    'age': 68,
    'is_pregnant': False,
    'is_nursing': False,
    'current_meds': ['Warfarin', 'Metformin'],
    'conditions': ['Hipertansiyon', 'Tip 2 Diyabet'],
    'renal_impairment': False
}

# JSON'dan ilaç kaydını yükle
import json
with open('drug-label-0001-of-0013.json', 'r') as f:
    data = json.load(f)

# İlk ilacı analiz et
analyze_drug_for_patient(data['results'][1], patient)
```

### Senaryo 2: İlaç Karşılaştırma

```python
def compare_drugs(drug_record_1, drug_record_2):
    """
    İki ilacı karşılaştırır
    """
    comparison = {
        'drug_1': {
            'name': get_openfda_field(drug_record_1, "brand_name"),
            'generic': get_openfda_field(drug_record_1, "generic_name")
        },
        'drug_2': {
            'name': get_openfda_field(drug_record_2, "brand_name"),
            'generic': get_openfda_field(drug_record_2, "generic_name")
        }
    }

    # Yan etki karşılaştırması
    adverse_1 = analyze_adverse_reactions(drug_record_1)
    adverse_2 = analyze_adverse_reactions(drug_record_2)

    comparison['side_effects_comparison'] = {
        'drug_1_serious_count': len(adverse_1.get('serious', [])),
        'drug_2_serious_count': len(adverse_2.get('serious', []))
    }

    # Doz karşılaştırması
    # ... benzer şekilde devam eder

    return comparison
```

---

## 6. PERFORMANS OPTİMİZASYONU

### 6.1 İndeksleme

```python
import json
from collections import defaultdict

def create_drug_index(json_files):
    """
    Hızlı arama için ilaç indeksi oluşturur
    """
    index = {
        'by_brand_name': defaultdict(list),
        'by_generic_name': defaultdict(list),
        'by_substance': defaultdict(list),
        'by_ndc': {}
    }

    for json_file in json_files:
        with open(json_file, 'r') as f:
            data = json.load(f)

            for record in data['results']:
                if 'openfda' in record:
                    openfda = record['openfda']

                    # Marka adı indeksi
                    if 'brand_name' in openfda:
                        for brand in openfda['brand_name']:
                            index['by_brand_name'][brand.lower()].append(record['id'])

                    # Jenerik adı indeksi
                    if 'generic_name' in openfda:
                        for generic in openfda['generic_name']:
                            index['by_generic_name'][generic.lower()].append(record['id'])

                    # NDC indeksi
                    if 'product_ndc' in openfda:
                        for ndc in openfda['product_ndc']:
                            index['by_ndc'][ndc] = record['id']

    return index
```

### 6.2 Cache Mekanizması

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_drug_by_id(drug_id):
    """
    İlaç kaydını ID ile cache'leyerek getir
    """
    # Dosyalardan ara
    # ...
    pass

@lru_cache(maxsize=500)
def analyze_safety_cached(drug_id, patient_hash):
    """
    Güvenlik analizini cache'le
    """
    drug_record = get_drug_by_id(drug_id)
    patient_info = unhash_patient(patient_hash)
    return safety_check(drug_record, patient_info)
```

---

## 7. HATA YÖNETİMİ

```python
class DrugDataError(Exception):
    """İlaç verisi hataları için base class"""
    pass

class FieldNotFoundError(DrugDataError):
    """İstenen alan bulunamadığında"""
    pass

class InvalidDataError(DrugDataError):
    """Veri formatı geçersiz olduğunda"""
    pass

def safe_get_field(drug_record, field_name, default=None):
    """
    Hata yönetimi ile alan getir
    """
    try:
        return get_text_from_field(drug_record, field_name)
    except KeyError:
        if default is None:
            raise FieldNotFoundError(f"Alan bulunamadı: {field_name}")
        return default
    except Exception as e:
        raise InvalidDataError(f"Veri işleme hatası: {str(e)}")
```

---

## 8. TEST SENARYOLARI

```python
import unittest

class TestDrugAnalysis(unittest.TestCase):

    def setUp(self):
        # Test verisi yükle
        with open('test_drug_data.json') as f:
            self.test_data = json.load(f)
        self.sample_drug = self.test_data['results'][0]

    def test_safety_check_with_contraindication(self):
        """Kontrendikasyon varsa güvenli olmamalı"""
        patient = {'is_pregnant': True}
        result = safety_check(self.sample_drug, patient)

        # Eğer gebelikte kontrendike ise
        if 'pregnancy' in str(self.sample_drug.get('contraindications', '')).lower():
            self.assertFalse(result['is_safe'])

    def test_dosage_extraction(self):
        """Doz bilgisi çıkarımı test"""
        patient = {'age': 45}
        dosage = extract_dosage_info(self.sample_drug, patient)

        self.assertIsInstance(dosage, dict)
        # En az bir doz bilgisi olmalı
        self.assertTrue(
            'starting_dose' in dosage or 'maximum_dose' in dosage
        )

    def test_missing_field_handling(self):
        """Eksik alan yönetimi test"""
        result = get_text_from_field(self.sample_drug, "non_existent_field")
        self.assertIsNone(result)

if __name__ == '__main__':
    unittest.main()
```

---

## SONUÇ

Bu teknik rehber ile:

1. ✓ Veri yapısını anlarsınız
2. ✓ Klinik alanları doğru işlersiniz
3. ✓ Güvenlik kontrollerini yaparsınız
4. ✓ Performanslı kod yazarsınız
5. ✓ Hataları yönetirsiniz

**Önemli:** Bu fonksiyonlar başlangıç noktasıdır. Production ortamında:
- Daha gelişmiş NLP kullanın
- Regex yerine ML modelleri tercih edin
- Klinik karar destek kurallarını ekleyin
- Tıbbi doğrulama süreçleri entegre edin
