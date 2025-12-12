import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'
import { Logger } from '@/lib/logger'
import { corsMiddleware, handleOptions } from '@/lib/cors-middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse
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

    const { role } = await request.json()

    if (!role || !['user', 'moderator', 'admin'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Geçersiz rol. Geçerli roller: user, moderator, admin'
      }, { status: 400, headers: corsHeaders })
    }

    // Önce kullanıcının var olup olmadığını kontrol et
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, fullname')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.log('User lookup error:', userError)
      return NextResponse.json({
        success: false,
        error: 'Kullanıcı bulunamadı: ' + (userError?.message || 'Unknown error')
      }, { status: 404, headers: corsHeaders })
    }

    // Admin users tablosunda rolü güncelle
    if (role === 'user') {
      // User rolüne geçiş: admin_users tablosundan sil
      const { error: deleteError } = await supabase
        .from('admin_users')
        .delete()
        .eq('userid', userId)

      if (deleteError) {
        console.error('Admin user deletion error:', deleteError)
        return NextResponse.json({
          success: false,
          error: 'Rol güncellenemedi: ' + deleteError.message
        }, { status: 500, headers: corsHeaders })
      }
    } else {
      // Admin veya moderator rolüne geçiş: admin_users tablosunda güncelle veya ekle
      const { error: upsertError } = await supabase
        .from('admin_users')
        .upsert({
          id: `admin_${userId}_${Date.now()}`, // Benzersiz ID oluştur
          userid: userId,
          role: role,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }, {
          onConflict: 'userid'
        })

      if (upsertError) {
        console.error('Admin user upsert error:', upsertError)
        return NextResponse.json({
          success: false,
          error: 'Rol güncellenemedi: ' + upsertError.message
        }, { status: 500, headers: corsHeaders })
      }
    }

    await Logger.logAdminAction('', 'user_role_updated', `User role updated: ${user.email} -> ${role}`, {
      userId: userId,
      email: user.email,
      newRole: role,
      updatedAt: new Date().toISOString()
    })

    await Logger.logApiRequest(`/api/users/${userId}/update-role`, 'POST', 200, Date.now() - startTime, undefined, undefined)

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı rolü başarıyla güncellendi',
      data: {
        userId: userId,
        email: user.email,
        role: role
      }
    }, { headers: corsHeaders })

  } catch (error: any) {
    console.error('Update user role API Error:', error)
    await Logger.logError(error as Error, `POST /api/users/${userId}/update-role`, undefined, undefined)
    
    return NextResponse.json({
      success: false,
      error: 'Rol güncellenemedi: ' + error.message
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}