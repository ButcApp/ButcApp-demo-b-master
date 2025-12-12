import { NextRequest, NextResponse } from 'next/server'
//import { PrismaClient } from '@prisma/client'
import { verifyAdminToken } from '@/lib/jwt'
import { Logger } from '@/lib/logger'
import { corsMiddleware, handleOptions } from '@/lib/cors-middleware'

//const prisma = new PrismaClient()

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

    const { categoryId } = await params
    const { name, slug, description } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({
        success: false,
        error: 'Kategori adı ve slug zorunludur'
      }, { status: 400, headers: corsHeaders })
    }

    // Kategoriyi güncelle
    const updatedCategory = await prisma.blogCategory.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
        description
      }
    })

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

    const { categoryId } = await params

    // Önce kategoriyi bul log için
    const category = await prisma.blogCategory.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Kategori bulunamadı'
      }, { status: 404, headers: corsHeaders })
    }

    // Kategoriyi sil
    await prisma.blogCategory.delete({
      where: { id: categoryId }
    })

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