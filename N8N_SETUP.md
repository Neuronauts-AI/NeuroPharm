# n8n Webhook Kurulum Rehberi

Bu rehber, doktor reçete paneli için n8n webhook'unun nasıl kurulacağını adım adım açıklar.

## 1. n8n Kurulumu

### Docker ile Hızlı Başlangıç

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Tarayıcınızda http://localhost:5678 adresini açın.

### Docker Compose ile Kalıcı Kurulum

```yaml
version: '3.8'

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin123
      - WEBHOOK_URL=http://localhost:5678/
    volumes:
      - ~/.n8n:/home/node/.n8n
    restart: unless-stopped
```

Başlatmak için:
```bash
docker-compose up -d
```

## 2. Workflow İçe Aktarma

### Yöntem A: Hazır Workflow'u İmport Et

1. n8n arayüzünde sağ üst köşedeki menüden "Import from file" seçin
2. `n8n-workflow.json` dosyasını seçin
3. "Import" butonuna tıklayın
4. Workflow otomatik olarak yüklenecektir

### Yöntem B: Manuel Oluşturma

1. **Yeni Workflow Oluştur**
   - "New Workflow" butonuna tıklayın
   - İsim verin: "Drug Interaction Analysis"

2. **Webhook Node Ekle**
   - "+" butonuna tıklayın
   - "Webhook" arayın ve ekleyin
   - Ayarlar:
     - HTTP Method: `POST`
     - Path: `drug-analysis`
     - Response Mode: `When Last Node Finishes`

3. **Function Node Ekle**
   - Webhook'un sağ tarafındaki "+" butonuna tıklayın
   - "Function" node'unu ekleyin
   - Kodu `n8n-workflow.json` dosyasından kopyalayın

4. **Respond to Webhook Node Ekle**
   - Function'ın sağına ekleyin
   - Response Type: `JSON`
   - Response Body: `{{ $json }}`

5. **Kaydet ve Aktifleştir**
   - Sağ üstten "Save" tıklayın
   - Toggle'ı "Active" yapın

## 3. Webhook URL'ini Alın

Workflow aktif olduktan sonra Webhook node'una tıklayın. URL'yi göreceksiniz:

**Test URL (geliştirme):**
```
http://localhost:5678/webhook-test/drug-analysis
```

**Production URL:**
```
http://localhost:5678/webhook/drug-analysis
```

## 4. Uygulamaya Entegre Edin

### Geliştirme Ortamı

`.env` dosyası oluşturun:
```bash
DRUG_ANALYSIS_WEBHOOK_URL=http://localhost:5678/webhook/drug-analysis
```

### Docker ile Çalıştırma

`docker-compose.yaml` dosyasını düzenleyin:
```yaml
services:
  app:
    environment:
      - DRUG_ANALYSIS_WEBHOOK_URL=http://host.docker.internal:5678/webhook/drug-analysis
```

**Not:** Docker container'dan host makinesine erişmek için `host.docker.internal` kullanın.

### Production Ortamı

Production'da n8n'i public URL ile yayınlayın (örn: Nginx reverse proxy ile):

```bash
DRUG_ANALYSIS_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/drug-analysis
```

## 5. Test Etme

### n8n'den Test

1. Webhook node'una tıklayın
2. "Listen for test event" butonuna tıklayın
3. Uygulamadan bir analiz isteği gönderin
4. n8n'de gelen veriyi görün

### Manuel Test (curl)

```bash
curl -X POST http://localhost:5678/webhook/drug-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "1",
    "currentMedications": [
      {
        "id": "1",
        "name": "Aspirin",
        "dosage": "100mg",
        "frequency": "Günde 1 kez"
      }
    ],
    "newMedications": [
      {
        "id": "2",
        "name": "Ibuprofen",
        "dosage": "400mg",
        "frequency": "Günde 2 kez"
      }
    ],
    "conditions": ["Hipertansiyon"]
  }'
```

Beklenen yanıt:
```json
{
  "riskScore": 85,
  "alternativeMedicines": "Aspirin ve Ibuprofen kombinasyonu yerine:\n- Paracetamol (ağrı için)\n- Aspirin'i tek başına kullanın",
  "explanation": "İlaç Etkileşim Analiz Raporu\n\n📊 Genel Bilgiler:\n..."
}
```

## 6. Workflow Özelleştirme

### Risk Skorunu Ayarlama

`Analyze Drug Interactions` function node'undaki `riskyInteractions` objesini düzenleyin:

```javascript
const riskyInteractions = {
  'aspirin+ibuprofen': { risk: 85, message: 'Mide kanaması riski yüksek' },
  'warfarin+aspirin': { risk: 90, message: 'Kanama riski çok yüksek' },
  // Yeni etkileşimler ekleyin
  'yeni_ilaç+başka_ilaç': { risk: 70, message: 'Risk açıklaması' }
};
```

### AI Entegrasyonu Ekleme

Daha akıllı analizler için OpenAI veya Claude API ekleyebilirsiniz:

1. Function node'dan sonra "OpenAI" node ekleyin
2. API key'inizi girin
3. Prompt'u şu şekilde ayarlayın:

```
Sen bir ilaç etkileşimi uzmanısın. Şu bilgilere göre analiz yap:

Hastalıklar: {{ $json.conditions }}
Mevcut İlaçlar: {{ $json.currentMedications }}
Yeni İlaçlar: {{ $json.newMedications }}

JSON formatında yanıt ver:
{
  "riskScore": 0-100,
  "alternativeMedicines": "öneriler",
  "explanation": "detaylı açıklama"
}
```

## 7. İleri Seviye Özellikler

### Database Kayıt

Tüm analizleri kaydetmek için:

1. Postgres/MySQL node ekleyin
2. Her analizi veritabanına kaydedin
3. Geçmiş raporlara erişim sağlayın

### Email Bildirimi

Yüksek riskli durumlar için:

1. IF node ekleyin: `{{ $json.riskScore }} >= 70`
2. True olduğunda Email node tetikleyin
3. Doktora otomatik bildirim gönderin

### Webhook Güvenliği

Production için authentication ekleyin:

```javascript
// Function node başına ekleyin
const headers = $node["Webhook"].json.headers;
const apiKey = headers['x-api-key'];

if (apiKey !== 'your-secret-key') {
  throw new Error('Unauthorized');
}
```

## Sorun Giderme

### Webhook erişilemiyor
- n8n'in çalıştığından emin olun: `docker ps`
- Port'un açık olduğunu kontrol edin: `curl http://localhost:5678`
- Docker network ayarlarını kontrol edin

### Response dönmüyor
- Workflow'un "Active" olduğunu kontrol edin
- "Respond to Webhook" node'unun bağlı olduğundan emin olun
- n8n execution loglarını inceleyin

### CORS hatası
n8n environment variable'a ekleyin:
```bash
-e N8N_CUSTOM_EXTENSIONS=/data/cors-fix.js
```

## Kaynaklar

- [n8n Dökümanları](https://docs.n8n.io)
- [n8n Webhook Rehberi](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Community](https://community.n8n.io)
