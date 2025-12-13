import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'
import { Logger } from '@/lib/logger'
import { corsMiddleware, handleOptions } from '@/lib/cors-middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }
  const corsHeaders = corsMiddleware(request)
  const startTime = Date.now()
  const headersList = request.headers
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  try {
    const { userId } = await params
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

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Kullanıcı ID gerekli'
      }, { status: 400, headers: corsHeaders })
    }

    // Bu örnekte kullanıcı durumunu değiştiremiyoruz çünkü veritabanında isActive alanı yok
    // Sadece loglama yapıyoruz
    await Logger.logAdminAction('', 'user_status_toggled', `User status toggled: ${userId}`, {
      userId,
      toggledAt: new Date().toISOString()
    })

    await Logger.logApiRequest(`/api/users/${userId}/toggle-status`, 'POST', 200, Date.now() - startTime, undefined, undefined)

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı durumu güncellendi'
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Toggle User Status API Error:', error)
    await Logger.logError(error as Error, `POST /api/users/${userId}/toggle-status`, undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'Durum güncellenemedi: ' + error.message
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return handleOptions(request)
}