import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ADMIN ACCESS API START ===')
    
    const body = await request.json()
    const userEmail = body.email
    
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.nextUrl.searchParams.get('token')

    console.log('🔍 Admin API - Token sources:')
    console.log('  - Cookie:', !!request.cookies.get('auth_token')?.value)
    console.log('  - Header:', !!request.headers.get('authorization'))
    console.log('  - Query:', !!request.nextUrl.searchParams.get('token'))
    console.log('  - Final token length:', token?.length || 0)
    console.log('  - Final token preview:', token?.substring(0, 20) + '...')
    console.log('  - Requested email:', userEmail)

    if (!token) {
      console.log('❌ No token provided for admin access check')
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        isAdmin: false
      }, { status: 401 })
    }

    console.log('🔍 Verifying token for admin access...')
    const user = await AuthService.verifyToken(token)
    
    if (!user) {
      console.log('❌ Invalid token for admin access')
      return NextResponse.json({
        success: false,
        error: 'Invalid token',
        isAdmin: false
      }, { status: 401 })
    }

    // For development mode, check for demo admin emails first
    if (process.env.NODE_ENV === 'development') {
      const demoAdmins = ['admin@butcapp.com', 'demo@butcapp.com', 'test@admin.com']
      if (demoAdmins.includes(userEmail || '')) {
        console.log('🧪 Development mode: Demo admin access granted for:', userEmail)
        return NextResponse.json({
          success: true,
          isAdmin: true,
          user: {
            id: user.id,
            email: userEmail,
            fullName: user.fullName
          },
          data: {
            adminUser: {
              id: user.id,
              email: userEmail,
              fullName: user.fullName,
              role: 'admin'
            },
            token: token
          }
        })
      } else {
        // For non-demo users in development, still check admin_users table
        console.log('🧪 Development mode: Non-demo user, checking admin_users table')
      }
    }
    
    // Check if user is admin by checking admin_users table
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
    const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('userid', user.id)
      .limit(1)

    if (error) {
      console.error('❌ Error checking admin access:', error)
      return NextResponse.json({
        success: false,
        error: 'Database error',
        isAdmin: false
      }, { status: 500 })
    }

    const isAdmin = adminUser && adminUser.length > 0
    
    console.log('✅ Admin access check completed for:', userEmail, 'Admin:', isAdmin)
    console.log('=== ADMIN ACCESS API END ===')

    return NextResponse.json({
      success: true,
      isAdmin: isAdmin,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      },
      // For admin panel access - return the current token
      data: {
        adminUser: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: isAdmin ? 'admin' : 'user'
        },
        token: token // Return the current user token for admin access
      }
    })

  } catch (error) {
    console.error('❌ Admin access API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      isAdmin: false,
      details: (error as Error).message
    }, { status: 500 })
  }
}