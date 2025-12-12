import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'
import { Logger } from '@/lib/logger'
import { corsMiddleware, handleOptions } from '@/lib/cors-middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse
  const corsHeaders = corsMiddleware(request)
  const startTime = Date.now()
  const headersList = request.headers
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  try {
    const { categoryId } = await params
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

    // Kategoriyi güncelle
    const { data: updatedCategory, error: updateError } = await supabase
      .from('blog_categories')
      .update({
        name,
        slug,
        description,
        updated_at: new Date()
      })
      .eq('id', categoryId)
      .select()
      .single()

    if (updateError) {
      console.error('Category update error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Kategori güncellenemedi: ' + updateError.message
      }, { status: 500, headers: corsHeaders })
    }

    await Logger.logAdminAction('', 'category_updated', `Category updated: ${name}`, {
      categoryId: updatedCategory.id,
      name,
      slug
    })

    await Logger.logApiRequest(`/api/categories/${categoryId}`, 'PUT', 200, Date.now() - startTime, undefined, undefined)

    return NextResponse.json({
      success: true,
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        description: updatedCategory.description
      }
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Category Update API Error:', error)
    await Logger.logError(error as Error, `PUT /api/categories/${categoryId}`, undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'Kategori güncellenemedi: ' + error.message
    }, { status: 500, headers: corsHeaders })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse
  const corsHeaders = corsMiddleware(request)
  const startTime = Date.now()
  const headersList = request.headers
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  try {
    const { categoryId } = await params
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

    // Önce kategoriyi bul log için
    const { data: category, error: fetchError } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (fetchError || !category) {
      return NextResponse.json({
        success: false,
        error: 'Kategori bulunamadı'
      }, { status: 404, headers: corsHeaders })
    }

    // Kategoriyi sil
    const { error: deleteError } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', categoryId)

    if (deleteError) {
      console.error('Category delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Kategori silinemedi: ' + deleteError.message
      }, { status: 500, headers: corsHeaders })
    }

    await Logger.logAdminAction('', 'category_deleted', `Category deleted: ${category.name}`, {
      categoryId,
      name: category.name,
      slug: category.slug
    })

    await Logger.logApiRequest(`/api/categories/${categoryId}`, 'DELETE', 200, Date.now() - startTime, undefined, undefined)

    return NextResponse.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Category Delete API Error:', error)
    await Logger.logError(error as Error, `DELETE /api/categories/${categoryId}`, undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'Kategori silinemedi: ' + error.message
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  return handleOptions(request)
}