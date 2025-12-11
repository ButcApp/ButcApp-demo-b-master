import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ADMIN ACCESS API START ===')
    
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.nextUrl.searchParams.get('token')

    console.log('🔍 Admin API - Token sources:')
    console.log('  - Cookie:', !!request.cookies.get('auth_token')?.value)
    console.log('  - Header:', !!request.headers.get('authorization'))
    console.log('  - Query:', !!request.nextUrl.searchParams.get('token'))
    console.log('  - Final token length:', token?.length || 0)
    console.log('  - Final token preview:', token?.substring(0, 20) + '...')

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
    
    console.log('✅ Admin access check completed for:', user.email, 'Admin:', isAdmin)
    console.log('=== ADMIN ACCESS API END ===')

    return NextResponse.json({
      success: true,
      isAdmin: isAdmin,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
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