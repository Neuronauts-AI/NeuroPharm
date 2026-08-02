# Güvenlik Politikası

## Açık bildirimi

Bir güvenlik açığı bulduysanız **issue açmayın.** Açık issue, düzeltme yayınlanmadan önce sorunu herkese duyurur.

Bunun yerine: **security@neuronautsai.com** *(kurulana kadar: info@neuronautsai.com)*

Bildiriminizde şunlar olsun:

- Neyi etkiliyor (depo, uç nokta, sürüm)
- Yeniden üretme adımları
- Sizce etkisi ne

**Yanıt süremiz:** 3 iş günü içinde ilk dönüş, 30 gün içinde düzeltme veya gerekçeli plan.

## Kapsam

Bu politika `Neuronauts-AI` organizasyonundaki tüm depoları kapsar.

## Sır sızıntısı

Bir anahtar, parola veya kimlik bilgisi yanlışlıkla commit'lendiyse **sıra şudur**:

1. **Anahtarı derhal iptal edin.** Depoyu temizlemekle başlamayın — sır zaten dışarıda.
2. Yeni anahtarı üretin ve ortam değişkenlerini güncelleyin.
3. Sonra Git geçmişini temizleyin (`git filter-repo`) ve durumu `@Neuronauts-AI/core`'a bildirin.

Commit'i silmek yeterli değildir: fork'larda, klonlarda ve GitHub'ın önbelleğinde kalmaya devam eder.

## Desteklenen sürümler

Aksi `README.md`'de yazmıyorsa yalnızca `main` dalının son hâli desteklenir.
