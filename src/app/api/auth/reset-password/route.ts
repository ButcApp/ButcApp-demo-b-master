import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'

// POST /api/auth/reset-password - Reset user password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Mevcut şifre ve yeni şifre gereklidir' 
      }, { status: 400 })
    }

    // Get current user from token
    const authResult = await AuthService.verifyTokenForAPI(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ 
        error: 'Oturum bulunamadı' 
      }, { status: 401 })
    }

    const user = authResult.user

    // Update password in database
    const { error } = await AuthService.updatePassword(user.id, newPassword, currentPassword)
    if (error) {
      return NextResponse.json({ 
        error: error 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Şifreniz başarıyla güncellendi'
    }, { status: 200 })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ 
      error: 'Sunucu hatası' 
    }, { status: 500 })
  }
}