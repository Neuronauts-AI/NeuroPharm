# Doktor Reçete Paneli

Doktorların hastalara ilaç yazarken kullanabilecekleri modern bir web uygulaması. İlaç etkileşimlerini analiz eder ve alternatif öneriler sunar.

## Özellikler

- **Hasta Yönetimi**: Hasta ekleme, düzenleme ve listeleme
- **Hasta Detayları**: Yaş, cinsiyet, hastalıklar ve mevcut ilaçlar
- **İlaç Arama**: Kapsamlı ilaç veritabanından arama yapma
- **Etkileşim Analizi**: Webhook ile ilaç etkileşimlerini analiz etme
- **Risk Değerlendirmesi**: Risk skoru ve alternatif ilaç önerileri
- **Reçete Yönetimi**: Reçete oluşturma ve kaydetme

## Teknolojiler

- **Next.js 15** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Modern styling
- **API Routes** - Backend entegrasyonu
- **Docker** - Containerization ve kolay deployment

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Environment değişkenlerini ayarlayın:
```bash
cp .env.example .env
```

3. `.env` dosyasını düzenleyin ve webhook URL'inizi ekleyin:
```
DRUG_ANALYSIS_WEBHOOK_URL=https://your-webhook-url.com/analyze
```

**Not:** Eğer webhook URL'i tanımlanmazsa, sistem demo yanıtlar kullanacaktır.

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Docker ile Kurulum

Docker kullanarak uygulamayı çalıştırmak için:

### Docker Compose ile (Önerilen)

1. Webhook URL'inizi ayarlamak için `docker-compose.yaml` dosyasını düzenleyin (opsiyonel):
```yaml
environment:
  - DRUG_ANALYSIS_WEBHOOK_URL=https://your-webhook-url.com/analyze
```

2. Docker container'ı başlatın:
```bash
docker-compose up -d
```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

4. Container'ı durdurmak için:
```bash
docker-compose down
```

### Dockerfile ile Manuel Kurulum

1. Docker image'ı build edin:
```bash
docker build -t doctor-prescription-panel .
```

2. Container'ı çalıştırın:
```bash
docker run -p 3000:3000 \
  -e DRUG_ANALYSIS_WEBHOOK_URL=https://your-webhook-url.com/analyze \
  doctor-prescription-panel
```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### Docker Logları

Container loglarını görmek için:
```bash
docker-compose logs -f
```

veya

```bash
docker logs -f doctor-prescription-panel
```

## Webhook Entegrasyonu

Uygulamanın ilaç analizi için bir webhook endpoint'e ihtiyacı vardır.

### İstek Formatı

```typescript
POST /your-webhook-endpoint
Content-Type: application/json

{
  "patientId": "string",
  "currentMedications": [
    {
      "id": "string",
      "name": "string",
      "dosage": "string",
      "frequency": "string"
    }
  ],
  "newMedications": [
    {
      "id": "string",
      "name": "string",
      "dosage": "string",
      "frequency": "string"
    }
  ],
  "conditions": ["string"]
}
```

### Yanıt Formatı

```typescript
{
  "riskScore": number,        // 0-100 arası risk skoru
  "alternativeMedicines": string,  // Alternatif ilaç önerileri
  "explanation": string       // Detaylı açıklama
}
```

## Kullanım

1. **Hasta Seçimi/Ekleme**: Sol taraftaki listeden bir hasta seçin veya "Yeni Hasta Ekle" butonuna tıklayın
2. **Hasta Bilgilerini Görüntüleme**: Seçilen hastanın detaylı bilgilerini sağ panelde görün
3. **İlaç Ekleme**: "İlaç Ara ve Ekle" alanından ilaç arayıp seçin
4. **Analiz**: "İlaç Etkileşimini Analiz Et" butonuna tıklayın
5. **Sonuçları İnceleyin**: Risk skoru, alternatifler ve açıklamaları görün
6. **Kaydet**: Reçeteyi onayladıktan sonra "Reçeteyi Hastaya Kaydet" butonuna tıklayın

## Proje Yapısı

```
druginteraction/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts       # Webhook API endpoint
│   ├── page.tsx               # Ana sayfa
│   └── layout.tsx
├── components/
│   ├── PatientList.tsx        # Hasta listesi sidebar
│   ├── PatientForm.tsx        # Hasta ekleme/düzenleme formu
│   ├── PatientDetails.tsx     # Hasta detayları
│   ├── MedicineSearch.tsx     # İlaç arama ve seçim
│   └── AnalysisResult.tsx     # Analiz sonuçları
├── types/
│   └── index.ts               # TypeScript tipleri
├── lib/
│   └── mockData.ts            # Örnek veriler
├── Dockerfile                 # Docker image tanımı
├── docker-compose.yaml        # Docker Compose konfigürasyonu
├── .dockerignore              # Docker build exclusions
└── README.md
```

## Geliştirme

Projeyi geliştirmek için:

1. Yeni bir branch oluşturun
2. Değişikliklerinizi yapın
3. Commit edin ve push edin
4. Pull request oluşturun

## Lisans

MIT
