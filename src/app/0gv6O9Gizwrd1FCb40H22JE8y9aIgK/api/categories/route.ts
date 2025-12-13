import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'
import { Logger } from '@/lib/logger'
import { corsMiddleware, handleOptions } from '@/lib/cors-middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }
  const corsHeaders = corsMiddleware(request)
  const startTime = Date.now()
  const headersList = request.headers
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  try {
    // Token doğrula
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await Logger.logSecurity('unauthorized_access', 'No token provided', ipAddress, userAgent)
      return NextResponse.json({
        success: false,
        error: 'Yetkilendirme token\'ı gerekli'
      }, { status: 401, headers: corsHeaders })
    }

    const token = authHeader.substring(7)
    const isAdmin = await verifyAdminToken(token)
    
    if (!isAdmin) {
      await Logger.logSecurity('unauthorized_access', 'Invalid admin token', ipAddress, userAgent)
      return NextResponse.json({
        success: false,
        error: 'Geçersiz veya yetkisiz token'
      }, { status: 403, headers: corsHeaders })
    }

    // Kategorileri Supabase'den getir
    const { data: categories, error } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published')

    if (error) {
      console.error('Supabase categories fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Kategoriler yüklenemedi: ' + error.message
      }, { status: 500, headers: corsHeaders })
    }

    // Benzersiz kategorileri al ve say
    const categoryMap = new Map()
    if (categories) {
      categories.forEach(post => {
        if (post.category) {
          categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1)
        }
      })
    }

    const categoriesWithCounts = Array.from(categoryMap.entries()).map(([name, count]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: name,
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: `${name} ile ilgili yazılar`,
      postCount: count
    }))

    await Logger.logApiRequest('/api/categories', 'GET', 200, Date.now() - startTime, undefined, undefined)

    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Categories API Error:', error)
    await Logger.logError(error as Error, 'GET /api/categories', undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'Kategoriler yüklenemedi: ' + error.message
    }, { status: 500, headers: corsHeaders })
  }
}

export async function POST(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }
  const corsHeaders = corsMiddleware(request)
  const startTime = Date.now()
  const headersList = request.headers
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  try {
    // Token doğrula
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      await Logger.logSecurity('unauthorized_access', 'No token provided', ipAddress, userAgent)
      return NextResponse.json({
        success: false,
        error: 'Yetkilendirme token\'ı gerekli'
      }, { status: 401, headers: corsHeaders })
    }

    const token = authHeader.substring(7)
    const isAdmin = await verifyAdminToken(token)
    
    if (!isAdmin) {
      await Logger.logSecurity('unauthorized_access', 'Invalid admin token', ipAddress, userAgent)
      return NextResponse.json({
        success: false,
        error: 'Geçersiz veya yetkisiz token'
      }, { status: 403, headers: corsHeaders })
    }

    const { name, slug, description } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Kategori adı ve slug zorunludur'
      }, { status: 400, headers: corsHeaders })
    }

    // Kategori oluştur (Bu özellik şu anlık kullanılmıyor, sadece GET metodu aktif)
    return NextResponse.json({
      success: false,
      error: 'Kategori oluşturma şu anlık devre dışı'
    }, { status: 503, headers: corsHeaders })

  } catch (error: any) {
    console.error('Categories API Error:', error)
    await Logger.logError(error as Error, 'POST /api/categories', undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'Kategori oluşturulamadı: ' + error.message
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}