# ButcApp Blog Sistemi - Ubuntu Deployment Fix

## 🔧 Sorun ve Çözüm

Ubuntu sunucusunda blog sayfasının boş gelmesinin ana sebepleri:

1. **Hardcoded Supabase Credentials**: Tüm API route'larında sabit credentials kullanılıyordu
2. **No Environment Variables**: Production ortamında credential sorunları
3. **No Fallback Mechanism**: Supabase bağlantısı başarısız olursa gösterilecek yerel veri yoktu

## ✅ Yapılan Düzeltmeler

### 1. Environment Variables Eklendi
- `.env.local` dosyası oluşturuldu
- Supabase URL ve keys environment variables'dan okunuyor
- Production için güvenli konfigürasyon

### 2. Fallback Sistemi
- `src/lib/supabase-config.ts` oluşturuldu
- Supabase bağlantısı başarısız olursa yerel demo veriler gösterilir
- 3 adet demo blog yazısı ve kategoriler eklendi

### 3. API Route'ları Güncellendi
- `/api/blog/route.ts` - fallback mekanizması ile güncellendi
- `/api/blog/categories/route.ts` - kategoriler için fallback eklendi
- `/api/blog/[slug]/route.ts` - tekil yazı için fallback eklendi

### 4. Frontend Düzeltmeleri
- `BlogListingPage.tsx` - property isimleri düzeltildi
- `coverImage` ve `author.name` alanları için fallback'ler

## 🚀 Ubuntu Deployment Adımları

### 1. Projeyi Sunucuya Kopyalayın
```bash
# Local'den sunucuya kopyalama
scp -r /home/z/my-project/* user@your-server:/var/www/butcapp/

# Sunucuya bağlan
ssh user@your-server
cd /var/www/butcapp
```

### 2. Environment Variables Ayarları
```bash
# .env.local dosyasını production için düzenle
nano .env.local

# Production değerleri girin:
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
ENABLE_LOCAL_FALLBACK=true
```

### 3. Dependencies Kurulumu
```bash
pnpm install
```

### 4. Build ve Deploy
```bash
pnpm run build

# PM2 ile başlatın
pm2 start ecosystem.config.js

# veya doğrudan
pm2 start npm --name "butcapp" -- start
```

## 🧪 Test

### 1. Blog API Test
```bash
# Blog yazıları
curl http://localhost:3000/api/blog

# Kategoriler
curl http://localhost:3000/api/blog/categories

# Tekil yazı
curl http://localhost:3000/api/blog/kisisel-finans-yonetiminin-5-altin-kurali
```

### 2. Frontend Test
- `http://localhost:3000/blog` sayfasını ziyaret edin
- Demo yazıların göründüğünden emin olun
- Kategori filtrelemeyi test edin

## 📋 Kontrol Listesi

- [ ] `.env.local` dosyası oluşturuldu
- [ ] Supabase credentials doğru girildi
- [ ] `pnpm install` çalıştırıldı
- [ ] `pnpm run build` başarılı oldu
- [ ] PM2 ile uygulama başlatıldı
- [ ] Blog sayfasında demo yazılar görünüyor
- [ ] Kategori filtreleme çalışıyor
- [ ] Tekil yazı sayfaları açılıyor

## 🔍 Debug

Eğer blog sayfası hala boş geliyorsa:

### 1. Logları Kontrol Edin
```bash
# PM2 logları
pm2 logs butcapp

# Nginx logları
sudo tail -f /var/log/nginx/error.log
```

### 2. API Response Test
```bash
# Browser'da network tab'ı açın
# /api/blog çağrısının response'unu kontrol edin
# Console'da hata mesajlarını kontrol edin
```

### 3. Environment Variables Kontrol
```bash
# Sunucuda environment variables'ı kontrol et
cd /var/www/butcapp
cat .env.local

# Node.js'te test et
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

## 📄 Önemli Notlar

1. **Fallback Aktif**: `ENABLE_LOCAL_FALLBACK=true` sayesinde Supabase bağlantısı olsa bile demo veriler gösterilir
2. **Production Safe**: Credentials artık environment variables'da, kodda değil
3. **Demo Veriler**: 3 adet Türkçe finans blog yazısı mevcut
4. **Responsive**: Tüm cihazlarda çalışır

## 🆘 Yardım

Sorun yaşarsanız:
1. Bu README'yi takip edin
2. Logları kontrol edin
3. Environment variables'ı doğrulayın
4. API endpoint'lerini test edin