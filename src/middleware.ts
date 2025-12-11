import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

// Admin route'larını koruyan middleware
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('=== MIDDLEWARE DEBUG ===');
  console.log('Pathname:', pathname);
  console.log('Method:', request.method);

  // API rotalarını middleware'den her zaman hariç tut
  if (pathname.includes('/api/')) {
    console.log('API route, skipping middleware');
    return NextResponse.next()
  }

  // Login sayfasını her zaman erişime açık
  if (pathname.startsWith('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login')) {
    console.log('Login route, skipping middleware');
    return NextResponse.next()
  }

  // Admin paneli route kontrolü
  if (pathname.startsWith('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/')) {
    console.log('🔐 Admin route accessed:', pathname)
    console.log('🔐 Full URL:', request.url)
    
    // Token'ı birden fazla kaynaktan dene
    let token = request.cookies.get('auth_token')?.value
    
    // Cookie'de yoksa Authorization header'dan dene
    if (!token) {
      token = request.headers.get('authorization')?.replace('Bearer ', '')
    }
    
    // Orada da yoksa query param'dan dene
    if (!token) {
      token = request.nextUrl.searchParams.get('token')
    }

    console.log('🔐 Token sources:')
    console.log('  - Cookie auth_token:', !!request.cookies.get('auth_token')?.value)
    console.log('  - Header Authorization:', !!request.headers.get('authorization'))
    console.log('  - Query token:', !!request.nextUrl.searchParams.get('token'))
    console.log('  - Final token exists:', !!token)
    console.log('  - Final token length:', token?.length || 0)
    console.log('  - Final token preview:', token?.substring(0, 20) + '...')

    if (!token) {
      console.log('❌ No token found, redirecting to login')
      return NextResponse.redirect(new URL('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login', request.url))
    }

    try {
      // Token'ı doğrula ve kullanıcı bilgilerini al
      const payload = await verifyToken(token)
      console.log('✅ Token verified for user:', { id: payload?.id || payload?.userId, email: payload?.email })
      
      // Handle both id and userId fields for compatibility
      const userId = payload?.id || payload?.userId
      
      // For development mode, check for demo admin emails first
      if (process.env.NODE_ENV === 'development') {
        const demoAdmins = ['admin@butcapp.com', 'demo@butcapp.com', 'test@admin.com']
        if (demoAdmins.includes(payload.email || '')) {
          console.log('🧪 Development mode: Demo admin access granted for:', payload.email)
          const response = NextResponse.next()
          response.headers.set('x-user-id', userId)
          response.headers.set('x-user-role', 'admin')
          return response
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
        .eq('userid', userId)
        .limit(1)

      const isAdmin = adminUser && adminUser.length > 0
      
      if (!isAdmin) {
        console.log('❌ User is not in admin_users table, redirecting to login');
        return NextResponse.redirect(new URL('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login', request.url))
      }

      console.log('✅ User confirmed as admin:', payload.email)

      // Moderatör erişim kontrolü - sadece blog sayfasına erişebilir
      if (payload.role === 'moderator') {
        const allowedPaths = [
          '/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/dashboard',
          '/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/blog',
          '/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/posts',
          '/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/categories'
        ]

        const isAllowed = allowedPaths.some(allowedPath => pathname.startsWith(allowedPath))

        if (!isAllowed) {
          console.log('Moderator access denied to:', pathname);
          return NextResponse.redirect(new URL('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/dashboard', request.url))
        }
      }

      // Token'ı response header'a ekle (client-side için)
      const response = NextResponse.next()
      response.headers.set('x-user-id', userId)
      response.headers.set('x-user-role', payload.role || 'admin')
      
      return response

    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login', request.url))
    }
  }

  console.log('Not an admin route or login page, proceeding');
  return NextResponse.next()
}