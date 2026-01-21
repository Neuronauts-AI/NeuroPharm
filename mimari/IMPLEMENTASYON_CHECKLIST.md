# REÇETE ANALİZ PLATFORMU - IMPLEMENTASYON CHECKLİST

## 🎯 ÖNCELİKLER

### P0 (Kritik - Hemen Yapılmalı)
- [ ] **Backend ciddiyet skorlama sistemi** (2 gün)
- [ ] **Rule-based filtreleme** (1 gün)
- [ ] **Yeni AI sistem promptu** (1 gün)
- [ ] **Çıktı format validasyonu** (0.5 gün)

### P1 (Yüksek - 1 Hafta İçinde)
- [ ] Test senaryoları (1 gün)
- [ ] Edge case handling (1 gün)
- [ ] Performance optimizasyonu (0.5 gün)

### P2 (Orta - 2 Hafta İçinde)
- [ ] Monitoring ve metrikler (1 gün)
- [ ] Dokümantasyon güncellemesi (0.5 gün)

---

## 📋 DETAYLI GÖREV LİSTESİ

### GÖREV 1: Ciddiyet Skorlama Modülü ⭐ KRİTİK

**Dosya:** `/backend/services/severityScoring.js`

**Fonksiyonlar:**
```javascript
- calculateDrugSeverity(drugData, patientContext, otherMeds)
- checkContraindications(contraindications, patientContext)
- checkCriticalInteractions(drugInteractions, otherMeds)
- checkModerateInteractions(drugInteractions, otherMeds)
- checkAgeWarnings(ageSpecificData, patientAge)
```

**Test:**
```javascript
const severity = calculateDrugSeverity(mockWarfarinData, {
  age: 68,
  conditions: ['Hipertansiyon']
}, [
  { name: 'Aspirin' }
]);

console.log(severity);
// Expected: { severity: 'CRITICAL', score: 10, factors: {...} }
```

**Tamamlanma Kriteri:**
- ✅ Boxed warning tespit ediyor (10 puan)
- ✅ Kontrendikasyon hasta koşulu ile eşleştiriyor (8 puan)
- ✅ Kritik etkileşim tespit ediyor (7 puan)
- ✅ Orta etkileşim tespit ediyor (4 puan)
- ✅ Yaş uyarısı tespit ediyor (4 puan)

---

### GÖREV 2: Akıllı Filtreleme Modülü ⭐ KRİTİK

**Dosya:** `/backend/services/smartFilter.js`

**Ana Fonksiyon:**
```javascript
function smartFilterForAI(allDrugsData, patientContext, request) {
  // LOW severity ilaçları filtrele
  // Sadece kritik data alanlarını gönder
  // İlgili bölümleri extract et
}
```

**Yardımcı Fonksiyonlar:**
```javascript
- extractRelevantContraindication(contraindications, patientContext)
- extractRelevantInteraction(interactions, currentMeds)
- identifyInteractingDrugs(interactions, currentMeds)
- extractLabTests(labTests)
- extractAgeWarning(ageData, patientAge)
- identifyMatchingCondition(contraindications, patientContext)
```

**Test:**
```javascript
const filtered = smartFilterForAI(
  [warfarinData, aspirinData, vitaminCData],
  { age: 68, conditions: ['Hipertansiyon'] },
  { currentMedications: [{ name: 'Aspirin' }] }
);

console.log(filtered.length);
// Expected: 2 (Warfarin=CRITICAL, Aspirin=MEDIUM, VitaminC=LOW filtered out)
```

**Tamamlanma Kriteri:**
- ✅ LOW severity ilaçlar filtreleniyor
- ✅ Sadece aktif faktörlerin dataları gönderiliyor
- ✅ İlgili metin bölümleri extract ediliyor (ilk 300 karakter)
- ✅ Etkileşen ilaç isimleri belirleniyor

---

### GÖREV 3: AI Sistem Promptu Güncellemesi ⭐ KRİTİK

