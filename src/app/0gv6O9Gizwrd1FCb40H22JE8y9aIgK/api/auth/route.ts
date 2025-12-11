import { NextRequest, NextResponse } from 'next/server'
import { generateToken } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { identifier, password, captchaAnswer } = await request.json()

    console.log('Admin Auth API: Login attempt', { identifier, hasPassword: !!password })

    // Önce admin credentials kontrol et
    const validCredentials = [
      { username: 'admin', password: 'admin123', role: 'admin', email: 'admin@butcapp.com' },
      { username: 'demo', password: 'demo123', role: 'admin', email: 'demo@butcapp.com' }
    ]

    const adminUser = validCredentials.find(cred => 
      (cred.username === identifier || cred.email === identifier.toLowerCase()) && 
      cred.password === password
    )

    if (adminUser) {
      // Admin kullanıcı - JWT token oluştur
      const token = await generateToken({
        id: adminUser.username,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      })

      console.log('Admin Auth API: Login successful', { identifier, role: adminUser.role })

      const userData = {
        id: adminUser.username,
        username: adminUser.username,
        email: adminUser.email,
        name: adminUser.username,
        role: adminUser.role,
        lastLogin: new Date().toISOString()
      }

      const response = {
        success: true,
        data: {
          user: userData,
          token: token
        }
      }

      console.log('Admin Auth API: Response', JSON.stringify(response))

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // Eğer admin değilse, normal kullanıcıları kontrol et
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', identifier.toLowerCase())
      .single()

    console.log('User lookup result:', { user, error, identifier })

    if (error || !user) {
      console.log('Admin Auth API: User not found', { identifier, error: error?.message })
      return NextResponse.json({
        success: false,
        error: 'Kullanıcı adı veya şifre hatalı'
      }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // Kullanıcının rolünü admin_users tablosundan al
    const { data: adminUserData, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('userid', user.id)
      .single()

    const userRole = adminUserData?.role || 'user'
    console.log('User role check:', { userId: user.id, userRole, adminUserData, adminError })

    // Şifre kontrolü (bcrypt hash kontrolü)
    console.log('Password check:', { 
      providedPassword: password, 
      storedHash: user.passwordhash
    })

    // Eğer passwordhash null ise, geçici şifre kontrolü yap
    if (!user.passwordhash) {
      console.log('No password hash found, using temporary password check')
      const tempValidPasswords = ['123456', 'password', 'test']
      if (!tempValidPasswords.includes(password)) {
        console.log('Admin Auth API: Invalid temporary password', { identifier })
        return NextResponse.json({
          success: false,
          error: 'Kullanıcı adı veya şifre hatalı'
        }, { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }
    } else {
      // Hash'lenmiş şifre kontrolü
      try {
        const isPasswordValid = await bcrypt.compare(password, user.passwordhash)
        console.log('Password comparison result:', { isPasswordValid })

        if (!isPasswordValid) {
          console.log('Admin Auth API: Invalid password', { identifier })
          return NextResponse.json({
            success: false,
            error: 'Kullanıcı adı veya şifre hatalı'
          }, { 
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          })
        }
      } catch (bcryptError) {
        console.error('Bcrypt comparison error:', bcryptError)
        return NextResponse.json({
          success: false,
          error: 'Şifre doğrulanamadı'
        }, { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }
    }

    // Sadece admin ve moderatorler girebilir
    if (!['admin', 'moderator'].includes(userRole)) {
      console.log('Admin Auth API: User not authorized', { identifier, role: userRole })
      return NextResponse.json({
        success: false,
        error: 'Bu panel için yetkiniz bulunmuyor'
      }, { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // JWT token oluştur
    const token = await generateToken({
      id: user.id,
      username: user.email,
      email: user.email,
      role: userRole
    })

    console.log('Admin Auth API: User login successful', { identifier, role: userRole })

    const userData = {
      id: user.id,
      username: user.email,
      email: user.email,
      name: user.name || user.email,
      role: userRole,
      lastLogin: new Date().toISOString()
    }

    const response = {
      success: true,
      data: {
        user: userData,
        token: token
      }
    }

    console.log('Admin Auth API: Response', JSON.stringify(response))

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Admin Auth API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Giriş sırasında bir hata oluştu'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}