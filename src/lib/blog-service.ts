import { supabase } from './supabase-config'
import { BlogPost, BlogCategory } from '@/types/blog'

// Blog post'larını Supabase'den getir
export async function getBlogPosts(options?: {
  category?: string
  featured?: boolean
  search?: string
  limit?: number
  offset?: number
}): Promise<BlogPost[]> {
  try {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')

    // Kategori filtresi
    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category)
    }

    // Öne çıkan filtresi
    if (options?.featured) {
      query = query.eq('featured', true)
    }

    // Arama filtresi
    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%,excerpt.ilike.%${options.search}%`)
    }

    // Sıralama ve limit
    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching blog posts:', error)
      throw new Error(`Failed to fetch blog posts: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Supabase verilerini frontend formatına dönüştür
    return data.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      author_id: post.author_id,
      author_name: post.author_name || 'ButcApp Team',
      author_avatar: post.author_avatar,
      category: post.category,
      tags: post.tags ? post.tags.split(',').map((tag: string) => tag.trim()) : [],
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      meta_keywords: post.meta_keywords ? post.meta_keywords.split(',').map((tag: string) => tag.trim()) : [],
      status: post.status,
      featured: post.featured || false,
      view_count: post.view_count || 0,
      reading_time: post.reading_time || Math.ceil(post.content?.length / 1000) || 5,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at
    }))

  } catch (error) {
    console.error('Error in getBlogPosts:', error)
    throw error
  }
}

// Tekil blog post'u getir
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Post bulunamadı
        return null
      }
      console.error('Error fetching blog post:', error)
      throw new Error(`Failed to fetch blog post: ${error.message}`)
    }

    if (!data) {
      return null
    }

    // View count'u artır
    await supabase
      .from('blog_posts')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id)

    // Supabase verisini frontend formatına dönüştür
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featured_image: data.featured_image,
      author_id: data.author_id,
      author_name: data.author_name || 'ButcApp Team',
      author_avatar: data.author_avatar,
      category: data.category,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()) : [],
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      meta_keywords: data.meta_keywords ? data.meta_keywords.split(',').map((tag: string) => tag.trim()) : [],
      status: data.status,
      featured: data.featured || false,
      view_count: (data.view_count || 0) + 1, // Artırılmış view count
      reading_time: data.reading_time || Math.ceil(data.content?.length / 1000) || 5,
      published_at: data.published_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    }

  } catch (error) {
    console.error('Error in getBlogPostBySlug:', error)
    throw error
  }
}

// Kategorileri getir
export async function getBlogCategories(): Promise<BlogCategory[]> {
  try {
    // Önce tüm post'ları getirip kategorileri say
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published')

    if (postsError) {
      console.error('Error fetching posts for categories:', postsError)
      throw new Error(`Failed to fetch posts for categories: ${postsError.message}`)
    }

    // Kategorileri say
    const categoryCounts: Record<string, number> = {}
    posts?.forEach(post => {
      if (post.category) {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1
      }
    })

    // Benzersiz kategorileri oluştur
    const uniqueCategories = Object.keys(categoryCounts)

    // BlogCategory formatına dönüştür
    const categories: BlogCategory[] = uniqueCategories.map((categoryName, index) => ({
      id: `category_${index}`,
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: `${categoryName} ile ilgili yazılar`,
      color: getCategoryColor(index),
      icon: getCategoryIcon(categoryName),
      created_at: new Date().toISOString()
    }))

    return categories

  } catch (error) {
    console.error('Error in getBlogCategories:', error)
    throw error
  }
}

// Kategori rengi helper
function getCategoryColor(index: number): string {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
  return colors[index % colors.length]
}

// Kategori ikonu helper
function getCategoryIcon(categoryName: string): string {
  const iconMap: Record<string, string> = {
    'Bütçe Yönetimi': '💰',
    'Yatırım': '📈',
    'Birikim': '🏦',
    'Kredi': '💳',
    'Genel': '📊'
  }
  return iconMap[categoryName] || '📝'
}

// İlgili post'ları getir
export async function getRelatedPosts(currentPostId: string, category: string, limit: number = 3): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('category', category)
      .eq('status', 'published')
      .neq('id', currentPostId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching related posts:', error)
      throw new Error(`Failed to fetch related posts: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    // Supabase verilerini frontend formatına dönüştür
    return data.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      author_id: post.author_id,
      author_name: post.author_name || 'ButcApp Team',
      author_avatar: post.author_avatar,
      category: post.category,
      tags: post.tags ? post.tags.split(',').map((tag: string) => tag.trim()) : [],
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      meta_keywords: post.meta_keywords ? post.meta_keywords.split(',').map((tag: string) => tag.trim()) : [],
      status: post.status,
      featured: post.featured || false,
      view_count: post.view_count || 0,
      reading_time: post.reading_time || Math.ceil(post.content?.length / 1000) || 5,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at
    }))

  } catch (error) {
    console.error('Error in getRelatedPosts:', error)
    throw error
  }
}