'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
  name?: string
  role: string
  lastLogin?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (identifier: string, password: string, captchaAnswer?: string) => Promise<{ success: boolean; error?: string; token?: string }>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Token'ı cookie'e set etme fonksiyonu
  const setTokenCookie = (tokenValue: string) => {
    document.cookie = `auth-token=${tokenValue}; path=/; max-age=${24 * 60 * 60}; samesite=lax;`
  }

  // Token'ı her iki yere de set etme fonksiyonu
  const setTokenBoth = (tokenValue: string) => {
    localStorage.setItem('adminToken', tokenValue)
    setTokenCookie(tokenValue)
  }

  useEffect(() => {
    // Sayfa yüklendiğinde tüm storage'lardan token ve user bilgisini al
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1]
    const storedToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
    const storedUser = localStorage.getItem('adminUser')

    console.log('AdminAuthContext: Checking tokens...')
    console.log('Cookie token:', cookieToken ? 'Found' : 'Not found')
    console.log('Stored token:', storedToken ? 'Found' : 'Not found')
    console.log('Stored user:', storedUser ? 'Found' : 'Not found')

    // Use cookie token first, fallback to stored token
    const token = cookieToken || storedToken
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setToken(token)
        setUser(user)
        console.log('AdminAuthContext: Authentication restored successfully')
        
        // Tüm storage'lara token'ı kaydet
        localStorage.setItem('adminToken', token)
        sessionStorage.setItem('adminToken', token)
        setTokenCookie(token)
        console.log('AdminAuthContext: Token synced to all storages')
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('adminUser')
        localStorage.removeItem('adminToken')
        sessionStorage.removeItem('adminToken')
        document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan1970 00:00:00 GMT'
      }
    } else {
      console.log('AdminAuthContext: No authentication data found')
    }
    setIsLoading(false)
  }, [])

  // Router events ile token persist sağla - DEAKTİF EDİLDİ
  // useEffect(() => {
  //   if (!token) return
    
  //   const handleRouteChange = () => {
  //     setTokenCookie(token)
  //     console.log('AdminAuthContext: Token reset on route change')
  //   }

  //   // Next.js 13+ için router events
  //   if (typeof window !== 'undefined' && 'navigation' in window) {
  //     window.navigation.addEventListener('navigate', handleRouteChange)
      
  //     // Interval ile token'ı güncel tut
  //     const interval = setInterval(() => {
  //       setTokenCookie(token)
  //     }, 5000) // 5 saniyede bir
      
  //     return () => {
  //       window.navigation.removeEventListener('navigate', handleRouteChange)
  //       clearInterval(interval)
  //     }
  //   }
    
  //   // Navigation API yoksa sadece interval kullan
  //   const interval = setInterval(() => {
  //     setTokenCookie(token)
  //   }, 5000)
    
  //   return () => {
  //     clearInterval(interval)
  //   }
  // }, [token])

  const login = useCallback(async (identifier: string, password: string, captchaAnswer?: string) => {
    try {
      console.log('=== LOGIN DEBUG ===');
      console.log('Identifier:', identifier);
      console.log('Password provided:', !!password);
      
      // Gerçek auth endpoint'ini dene
      console.log('Trying auth endpoint...');
      const apiPath = '/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/api/auth';
      
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password, captchaAnswer: captchaAnswer?.trim() || null }),
        cache: 'no-store'
      });

      console.log('Auth response status:', response.status);
      console.log('Auth response OK:', response.ok);
      console.log('Auth response headers:', response.headers);

      // Response text'ini önce al
      const responseText = await response.text();
      console.log('Raw response text:', responseText);

      if (!response.ok) {
        console.error('HTTP Error Response:', responseText);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      // JSON parse et
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Parsed response data:', data);

      if (data.success) {
        const { user: userData, token } = data.data
        
        // Token ve user bilgisini state'e ve tüm storage'lara kaydet
        setToken(token)
        setUser(userData)
        localStorage.setItem('adminUser', JSON.stringify(userData))
        localStorage.setItem('adminToken', token)
        sessionStorage.setItem('adminToken', token)
        
        // Cookie'ye token'ı kaydet (middleware için)
        setTokenCookie(token)

        console.log('Login successful, user data set:', userData);
        console.log('Token set successfully');

        return { success: true, token }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);
      return { success: false, error: 'Sunucu ile bağlantı kurulamadı: ' + (error as Error).message }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('adminUser')
    localStorage.removeItem('adminToken')
    sessionStorage.removeItem('adminToken')
    
    // Cookie'den token'ı sil
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan1970 00:00:00 GMT'
    
    router.push('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/login')
  }, [])

  const isAuthenticated = !!user && !!token

  const contextValue = useMemo(() => ({
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated
  }), [user, token, login, logout, isLoading, isAuthenticated])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}