**Dosya:** `/backend/prompts/prescriptionAnalysisPrompt.js`

**İçerik:**
```javascript
export const SYSTEM_PROMPT = `
[RECETE_ANALIZ_PLATFORMU_MIMARISI.md'deki tam prompt buraya]
`;

export const buildUserPrompt = (aiInput) => {
  return `
Lütfen aşağıdaki reçeteyi analiz et ve kritik bulguları raporla.

INPUT:
${JSON.stringify(aiInput, null, 2)}

OUTPUT:
Lütfen belirlenen JSON formatında cevap ver.
`;
};
```

**Test:**
```javascript
const prompt = buildUserPrompt({
  patient: { age: 68, ... },
  filtered_drug_data: [...]
});

console.log(prompt.length);
// Expected: ~2000-3000 karakter (eskiden 10000+ idi)
```

**Tamamlanma Kriteri:**
- ✅ Sistem promptu eksiksiz
- ✅ Karakter limitleri vurgulanmış
- ✅ Boş küme kuralı açık
- ✅ Risk skoru algoritması net
- ✅ Örnekler mevcut

---

### GÖREV 4: Ana Analiz Fonksiyonu Güncellemesi ⭐ KRİTİK

**Dosya:** `/backend/services/prescriptionAnalyzer.js`

**Değişiklikler:**

```javascript
// ESKİ (KALDIRILACAK):
const filteredData = filterDrugData(rawApiResponse, scenario, userContext);

// YENİ:
const severityScored = rawDrugData.map(drug => ({
  ...drug,
  severity: calculateDrugSeverity(drug, patientContext, currentMeds)
}));

const filteredForAI = smartFilterForAI(
  severityScored,
  patientContext,
  request
);
```

**Tam Akış:**
```javascript
async function analyzePrescription(request) {
  const startTime = Date.now();

  // 1. Request parse
  const { age, gender, conditions, currentMedications, newMedications } = request;

  // 2. Tüm ilaçları topla
  const allMeds = [...currentMedications.map(m => m.name), ...newMedications.map(m => m.name)];

  // 3. OpenFDA'dan veri çek
  const rawDrugData = await Promise.all(
    allMeds.map(name => fetchFromOpenFDA(name))
  );

  // 4. Backend filtreleme (YENİ!)
  const filteredForAI = smartFilterForAI(
    rawDrugData.filter(d => d && d.results && d.results[0]),
    { age, gender, conditions },
    request
  );

  console.log(`Filtreleme: ${rawDrugData.length} → ${filteredForAI.length} ilaç AI'ya gönderildi`);

  // 5. AI input hazırla
  const aiInput = {
    patient: { age, gender, conditions },
    current_medications: currentMedications,
    new_medications: newMedications,
    filtered_drug_data: filteredForAI
  };

  // 6. AI çağrısı (YENİ PROMPT!)
  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(aiInput);

  const aiResponse = await callOpenAI(systemPrompt, userPrompt);

  // 7. Parse ve validate
  const output = JSON.parse(aiResponse);
  validateOutput(output);

  return {
    ...output,
    status_code: 200,
    processing_time_ms: Date.now() - startTime
  };
}
```

**Tamamlanma Kriteri:**
- ✅ Eski statik filtreleme kaldırıldı
- ✅ Ciddiyet skorlama eklendi
- ✅ Akıllı filtreleme eklendi
- ✅ Yeni prompt kullanılıyor
- ✅ Output validasyonu çalışıyor

---

### GÖREV 5: Çıktı Validasyonu ⭐ KRİTİK

**Dosya:** `/backend/utils/outputValidator.js`

**Fonksiyon:**
```javascript
function validateOutput(output) {
  // 1. clinical_summary max 200 karakter
  if (output.clinical_summary.length > 200) {
    output.clinical_summary = output.clinical_summary.substring(0, 197) + '...';
  }

  // 2. mechanism'lar max 100 karakter
  for (let interaction of output.interaction_details || []) {
    if (interaction.mechanism && interaction.mechanism.length > 100) {
      interaction.mechanism = interaction.mechanism.substring(0, 97) + '...';
    }
  }

  // 3. reason'lar max 80 karakter
  for (let alt of output.alternatives || []) {
    if (alt.reason && alt.reason.length > 80) {
      alt.reason = alt.reason.substring(0, 77) + '...';
    }
  }

  // 4. risk_score 1-10 aralığında
  output.risk_score = Math.max(1, Math.min(10, output.risk_score));

  // 5. Boş array kontrolü
  if (!output.interaction_details) output.interaction_details = [];
  if (!output.alternatives) output.alternatives = [];
  if (!output.monitoring_plan) output.monitoring_plan = [];
  if (!output.dosage_warnings) output.dosage_warnings = [];
  if (!output.special_population_alerts) output.special_population_alerts = [];

  // 6. patient_safety_notes max 150 karakter
  if (output.patient_safety_notes && output.patient_safety_notes.length > 150) {
    output.patient_safety_notes = output.patient_safety_notes.substring(0, 147) + '...';
  }

  return output;
}
```

**Test:**
```javascript
const tooLong = {
  clinical_summary: 'A'.repeat(300),
  risk_score: 15
};

