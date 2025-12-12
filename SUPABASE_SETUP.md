# 📊 Supabase Dashboard Kurulum Rehberi

## 🔗 **Supabase Paneline Git**
1. [Supabase Dashboard](https://app.supabase.com/) adresine gidin
2. Projenizi seçin: `dfiwgngtifuqrrxkvknn`

## 🏗️ **Blog Posts Tablosu Oluşturma**

### **Adım 1: Yeni Tablo Oluştur**
1. Sol menüden **Table Editor**'a tıklayın
2. **New table** butonuna tıklayın
3. **Table name**: `blog_posts` yazın
4. **Enable Row Level Security** işaretli kalsın

### **Adım 2: Column'ları Ekle**

| Column Name | Type | Default Value | Constraints | Description |
|-------------|------|----------------|---------------|-------------|
| id | text | - | Primary Key, Not Null | Benzersiz ID |
| title | text | - | Not Null | Makale başlığı |
| slug | text | - | Unique, Not Null | URL için slug |
| excerpt | text | - | - | Makale özeti |
| content | text | - | Not Null | Makale içeriği |
| featured_image | text | - | - | Kapak görseli URL |
| author_id | text | - | Not Null | Yazar ID |
| author_name | text | - | Not Null | Yazar adı |
| author_avatar | text | - | - | Yazar avatar URL |
| category | text | - | Not Null | Kategori |
| tags | text | - | - | Etiketler (virgülle ayrılmış) |
| meta_title | text | - | - | SEO başlığı |
| meta_description | text | - | - | SEO açıklaması |
| meta_keywords | text | - | - | SEO anahtar kelimeleri |
| status | text | 'draft' | Not Null | draft/published/archived |
| featured | bool | false | - | Öne çıkan mı |
| view_count | int8 | 0 | - | Görüntülenme sayısı |
| reading_time | int8 | - | - | Okuma süresi (dakika) |
| published_at | timestamp | - | - | Yayınlanma tarihi |
| created_at | timestamp | now() | Not Null | Oluşturulma tarihi |
| updated_at | timestamp | now() | Not Null | Güncellenme tarihi |

### **Adım 3: Tabloyu Kaydet**
1. **Save** butonuna tıklayın
2. Table oluşturulacak

## 🔒 **RLS (Row Level Security) Ayarları**

### **Public Read Access**
1. Oluşturulan `blog_posts` tablosuna tıklayın
2. **Authentication** → **Policies** sekmesine gidin
3. **New policy** butonuna tıklayın
4. **Policy name**: `Public read access`
5. **Allowed operation**: `SELECT`
6. **Policy definition**: `true` yazın
7. **Save** butonuna tıklayın

## 📝 **Test Verileri Ekleme**

### **Örnek Blog Post'u**

1. **Table Editor**'da `blog_posts` tablosunu açın
2. **Insert row** butonuna tıklayın
3. Aşağıdaki verileri girin:

```json
{
  "id": "post_1",
  "title": "Kişisel Finans Yönetiminin 5 Altın Kuralı",
  "slug": "kisisel-finans-yonetiminin-5-altin-kurali",
  "excerpt": "Finansal sağlığınızı iyileştirmek için uygulayabileceğiniz basit ama etkili stratejiler.",
  "content": "# Kişisel Finans Yönetimi\n\nFinansal sağlık, doğru alışkanlıklar ve disiplinle elde edilebilir...",
  "featured_image": "https://images.unsplash.com/photo-1554224154-260325c0574e?w=800",
  "author_id": "author_1",
  "author_name": "ButcApp Finans Ekibi",
  "author_avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
  "category": "Bütçe Yönetimi",
  "tags": "bütçe,finansal planlama,para yönetimi",
  "status": "published",
  "featured": true,
  "view_count": 1250,
  "reading_time": 8,
  "published_at": "2024-01-15T10:00:00Z"
}
```

### **İkinci Örnek Post**

```json
{
  "id": "post_2",
  "title": "Yatırıma Başlamak İçin 7 Adım",
  "slug": "yatirima-baslamak-icin-7-adim",
  "excerpt": "Yatırım dünyasına adım atmak için bilmeniz gereken her şey.",
  "content": "# Yatırıma Başlamak\n\nYatırım yapmak korkutucu görünebilir...",
  "featured_image": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
  "author_id": "author_2",
  "author_name": "ButcApp Yatırım Ekibi",
  "author_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
  "category": "Yatırım",
  "tags": "yatırım,portföy,finansal büyüme",
  "status": "published",
  "featured": true,
  "view_count": 980,
  "reading_time": 12,
  "published_at": "2024-01-10T10:00:00Z"
}
```

## ✅ **Kontrol Listesi**

- [ ] `blog_posts` tablosu oluşturuldu
- [ ] Tüm column'lar doğru tiplerde eklendi
- [ ] Primary key (`id`) ayarlandı
- [ ] Unique constraint (`slug`) ayarlandı
- [ ] Default values ayarlandı
- [ ] RLS policy oluşturuldu
- [ ] Test verileri eklendi
- [ ] Blog sistemi test edildi

## 🚀 **Test Etme**

1. Uygulamanızı çalıştırın: `pnpm run dev`
2. `/blog` sayfasına gidin
3. Verilerin Supabase'den geldiğini kontrol edin
4. Detay sayfasını test edin

## 🔧 **Sorun Giderme**

**Eğer veriler görünmezse:**
1. Supabase URL ve API key kontrolü
2. RLS policy kontrolü
3. Network tab'da API hatalarını kontrol et

**Eğer permission hatası alırsanız:**
1. RLS policy'nin doğru ayarlandığından emin olun
2. Service role key kullanın