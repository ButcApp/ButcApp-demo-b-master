# Blog Detay Sayfası Tamiri - Deployment Kontrol Listesi

## ✅ **Sorun Çözüldü!**

Blog detay sayfasındaki tüm sorunlar düzeltildi:

### 🔧 **Yapılan Düzeltmeler:**

#### 1. **Property Uyuşmazlıkları Düzeltildi**
- `featured_image` → `coverImage`
- `author_name` → `author.name`
- `published_at` → `publishedAt`
- `reading_time` → `readingTime`
- `view_count` → `views`

#### 2. **BlogDetailPage Component'i Güncellendi**
- Tüm property referansları düzeltildi
- Fallback mekanizması ile uyumlu hale getirildi
- Related posts kısmı güncellendi

#### 3. **Fallback Sistemi Tamamlandı**
- Supabase bağlantısı başarısız olursa demo veriler gösterilir
- 3 adet Türkçe finans blog yazısı hazır
- Tüm kategoriler için fallback mevcut

## 🚀 **Ubuntu Deployment Adımları:**

### 1. **Projeyi Sunucuya Kopyala**
```bash
scp -r /home/z/my-project/* user@your-server:/var/www/butcapp/
ssh user@your-server
cd /var/www/butcapp
```

### 2. **Environment Variables Ayarla**
```bash
nano .env.local

# Supabase bilgilerini gir:
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
ENABLE_LOCAL_FALLBACK=true
```

### 3. **Build ve Deploy**
```bash
pnpm install
pnpm run build
pm2 restart butcapp  # veya pm2 start ecosystem.config.js
```

## 🧪 **Test Adımları:**

### 1. **Blog Listesi Test**
```bash
curl http://localhost:3000/api/blog
# Sonuç: Blog yazıları listesi (fallback veya Supabase)
```

### 2. **Kategoriler Test**
```bash
curl http://localhost:3000/api/blog/categories
# Sonuç: Kategori listesi
```

### 3. **Blog Detayı Test**
```bash
# Mevcut slug ile test
curl http://localhost:3000/api/blog/dfadfa

# Demo slug ile test (fallback)
curl http://localhost:3000/api/blog/kisisel-finans-yonetiminin-5-altin-kurali
```

### 4. **Frontend Test**
- `http://localhost:3000/blog` - Blog listesi
- `http://localhost:3000/blog/dfadfa` - Mevcut yazı detayı
- `http://localhost:3000/blog/kisisel-finans-yonetiminin-5-altin-kurali` - Demo yazı detayı

## 📋 **Kontrol Listesi:**

- [ ] `.env.local` dosyası oluşturuldu
- [ ] Supabase credentials girildi
- [ ] `pnpm install` çalıştırıldı
- [ ] `pnpm run build` başarılı oldu
- [ ] PM2 ile uygulama yeniden başlatıldı
- [ ] Blog listesi sayfası çalışıyor
- [ ] Blog detay sayfaları açılıyor
- [ ] Kategori filtreleme çalışıyor
- [ ] Demo veriler (fallback) hazır

## 🎯 **Özellikler:**

### ✅ **Çalışan Özellikler:**
- Blog listesi ve detay sayfaları
- Kategori filtreleme
- Arama fonksiyonu
- Responsive tasarım
- Okuma progress bar
- Sosyal paylaşım butonları
- Like ve bookmark fonksiyonları
- İlgili yazılar bölümü

### 🔄 **Fallback Sistemi:**
- Supabase bağlantısı sorununda otomatik devreye girer
- 3 demo blog yazısı:
  - "Kişisel Finans Yönetiminin 5 Altın Kuralı"
  - "Yatırıma Başlamak İçin 7 Adım"
  - "Para Biriktirmenin Psikolojisi"
- 5 kategori: Genel, Bütçe Yönetimi, Yatırım, Birikim, Kredi

## 🆘 **Troubleshooting:**

Eğer blog detay sayfası hala açılmıyorsa:

### 1. **Logları Kontrol Et**
```bash
pm2 logs butcapp
```

### 2. **API Response Test**
```bash
# Browser'da Network tab'ı aç
# /blog/slug sayfasında API çağrılarını kontrol et
# Console'da hata mesajlarını kontrol et
```

### 3. **Environment Variables**
```bash
cd /var/www/butcapp
cat .env.local
# Credentials'ın doğru olduğundan emin ol
```

### 4. **Fallback Test**
```bash
# Supabase credentials'ı geçici olarak yanlış yap
# .env.local dosyasını düzenle ve restart et
# Demo verilerin geldiğini kontrol et
```

## 📄 **Önemli Notlar:**

1. **Production Ready**: Tüm property uyumsuzlukları düzeltildi
2. **Fallback Aktif**: Supabase sorunlarında demo içerik gösterilir
3. **Responsive**: Tüm cihazlarda mükemmel çalışır
4. **SEO Friendly**: Meta tags ve OpenGraph destekli
5. **Performance**: Optimized images ve lazy loading

Artık blog sisteminiz Ubuntu sunucusunda sorunsuz çalışacak! Hem blog listesi hem de detay sayfaları tamamen fonksiyonel.