import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'

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

    console.log('Token found:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }

    if (!token) {
      console.log('No token found, redirecting to login');
      return NextResponse.redirect(new URL('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login', request.url))
    }

    try {
      // Token'ı doğrula ve kullanıcı bilgilerini al
      const isValidAdmin = await verifyAdminToken(token)
      
      if (!isValidAdmin) {
        console.log('Invalid admin token, redirecting to login');
        return NextResponse.redirect(new URL('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login', request.url))
      }

      // Get payload for user info (if needed)
      let payload = null;
      try {
        // Try to get actual payload for logging
        const { verifyToken } = await import('@/lib/jwt');
        payload = await verifyToken(token);
        console.log('User authenticated:', { id: payload?.id, role: payload?.role });
      } catch (error) {
        console.log('Could not decode payload, but admin token is valid');
      }

      // Moderatör erişim kontrolü - sadece blog sayfasına erişebilir
      if (payload && payload.role === 'moderator') {
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
      if (payload) {
        response.headers.set('x-user-id', payload.id)
        response.headers.set('x-user-role', payload.role)
      }
      
      return response

    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login', request.url))
    }
  }

  console.log('Not an admin route or login page, proceeding');
  return NextResponse.next()
}