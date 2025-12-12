import { createClient } from '@supabase/supabase-js'

// Environment variables'dan Supabase konfigürasyonunu al
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Yerel fallback veriler
export const localBlogPosts = [
  {
    id: 'local_1',
    title: 'Kişisel Finans Yönetiminin 5 Altın Kuralı',
    slug: 'kisisel-finans-yonetiminin-5-altin-kurali',
    excerpt: 'Finansal sağlığınızı iyileştirmek için uygulayabileceğiniz basit ama etkili stratejiler.',
    content: `
# Kişisel Finans Yönetiminin 5 Altın Kuralı

Finansal sağlık, doğru alışkanlıklar ve disiplinle elde edilebilir. İşte kişisel finans yönetiminin temel prensipleri:

## 1. Bütçe Yapın ve Takip Edin

Her ay gelirlerinizi ve giderlerinizi detaylı olarak kaydedin. Bu, nereye para harcadığınızı görmenizi sağlar.

**İpuçları:**
- 50/30/20 kuralını uygulayın: %50 ihtiyaçlar, %30 istekler, %20 tasarruf
- Mobil uygulamalar kullanarak harcamalarınızı takip edin
- Her ay bütçenizi gözden geçirin

## 2. Acil Durum Fonu Oluşturun

Beklenmedik durumlar için 3-6 aylık yaşam masrafınız kadar birikim yapın.

**Neden önemli?**
- İş kaybında koruma sağlar
- Beklenmedik medikal masrafları karşılar
- Finansal stresi azaltır

## 3. Borçları Yönetin

Yüksek faizli borçları önceliklendirin ve stratejik bir ödeme planı oluşturun.

**Stratejiler:**
- Kredi kartı borçlarını önce ödeyin
- Konsolidasyon kredilerini değerlendirin
- Ekstra ödemeler yapın

## 4. Yatırım Yapın

Paranızın sizin için çalışmasını sağlayın.

**Seçenekler:**
- Hisse senetleri ve yatırım fonları
- Emeklilik planları
- Gayrimenkul yatırımları

## 5. Finansal Hedefler Belirleyin

Kısa, orta ve uzun vadeli hedefleriniz olsun.

**Örnek hedefler:**
- 1 yıl içinde: Acil durum fonu tamamlamak
- 5 yıl içinde: Araba almak
- 10 yıl içinde: Ev peşinatı biriktirmek

Unutmayın, tutarlılık ve sabır finansal başarıda anahtardır.
    `,
    coverImage: '/images/blog/budget-planning.jpg',
    category: 'Bütçe Yönetimi',
    author: {
      name: 'ButcApp Finans Ekibi',
      avatar: '/images/default-avatar.png',
      bio: 'Kişisel finans ve bütçe yönetimi uzmanları'
    },
    publishedAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    readingTime: 8,
    featured: true,
    tags: ['bütçe', 'finansal planlama', 'para yönetimi'],
    views: 1250,
    status: 'published'
  },
  {
    id: 'local_2',
    title: 'Yatırıma Başlamak İçin 7 Adım',
    slug: 'yatirima-baslamak-icin-7-adim',
    excerpt: 'Yatırım dünyasına adım atmak için bilmeniz gereken her şey. Korkularınızı yenin ve paranızın değerlenmesini sağlayın.',
    content: `
# Yatırıma Başlamak İçin 7 Adım

Yatırım yapmak korkutucu görünebilir, ancak doğru bilgi ve strateji ile herkes başarılı olabilir.

## 1. Finansal Durumunuzu Değerlendirin

Yatırıma başlamadan önce:
- Acil durum fonunuzun olduğundan emin olun
- Yüksek faizli borçlarınızı kapatın
- Aylık bütçenizi oluşturun

## 2. Yatırım Hedefleri Belirleyin

Ne için yatırım yapıyorsunuz?
- Emeklilik
- Ev alımı
- Çocukların eğitimi
- Finansal bağımsızlık

## 3. Risk Toleransınızı Anlayın

Ne kadar riske katlanabilirsiniz?
- **Konservatif**: Düşük risk, düşük getiri
- **Moderat**: Orta risk, orta getiri  
- **Agresif**: Yüksek risk, yüksek getiri

## 4. Yatırım Türlerini Öğrenin

**Temel seçenekler:**
- Hisse senetleri: Şirketlere ortak olmak
- Tahviller: Şirketlere veya devlete borç vermek
- Fonlar: Çoklu yatırım araçları
- ETF'ler: Borsada işlem gören fonlar

## 5. Yatırım Hesabı Açın

**Seçenekler:**
- Banka yatırım hesapları
- Online brokerage hesapları
- Robo-danışman platformları

## 6. Küçük Başlayın

- $100-500 ile başlayabilirsiniz
- Düzenli yatırım yapın (dolar maliyet ortalaması)
- Otomatik yatırım talimatları verin

## 7. Düzenli Gözden Geçirin

- Portföyünüzü ayda bir kontrol edin
- Gerekirse dengeleri yeniden ayarlayın
- Hedeflerinize ulaşılıp ulaşılmadığını kontrol edin

Unutmayın, en iyi zaman yatırım yapmaya başlamak için dündü. İkinci en iyi zaman ise bugün.
    `,
    coverImage: '/images/blog/investment-guide.jpg',
    category: 'Yatırım',
    author: {
      name: 'ButcApp Yatırım Ekibi',
      avatar: '/images/default-avatar.png',
      bio: 'Yatırım stratejileri ve portföy yönetimi uzmanları'
    },
    publishedAt: new Date('2024-01-10').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
    readingTime: 12,
    featured: true,
    tags: ['yatırım', 'portföy', 'finansal büyüme'],
    views: 980,
    status: 'published'
  },
  {
    id: 'local_3',
    title: 'Para Biriktirmenin Psikolojisi',
    slug: 'para-biriktirmenin-psikolojisi',
    excerpt: 'Neden para biriktirmek bu kadar zor? Mental blokajları aşın ve tasarruf alışkanlıkları geliştirin.',
    content: `
# Para Biriktirmenin Psikolojisi

Para biriktirmek sadece matematik değil, aynı zamanda bir davranış bilimidir.

## Neden Tasarruf Etmek Zordur?

**Psikolojik engeller:**
- **Anlık tatmin**: Bugünün keyfi yarının güvencesinden daha çekici gelir
- **Sosyal baskı**: Başkalarının yaşam tarzını takip etme isteği
- **Kontrol yanılsaması**: "Birikim yapamam" inancı
- **Geleceğe uzaklık**: Uzak hedefler için motivasyon eksikliği

## Tasarruf Alışkanlıkları Nasıl Geliştirilir?

### 1. Otomatikleştirin

- Maaşınızın %10'unu otomatik birikim hesabına aktarın
- "Önce kendinize ödeyin" prensibini uygulayın
- Manuel kararlardan kaçının

### 2. Hedeflerinizi Somutlaştırın

- "Birikim yapmak" yerine "2025 yılında 50.000 TL peşinat biriktirmek"
- Hedeflerinizi görselleştirin
- İlerlemenizi takip edin

### 3. Ortamınızı Düzenleyin

- Alışveriş sitelerinden e-posta bildirimlerini kapatın
- Kredi kartlarınızı evde bırakın
- Alışveriş listeleri yapın

### 4. Ödül Sistemi Kurun

- Hedeflerinize ulaştığınızda kendinizi ödüllendirin
- Küçük başarıları kutlayın
- İlerlemenizi paylaşın

## Zihniyet Değişikliği

**"Yoksunluk" yerine "Önceliklendirme"**
- Birikim = Paranızı alamamak
- Önceliklendirme = Paranızı değerli şeylere harcamak

**"Kısıtlama" yerine "Otomasyon"**
- Kısıtlama = İrade ile kontrol etme
- Otomasyon = Sistemin sizin için çalışması

Unutmayın, finansal özgürlük bir gecede gelmez, ancak tutarlı alışkanlıklarla kesinlikle ulaşılabilir.
    `,
    coverImage: '/images/blog/savings-psychology.jpg',
    category: 'Birikim',
    author: {
      name: 'Butcapp Davranışsal Finans Ekibi',
      avatar: '/images/default-avatar.png',
      bio: 'Finansal psikoloji ve davranışsal ekonomi uzmanları'
    },
    publishedAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString(),
    readingTime: 10,
    featured: false,
    tags: ['tasarruf', 'psikoloji', 'finansal alışkanlıklar'],
    views: 756,
    status: 'published'
  }
];

