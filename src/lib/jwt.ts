import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'butcapp-secret-key-change-in-production-2024'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

// JWT secret'ı Uint8Array formatına çevir
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  id: string
  username: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export const generateToken = async (payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> => {
  try {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret)
  } catch (error) {
    throw new Error('Token generation failed')
  }
}

export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}

export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

// Middleware için özel token doğrulama fonksiyonu - Ubuntu için iyileştirildi
export const verifyAdminToken = async (token: string): Promise<boolean> => {
  try {
    console.log('🔐 verifyAdminToken called with:', token.substring(0, 50) + '...')
    
    // Demo token için development modunda izin ver
    if (process.env.NODE_ENV === 'development' && token === 'demo-token-for-ubuntu-testing') {
      console.log('🧪 Development mode: Demo token accepted for Ubuntu testing')
      return true
    }
    
    console.log('🔐 Attempting to verify token with verifyToken function...')
    const payload = await verifyToken(token)
    console.log('✅ JWT Payload decoded:', payload)
    
    // Check if user has admin role
    if (payload.role === 'admin' || payload.role === 'superadmin') {
      console.log('✅ User has admin role:', payload.role);
      return true
    }
    
    // For now, allow demo admin access
    if (payload.email === 'admin@butcapp.com' || payload.email === 'demo@butcapp.com') {
      console.log('✅ Demo admin access granted for:', payload.email);
      return true
    }
    
    // For development, accept any valid token
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode: All valid tokens accepted as admin')
      console.log('🔐 verifyAdminToken returning: true for development')
      return true
    }
    
  } catch (error) {
    console.error('❌ Token verification error:', error)
    
    // Development modunda demo token için hata gösterme
    if (process.env.NODE_ENV === 'development' && token === 'demo-token-for-ubuntu-testing') {
      console.log('🧪 Development mode: Demo token verification bypassed')
      return true
    }
    
    console.log('🔐 verifyAdminToken returning: false due to error')
    return false
  }
}

// Sync versiyonlar için (geriye uyumluluk)
export const generateTokenSync = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  throw new Error('generateTokenSync is deprecated. Use generateToken instead.')
}

export const verifyTokenSync = (token: string): JWTPayload => {
  throw new Error('verifyTokenSync is deprecated. Use verifyToken instead.')
}