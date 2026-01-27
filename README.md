# Neuropharm: İlaç Etkileşim Analiz Sistemi

Neuropharm, OpenFDA veritabanını ve yapay zeka destekli klinik analiz motorunu kullanarak, hasta odaklı ilaç etkileşim analizleri sunan modern bir sağlık teknolojisi çözümüdür.

## 🌟 Temel Özellikler

### 1. Güvenilir Veri Kaynağı (OpenFDA)
- Doğrudan **FDA (Amerikan Gıda ve İlaç Dairesi)** veritabanı entegrasyonu.
- Statik veritabanı yerine her sorguda güncel veri.
- Kara kutu uyarıları, kontrendikasyonlar ve klinik veriler.

### 2. Hasta Odaklı Analiz (Anamnez)
- Sadece ilaç-ilaç etkileşimi değil, **hasta-ilaç** uyumu kontrolü.
- **Hastalık Çapraz Sorgusu:** Mevcut hastalıklar ile ilaç kontrendikasyonlarının eşleştirilmesi.
- **Özel Popülasyon Analizi:** Geriatrik (65+), Pediatrik ve Hamilelik durumlarına özel risk taraması.

### 3. Akıllı Klinik Motor
- **Yapılandırılmış Veri İşleme:** İlaç isimlerini standardize eder (örn. *Parol* -> *Acetaminophen*).
- **Ciddiyet Filtrelemesi:** Doktora sadece kritik (Critical) ve önemli (High) uyarıları sunar; bilgi kirliliğini önler.
- **AI Destekli Yorumlama:** Bulguları klinik bir eczacı yaklaşımıyla özetler ve aksiyon önerileri sunar.

## 🚀 Kurulum ve Çalıştırma

Proje Docker ile kolayca ayağa kaldırılabilir.

### Gereksinimler
- Docker & Docker Compose

### Hızlı Başlangıç

1. Projeyi klonlayın:
```bash
git clone https://github.com/egeaydin1/druginteraction.git
cd druginteraction
```

2. Konfigürasyonu ayarlayın:
```bash
cp .env.example .env
# .env dosyasını gerekli API anahtarları ile güncelleyin
```

3. Uygulamayı başlatın:
```bash
docker-compose up -d --build
```

Uygulama **http://localhost:3000** adresinde çalışacaktır.

## 🏗 Mimari

Sistem 3 temel katmandan oluşur:
1.  **Veri Katmanı:** OpenFDA API (Gerçek zamanlı veri).
2.  **Analiz Motoru:** Rule-based ön eleme + AI Klinik Değerlendirme.
3.  **Sunum Katmanı:** Kullanıcı dostu web arayüzü ve API.

## 📄 Lisans

Bu proje **Apache License 2.0** ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
