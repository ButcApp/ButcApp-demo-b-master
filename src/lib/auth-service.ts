import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

// Hardcoded Supabase configuration
const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'butcapp-secret-key-change-in-production-2024'
)

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
}

export interface AuthResponse {
  user?: AuthUser
  token?: string
  error?: string
}

export class AuthService {
  // Password validation function
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Şifre en az 8 karakter olmalıdır')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Şifre en az bir büyük harf içermelidir')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Şifre en az bir küçük harf içermelidir')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Şifre en az bir rakam içermelidir')
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Şifre en az bir özel karakter içermelidir (!@#$%^&*()_+-=[]{}|;:,.<>?)')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static async signUp(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    try {
      console.log('AuthService: Starting signup for email:', email)
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { error: 'Geçerli bir e-posta adresi giriniz' }
      }
      
      // Validate password
      const passwordValidation = this.validatePassword(password)
      if (!passwordValidation.isValid) {
        return { error: passwordValidation.errors.join(', ') }
      }
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .limit(1)

      if (checkError) {
        console.error('AuthService: Error checking existing user:', checkError)
        return { error: 'Veritabanı hatası' }
      }

      if (existingUser && existingUser.length > 0) {
        console.log('AuthService: User already exists:', email)
        return { error: 'Bu e-posta adresi zaten kayıtlı. Lütfen farklı bir e-posta adresi kullanın veya giriş yapın.' }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12)

      // Create user
      console.log(`[${Date.now()}] AuthService: Starting user creation for email:`, email)
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date()
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email.toLowerCase().trim(),
          passwordhash: passwordHash,
          fullname: fullName?.trim() || null,
          createdat: now.toISOString(),
          updatedat: now.toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error('AuthService: Error creating user:', insertError)
        return { error: 'Kullanıcı oluşturulamadı' }
      }
      
      console.log(`[${Date.now()}] AuthService: Completed user creation for userId:`, newUser.id)

      // Create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userid: newUser.id,
          email: newUser.email,
          fullname: newUser.fullname,
          createdat: now.toISOString(),
          updatedat: now.toISOString(),
        })

      if (profileError) {
        console.error('AuthService: Error creating profile:', profileError)
      }

      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('userid', newUser.id)
        .limit(1)

      // Generate token
      const token = await new SignJWT({
        userId: newUser.id,
        email: newUser.email,
        role: adminUser && adminUser.length > 0 ? 'admin' : 'user'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET)

      console.log('AuthService: Signup successful for:', email)

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullname || undefined,
          avatarUrl: newUser.avatarurl || undefined,
        },
        token
      }
    } catch (error) {
      console.error('AuthService: Signup error:', error)
      return { error: (error as Error).message }
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('AuthService: Starting signin for email:', email)
      
      // Find user
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .limit(1)

      if (findError) {
        console.error('AuthService: Error finding user:', findError)
        return { error: 'Veritabanı hatası' }
      }

      if (!user || user.length === 0) {
        console.log('AuthService: User not found:', email)
        return { error: 'E-posta veya şifre hatalı' }
      }

      const userData = user[0]

      // Check password
      const isValidPassword = await bcrypt.compare(password, userData.passwordhash)
      if (!isValidPassword) {
        console.log('AuthService: Invalid password for:', email)
        return { error: 'E-posta veya şifre hatalı' }
      }

      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('userid', userData.id)
        .limit(1)

      // Generate token
      const token = await new SignJWT({
        userId: userData.id,
        email: userData.email,
        role: adminUser && adminUser.length > 0 ? 'admin' : 'user'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET)

      console.log('AuthService: Signin successful for:', email)

      return {
        user: {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullname || undefined,
          avatarUrl: userData.avatarurl || undefined,
        },
        token
      }
    } catch (error) {
      console.error('AuthService: Signin error:', error)
      return { error: (error as Error).message }
    }
  }

  static async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      console.log('AuthService: Verifying token')
      
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const decoded = payload as { userId: string; email: string; role?: string; id?: string }
      
      // Find user in database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId || decoded.id)
        .limit(1)

      if (error) {
        console.error('AuthService: Error finding user for token:', error)
        return null
      }

      if (user && user.length > 0) {
        console.log('AuthService: Token verification successful for:', user[0].email)
        return {
          id: user[0].id,
          email: user[0].email,
          fullName: user[0].fullname || undefined,
          avatarUrl: user[0].avatarurl || undefined,
        }
      }

      console.log('AuthService: User not found for token verification')
      return null
    } catch (error) {
      console.error('AuthService: Token verification error:', error)
      return null
    }
  }

  static async verifyTokenForAPI(request: NextRequest): Promise<{ success: boolean; user?: AuthUser }> {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false }
      }

      const token = authHeader.substring(7)
      if (!token) {
        return { success: false }
      }

      const user = await this.verifyToken(token)
      if (!user) {
        return { success: false }
      }

      return { success: true, user }
    } catch (error) {
      console.error('AuthService: API token verification error:', error)
      return { success: false }
    }
  }

  static async resetPassword(email: string): Promise<{ error?: string }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .limit(1)

      if (error) {
        console.error('AuthService: Error finding user for password reset:', error)
        return { error: 'Veritabanı hatası' }
      }

      if (!user || user.length === 0) {
        return { error: 'Bu e-posta adresi kayıtlı değil' }
      }

      // In a real app, you would send an email here
      // For now, we'll just return success
      console.log(`Password reset requested for: ${email}`)
      return {}
    } catch (error) {
      console.error('AuthService: Password reset error:', error)
      return { error: (error as Error).message }
    }
  }

  static async updatePassword(userId: string, newPassword: string, currentPassword: string): Promise<{ error?: string }> {
    try {
      // Find user
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1)

      if (findError) {
        console.error('AuthService: Error finding user for password update:', findError)
        return { error: 'Veritabanı hatası' }
      }

      if (!user || user.length === 0) {
        console.log('AuthService: User not found for password update:', userId)
        return { error: 'Kullanıcı bulunamadı' }
      }

      const userData = user[0]

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, userData.passwordhash)
      if (!isValidPassword) {
        console.log('AuthService: Invalid current password for:', userData.email)
        return { error: 'Mevcut şifre hatalı' }
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12)

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          passwordhash: newPasswordHash,
          updatedat: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('AuthService: Error updating password:', updateError)
        return { error: 'Şifre güncellenemedi' }
      }

      console.log('AuthService: Password updated successfully for:', userData.email)
      return {}
    } catch (error) {
      console.error('AuthService: Password update error:', error)
      return { error: (error as Error).message }
    }
  }

  static async updateProfile(userId: string, data: { fullName?: string; avatarUrl?: string }): Promise<{ error?: string }> {
    try {
      const updateData: any = {
        updatedat: new Date().toISOString(),
      }

      if (data.fullName) {
        updateData.fullname = data.fullName.trim()
      }
      if (data.avatarUrl) {
        updateData.avatarurl = data.avatarUrl.trim()
      }

      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('userid', userId)

      if (userError || profileError) {
        console.error('AuthService: Error updating profile:', { userError, profileError })
        return { error: 'Profil güncellenemedi' }
      }

      return {}
    } catch (error) {
      console.error('AuthService: Profile update error:', error)
      return { error: (error as Error).message }
    }
  }

  // Helper method to get current user from request (for API routes)
  static async getCurrentUserFromRequest(request: Request): Promise<AuthUser | null> {
    try {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('AuthService: No auth header or invalid format')
        return null
      }

      const token = authHeader.substring(7)
      if (!token) {
        console.log('AuthService: No token provided')
        return null
      }

      console.log('AuthService: Verifying token:', token.substring(0, 20) + '...')
      const user = await this.verifyToken(token)
      
      if (user) {
        console.log('AuthService: Token verification successful for user:', user.email)
      } else {
        console.log('AuthService: Token verification failed')
      }
      
      return user
    } catch (error) {
      console.error('AuthService: Error getting user from request:', error)
      console.error('AuthService: Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        authHeader: request.headers.get('authorization')
      })
      return null
    }
  }
}