import { AuthUser, AuthResponse } from './auth-types'

// Client-side authentication service (uses API routes)
export class ClientAuthService {
  static getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      // Use the current window location for relative URLs
      return window.location.origin
    }
    // Server-side fallback
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  private static async request<T>(endpoint: string, options: RequestInit): Promise<{ data?: T; error?: string }> {
    try {
      const response = await fetch(`${ClientAuthService.getBaseUrl()}${endpoint}`, options)

      // Check if response is OK first
      if (!response.ok) {
        // Try to get error details from response
        const contentType = response.headers.get('content-type')
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (jsonError) {
            console.warn('Failed to parse error response as JSON:', jsonError)
          }
        } else {
          // Read as text for non-JSON responses (HTML error pages, etc.)
          const text = await response.text()
          console.error('API Error - Non-JSON response:', response.status, text)
          errorMessage = `Server returned ${response.status}. Check console for details.`
        }
        
        return { error: errorMessage }
      }

      // Check Content-Type before parsing JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('API Error - Expected JSON but got:', response.status, text)
        return { error: `Server returned non-JSON response. Check console for details.` }
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('ClientAuthService: Request error:', error)
      return { error: `Network error: ${(error as Error).message}` }
    }
  }

  static async signUp(email: string, password: string, fullName?: string, captchaAnswer?: string): Promise<AuthResponse> {
    console.log('ClientAuthService: Starting signup for email:', email)
    
    const result = await this.request<any>('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        fullName: fullName?.trim() || null,
        captchaAnswer: captchaAnswer?.trim() || null,
      }),
    })

    if (result.error) {
      console.error('ClientAuthService: Signup failed:', result.error)
      return { error: result.error }
    }

    const data = result.data!
    console.log('ClientAuthService: Signup successful for:', email)

    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
    }

    return {
      user: data.user,
      token: data.token
    }
  }

  static async signIn(email: string, password: string, captchaAnswer?: string): Promise<AuthResponse> {
    console.log('ClientAuthService: Starting signin for email:', email)
    
    const result = await this.request<any>('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        captchaAnswer: captchaAnswer?.trim() || null,
      }),
    })

    if (result.error) {
      console.error('ClientAuthService: Signin failed:', result.error)
      return { error: result.error }
    }

    const data = result.data!
    console.log('ClientAuthService: Signin response:', data)
    console.log('ClientAuthService: Signin successful for:', email)

    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token)
    }

    return {
      user: data.user,
      token: data.token
    }
  }

  static async verifyToken(token: string): Promise<AuthUser | null> {
    console.log('ClientAuthService: Verifying token')
    
    const result = await this.request<{ user: AuthUser }>('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (result.error) {
      console.log('ClientAuthService: Token verification failed:', result.error)
      return null
    }

    const data = result.data!
    console.log('ClientAuthService: Token verification successful for:', data.user.email)
    return data.user
  }

  static async resetPassword(email: string): Promise<{ error?: string }> {
    const result = await this.request<any>('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
      }),
    })

    if (result.error) {
      return { error: result.error }
    }

    console.log(`Password reset requested for: ${email}`)
    return {}
  }

  static async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }): Promise<{ error?: string }> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return { error: 'Oturum bulunamadı' }
    }

    const result = await this.request<any>('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (result.error) {
      return { error: result.error }
    }

    return {}
  }

  static signOut(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      console.log('🔑 ClientAuthService.getToken():', token ? 'found' : 'not found')
      return token
    }
    console.log('🔑 ClientAuthService.getToken(): server environment, returning null')
    return null
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = this.getToken()
      if (!token) {
        console.log('ClientAuthService: No token found')
        return null
      }

      console.log('ClientAuthService: Getting current user with token')
      return await this.verifyToken(token)
    } catch (error) {
      console.error('ClientAuthService: Error getting current user:', error)
      return null
    }
  }
}