const validated = validateOutput(tooLong);

expect(validated.clinical_summary.length).toBeLessThanOrEqual(200);
expect(validated.risk_score).toBe(10);
```

**Tamamlanma Kriteri:**
- ✅ Tüm karakter limitleri uygulanıyor
- ✅ Boş arrayler handle ediliyor
- ✅ risk_score normalize ediliyor

---

### GÖREV 6: Test Senaryoları

**Dosya:** `/backend/tests/prescriptionAnalyzer.test.js`

**Test 1: Kritik Durum (Boxed Warning + Etkileşim)**
```javascript
describe('Critical Case: Warfarin + Aspirin', () => {
  test('should filter correctly and generate critical output', async () => {
    const request = {
      age: 68,
      gender: 'male',
      conditions: ['Hipertansiyon'],
      currentMedications: [{ name: 'Aspirin', dosage: '100mg' }],
      newMedications: [{ name: 'Warfarin', dosage: '5mg' }]
    };

    const result = await analyzePrescription(request);

    expect(result.risk_score).toBeGreaterThanOrEqual(8);
    expect(result.interaction_details.length).toBeGreaterThan(0);
    expect(result.interaction_details[0].severity).toBe('Critical');
    expect(result.alternatives.length).toBeGreaterThan(0);
    expect(result.clinical_summary.length).toBeLessThanOrEqual(200);
  });
});
```

**Test 2: Orta Seviye (Sadece Monitoring)**
```javascript
describe('Medium Case: Metformin (elderly)', () => {
  test('should include monitoring but no alternatives', async () => {
    const request = {
      age: 72,
      conditions: [],
      currentMedications: [],
      newMedications: [{ name: 'Metformin', dosage: '850mg' }]
    };

    const result = await analyzePrescription(request);

    expect(result.risk_score).toBeLessThan(7);
    expect(result.monitoring_plan.length).toBeGreaterThan(0);
    expect(result.alternatives.length).toBe(0);  // Kritik değil, alternatif yok
    expect(result.interaction_details.length).toBe(0);
  });
});
```

**Test 3: Düşük Seviye (Filtrelenir)**
```javascript
describe('Low Case: Vitamin C', () => {
  test('should be filtered out, no results', async () => {
    const request = {
      age: 30,
      conditions: [],
      currentMedications: [],
      newMedications: [{ name: 'Vitamin C', dosage: '500mg' }]
    };

    const result = await analyzePrescription(request);

    expect(result.results_found).toBe(false);
    expect(result.risk_score).toBe(0);
    expect(result.interaction_details).toEqual([]);
    expect(result.alternatives).toEqual([]);
  });
});
```

**Tamamlanma Kriteri:**
- ✅ 3 ana test senaryosu geçiyor
- ✅ Edge case'ler handle ediliyor
- ✅ %90+ code coverage

---

## 🚀 DEPLOYMENT ADIMLARI

### 1. Environment Variables
```bash
# .env
OPENFDA_API_KEY=your_key
OPENAI_API_KEY=your_key
MAX_CLINICAL_SUMMARY_LENGTH=200
MAX_MECHANISM_LENGTH=100
MAX_REASON_LENGTH=80
```

### 2. Database Migrations (Gerekirse)
```sql
-- Severity skorlarını loglamak için
CREATE TABLE severity_logs (
  id SERIAL PRIMARY KEY,
  drug_name VARCHAR(255),
  severity VARCHAR(20),
  severity_score INT,
  factors JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI response'ları loglamak için
CREATE TABLE ai_analysis_logs (
  id SERIAL PRIMARY KEY,
  request_id UUID,
  input_tokens INT,
  output_tokens INT,
  processing_time_ms INT,
  risk_score INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Monitoring Metrics
```javascript
// Prometheus metrics
const severityDistribution = new prometheus.Histogram({
  name: 'severity_distribution',
  help: 'Distribution of severity levels',
  buckets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
});

const tokenSavings = new prometheus.Gauge({
  name: 'token_savings_percent',
  help: 'Percentage of tokens saved by filtering'
});

const filteredDrugCount = new prometheus.Counter({
  name: 'filtered_drug_count',
  help: 'Number of LOW severity drugs filtered out'
});
```

---

## 📊 BEKLENEN SONUÇLAR

### Performans İyileştirmeleri

| Metrik | Öncesi | Sonrası | İyileşme |
|--------|--------|---------|----------|
| Ortalama Token Kullanımı | 8000 | 1500 | ⬇️ 81% |
| API Response Süresi | 3000ms | 1200ms | ⬇️ 60% |
| Gereksiz Uyarı Oranı | %40 | %5 | ⬇️ 87% |
| Doktor Memnuniyeti | - | ⬆️ | Daha öz bilgi |

### Token Maliyet Tasarrufu

```
Örnek: 1000 reçete/gün

ESKİ:
1000 × 8000 token = 8M token/gün
8M × $0.002 (GPT-4) = $16/gün
$16 × 30 = $480/ay

YENİ:
1000 × 1500 token = 1.5M token/gün
1.5M × $0.002 = $3/gün
$3 × 30 = $90/ay

TASARRUF: $390/ay (%81) 💰
```

---

## ✅ TAMAMLANMA KRİTERLERİ

### Backend
- [x] Ciddiyet skorlama çalışıyor
- [x] Filtreleme LOW'ları atıyor
- [x] Sadece kritik data alanları gönderiliyor
- [x] Extract fonksiyonları çalışıyor

### AI
- [x] Yeni sistem promptu aktif
- [x] Çıktı formatı doğru
- [x] Karakter limitleri uygulanıyor
- [x] Boş küme mantığı çalışıyor

### Test
- [x] Unit testler %90+ coverage
- [x] Integration testler geçiyor
- [x] Edge case'ler handle edilmiş

### Production
- [x] Monitoring kurulu
- [x] Logging yapılandırılmış
- [x] Error handling robust

---

## 🎯 SONRAKI ADIMLAR (Opsiyonel İyileştirmeler)

### Faz 2 (1-2 Ay Sonra)
- [ ] Makine öğrenimi ile ciddiyet skorlama
- [ ] Alternatif ilaç veritabanı entegrasyonu
- [ ] Gerçek zamanlı etkileşim database'i
- [ ] Doktor feedback loop'u

### Faz 3 (3+ Ay Sonra)
- [ ] Kişiselleştirilmiş risk skorları
- [ ] Genetik bilgi entegrasyonu
- [ ] Prediktif yan etki modelleri

---

Başarılar! Bu checklist ile sisteminizi adım adım yenileyebilirsiniz. 🚀
