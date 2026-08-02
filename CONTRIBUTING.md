# Katkı Rehberi

Bu depo [Neuronauts AI GitHub standardını](https://github.com/Neuronauts-AI/website/tree/main/docs/github-standards) izler. Burası yalnızca depoya özel kısımdır; genel kurallar oradadır.

## Ortam kurulumu

```bash
<kurulum komutları>
```

## Çalıştırma

```bash
<geliştirme komutu>
```

## Test

```bash
<test komutu>
```

Davranışı değiştiren her PR test getirir. Testi olmayan depoda ilk test bu PR'da yazılır.

## Akış

1. `main`'den güncel bir dal aç: `git switch -c feat/kisa-aciklama`
2. Küçük ve tek işe odaklı commit'ler at — [Conventional Commits](https://www.conventionalcommits.org/)
3. PR aç, şablonu doldur
4. En az 1 onay al
5. **Squash merge** ile birleştir, dalı sil

Dal ve commit adlandırması: [02-naming.md](https://github.com/Neuronauts-AI/website/blob/main/docs/github-standards/02-naming.md)

## Depoya girmeyecekler

`.env`, anahtar, parola, kişisel veri, `node_modules/`, `__pycache__/`, derleme çıktısı, `.DS_Store`, `.zip`, `.docx`.

Belge paylaşmanız gerekiyorsa Drive'a koyup `README.md`'ye bağlantı bırakın — ofis dosyaları Git'te sürümlenemez.

## Gözden geçirme

Gözden geçiren doğruluk, kapsam, sır sızıntısı, belge güncelliği ve test'e bakar. Yorum koda yöneliktir ve ne istendiğini açıkça söyler.

## Takıldığınızda

`CODEOWNERS` dosyasında ilgili yolun sahibine sorun, ya da `docs/DEVIR.md` içindeki "Kime sorulur" tablosuna bakın.
