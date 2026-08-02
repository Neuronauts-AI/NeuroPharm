# <Proje Adı> — Devir Belgesi

> Bu belge, projeyi devralan kişi için hazırlanmıştır.
> Ölçüt tek: bu belgeyi okuyan bir mühendis, **kimseye soru sormadan** projeyi ayağa kaldırabilmeli ve geliştirmeye devam edebilmeli.

**Son güncelleme:** <TARİH>
**Hazırlayan:** <AD>
**Mevcut sahip:** <AD> · **Yedek:** <AD>

---

## 1. Proje özeti

<Ne yapıyor, kim için yapıldı, hangi aşamada. Pazarlama dili değil, düz anlatım.>

**Müşteri / paydaş:** <varsa>
**Başlangıç:** <tarih> · **Mevcut durum:** <geliştiriliyor | üretimde | duraklatıldı | arşiv>

---

## 2. Teknoloji yığını

| Katman | Teknoloji | Neden seçildi |
|---|---|---|
| Frontend | | |
| Backend | | |
| Veritabanı | | |
| Altyapı | | |

---

## 3. Sıfırdan ayağa kaldırma

```bash
<adım adım, kopyala-yapıştır çalışan komutlar>
```

Takılınabilecek noktalar: <bilinen kurulum tuzakları>

---

## 4. Deploy ve çalışma ortamı

- **Hedef:** <Railway projesi / sunucu / bulut hesabı>
- **Hangi hesabın altında:** <kurumsal hesap adı>
- **Deploy tetikleyici:** <`main`'e merge / elle>
- **Sağlık kontrolü:** <adres>
- **Loglar nerede:** <>
- **Geri alma yordamı:** <>

---

## 5. Devri gereken hesap ve anahtarlar

> ⚠️ Bu tablo **envanterdir** — anahtarların değerleri buraya **asla** yazılmaz.

| Ne | Nerede duruyor | Kimin üzerinde | Devir gerekli mi |
|---|---|---|---|
| Railway projesi | Railway | <hesap> | evet |
| SMTP kimlik bilgisi | <parola yöneticisi> | <hesap> | evet |
| API anahtarı: `<servis>` | <parola yöneticisi> | <hesap> | evet |
| Alan adı / DNS | <sağlayıcı> | <hesap> | evet |

Devir sırasında bu anahtarların hepsi **döndürülür (rotate)**. Erişimi kesmek, elde kalmış anahtarı geçersiz kılmaz.

---

## 6. Tamamlananlar

- <özellik>
- <özellik>

## 7. Yarım kalanlar ve bilinen sorunlar

| Konu | Durum | Not |
|---|---|---|
| | | |

## 8. Bilinçli ödünler

<Neyin neden yapılmadığı. Devralan kişinin "bunu neden böyle bırakmışlar" diye zaman kaybetmemesi için.>

---

## 9. Mimari notlar

<Kodu okuyarak anlaşılmayan kararlar: veri akışı, yetkilendirme modeli, zamanlanmış işler, dış entegrasyonlar.>

---

## 10. Kime sorulur

| Konu | Kişi |
|---|---|
| Ürün / kapsam | <> |
| Teknik | <> |
| Altyapı / deploy | <> |
| Müşteri ilişkisi | <> |
