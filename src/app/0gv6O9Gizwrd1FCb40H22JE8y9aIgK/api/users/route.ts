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

    // Kullanıcıları Supabase'den getir
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('createdat', { ascending: false })

    if (error) {
      console.error('Supabase users fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Kullanıcılar yüklenemedi: ' + error.message
      }, { status: 500, headers: corsHeaders })
    }

    // Admin rollerini ayrı sorgu ile al
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('userid, role')

    if (adminError) {
      console.error('Supabase admin users fetch error:', adminError)
    }

    // Rol bilgilerini kullanıcılarla eşleştir
    const adminRolesMap = new Map()
    if (adminUsers) {
      adminUsers.forEach(adminUser => {
        adminRolesMap.set(adminUser.userid, adminUser.role)
      })
    }

    // Kullanıcı verilerini formatla
    const formattedUsers = (users || []).map(user => {
      return {
        id: user.id,
        email: user.email,
        fullName: user.name || user.email,
        avatarUrl: user.avatar_url || '/images/default-avatar.png',
        createdAt: user.createdat,
        updatedAt: user.updatedat,
        isActive: true, // Varsayılan olarak aktif
        lastLogin: user.last_login || user.createdat,
        totalTransactions: 0, // Bu bilgiyi ayrı tablodan alabiliriz
        totalBalance: 0, // Bu bilgiyi ayrı tablodan alabiliriz
        role: adminRolesMap.get(user.id) || 'user' // Rol bilgisini admin_users tablosundan al
      }
    })

    await Logger.logApiRequest('/api/users', 'GET', 200, Date.now() - startTime, undefined, undefined)

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Users API Error:', error)
    await Logger.logError(error as Error, 'GET /api/users', undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'Kullanıcılar yüklenemedi: ' + error.message
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

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({
        success: false,
        error: 'userId ve action parametreleri gerekli'
      }, { status: 400, headers: corsHeaders })
    }

    if (action === 'delete') {
      // Kullanıcıyı sil
      const deletedUser = await prisma.user.delete({
        where: { id: userId },
        include: {
          profile: true,
          userData: true,
          blogPosts: true
        }
      })

      await Logger.logAdminAction('', 'user_deleted', `User deleted: ${deletedUser.email}`, {
        userId: deletedUser.id,
        email: deletedUser.email,
        deletedAt: new Date().toISOString()
      })

      await Logger.logApiRequest('/api/users', 'POST', 200, Date.now() - startTime, undefined, undefined)

      return NextResponse.json({
        success: true,
        message: 'Kullanıcı başarıyla silindi'
      }, { headers: corsHeaders })
    }

    return NextResponse.json({
      success: false,
      error: 'Geçersiz işlem'
    }, { status: 400, headers: corsHeaders })

  } catch (error: any) {
    console.error('Users API Error:', error)
    await Logger.logError(error as Error, 'POST /api/users', undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'İşlem başarısız: ' + error.message
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}