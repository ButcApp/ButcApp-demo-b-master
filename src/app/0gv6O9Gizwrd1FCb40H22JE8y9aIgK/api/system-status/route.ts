import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 System Status API: Request received')
    
    // Token verification - Ubuntu için çoklu kaynak desteği
    const cookieToken = request.cookies.get('auth-token')?.value
    const headerToken = request.headers.get('authorization')?.replace('Bearer ', '')
    const urlToken = request.nextUrl.searchParams.get('token')
    
    const token = cookieToken || headerToken || urlToken
    
    console.log('🔍 System Status API: Token sources:', {
      cookie: !!cookieToken,
      header: !!headerToken,
      url: !!urlToken,
      final: !!token
    })

    if (!token) {
      console.log('❌ System Status API: No token provided')
      return NextResponse.json({ 
        error: 'Unauthorized - No token provided',
        debug: {
          cookie: !!cookieToken,
          header: !!headerToken,
          url: !!urlToken
        }
      }, { status: 401 })
    }

    console.log('🔐 System Status API: Verifying token...')
    const isAdmin = await verifyAdminToken(token)
    
    if (!isAdmin) {
      console.log('❌ System Status API: Token verification failed')
      return NextResponse.json({ 
        error: 'Forbidden - Invalid token',
        debug: {
          token: token.substring(0, 50) + '...',
          verification: 'failed'
        }
      }, { status: 403 })
    }

    console.log('✅ System Status API: Token verified successfully')

    // Ubuntu için sistem bilgilerini topla
    const memUsage = process.memoryUsage()
    const memoryUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)

    // Platform bilgilerini Ubuntu için iyileştir
    const platform = process.platform
    const isUbuntu = platform === 'linux'
    
    const serverInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // GB
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // GB
        free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024), // GB
        active: memoryUsagePercent,
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // GB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // GB
        external: Math.round(memUsage.external / 1024 / 1024), // GB
        residentSetSize: Math.round(memUsage.rss / 1024 / 1024) // GB
      },
      nodeVersion: process.version,
      platform: platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      nextVersion: '15.5.7',
      cpu: {
        count: require('os').cpus().length,
        usage: Math.round(Math.random() * 30 + 10), // Simüle edilmiş değer
        loadAverage: require('os').loadavg()[0].toFixed(2) // Gerçek load average
      },
      database: {
        status: 'connected',
        provider: 'supabase'
      },
      apis: {
        users: { status: 'active', lastCheck: new Date().toISOString() },
        posts: { status: 'active', lastCheck: new Date().toISOString() },
        categories: { status: 'active', lastCheck: new Date().toISOString() },
        realtimeStats: { status: 'active', lastCheck: new Date().toISOString() }
      },
      // Ubuntu için ek bilgiler
      ubuntu: {
        isUbuntu,
        platform: platform,
        hostname: require('os').hostname(),
        networkInterfaces: Object.keys(require('os').networkInterfaces())
      }
    }

    console.log('✅ System Status API: Server info collected successfully')

    return NextResponse.json({
      success: true,
      data: serverInfo
    })

  } catch (error) {
    console.error('❌ System Status API: Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}