export const localCategories = [
  { id: 'genel', name: 'Genel', slug: 'genel', description: 'Genel finans yazıları', postCount: 0, color: '#6366f1' },
  { id: 'butce-yonetimi', name: 'Bütçe Yönetimi', slug: 'butce-yonetimi', description: 'Bütçe planlama ve takip', postCount: 1, color: '#10b981' },
  { id: 'yatirim', name: 'Yatırım', slug: 'yatirim', description: 'Yatırım stratejileri ve tavsiyeler', postCount: 1, color: '#f59e0b' },
  { id: 'birikim', name: 'Birikim', slug: 'birikim', description: 'Para biriktirme teknikleri', postCount: 1, color: '#ef4444' },
  { id: 'kredi', name: 'Kredi', slug: 'kredi', description: 'Kredi ve borç yönetimi', postCount: 0, color: '#8b5cf6' }
];

// Supabase bağlantısını test et ve fallback kullan
export async function getBlogPostsWithFallback() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('createdat', { ascending: false });

    if (error) {
      console.warn('Supabase connection failed, using local data:', error.message);
      return localBlogPosts;
    }

    // Eğer veri yoksa veya boşsa yerel verileri kullan
    if (!data || data.length === 0) {
      console.log('No posts in Supabase, using local data');
      return localBlogPosts;
    }

    // Supabase verilerini frontend formatına dönüştür
    return data.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.cover_image,
      category: post.category,
      author: {
        name: post.author_name || 'ButcApp Team',
        avatar: post.author_avatar || '/images/default-avatar.png',
        bio: post.author_bio || 'Finansal okuryazarlık uzmanları'
      },
      publishedAt: post.createdat,
      updatedAt: post.updatedat,
      readingTime: post.reading_time || Math.ceil(post.content?.length / 1000) || 5,
      featured: post.featured || false,
      tags: post.tags ? post.tags.split(',').map((tag: string) => tag.trim()) : [],
      views: post.viewCount || 0,
      status: post.status
    }));

  } catch (error) {
    console.warn('Error connecting to Supabase, using local data:', error);
    return localBlogPosts;
  }
}

export async function getCategoriesWithFallback() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published');

    if (error) {
      console.warn('Supabase categories failed, using local data:', error.message);
      return localCategories;
    }

    // Kategorileri say
    const categoryCounts: Record<string, number> = {};
    data?.forEach(post => {
      if (post.category) {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1
      }
    });

    // Yerel kategorileri güncelle
    const updatedCategories = localCategories.map(category => ({
      ...category,
      postCount: categoryCounts[category.name] || 0
    }));

    return updatedCategories;

  } catch (error) {
    console.warn('Error fetching categories from Supabase, using local data:', error);
    return localCategories;
  }
}