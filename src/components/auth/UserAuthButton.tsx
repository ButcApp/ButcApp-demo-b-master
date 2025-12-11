'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Shield, Trash2, RefreshCw, Crown } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

// Token'ı cookie'e set etme fonksiyonu
const setTokenCookie = (tokenValue: string) => {
  document.cookie = `auth-token=${tokenValue}; path=/; max-age=${24 * 60 * 60}; samesite=lax`
}

interface UserAuthButtonProps {
  onSignInClick?: () => void
  onSignUpClick?: () => void
}

export function UserAuthButton({ onSignInClick, onSignUpClick }: UserAuthButtonProps) {
  const { t } = useLanguage()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdminCheckLoading, setIsAdminCheckLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleGoToApp = () => {
    router.push('/app')
  }

  const handleGoToSettings = () => {
    router.push('/app/settings')
  }

  const handleDeleteAccount = () => {
    router.push('/app/settings?tab=security&action=delete')
  }

  const handleResetData = () => {
    router.push('/app/settings?tab=security&action=reset')
  }

  // Check if user has admin access
  const checkAdminAccess = async () => {
    if (!user?.email) return
    
    setIsAdminCheckLoading(true)
    try {
      // Get auth token from localStorage (using the same key as ClientAuthService)
      const token = localStorage.getItem('auth_token')
      console.log('🔍 Admin access check - Token exists:', !!token)
      console.log('🔍 Admin access check - User email:', user.email)
      console.log('🔍 Admin access check - Token length:', token?.length || 0)
      
      if (!token) {
        console.error('❌ No auth token found in localStorage')
        return
      }
      
      const response = await fetch('/api/admin-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.email })
      })
      
      console.log('🔍 Admin access response status:', response.status)
      const data = await response.json()
      console.log('🔍 Admin access response data:', data)
      
      if (data.success && data.isAdmin) {
        setIsAdmin(true)
        console.log('✅ User is admin:', user.email)
      } else {
        setIsAdmin(false)
        console.log('❌ User is not admin or error:', data.error)
      }
    } catch (error) {
      console.error('❌ Admin access check failed:', error)
    } finally {
      setIsAdminCheckLoading(false)
    }
  }

  // Handle admin panel access
  const handleAdminPanelAccess = async () => {
    if (!user?.email) return
    
    setIsAdminCheckLoading(true)
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token')
      console.log('🔍 Admin panel access - Token exists:', !!token)
      console.log('🔍 Admin panel access - User email:', user.email)
      
      if (!token) {
        console.error('❌ No auth token found for admin panel access')
        setIsAdminCheckLoading(false)
        return
      }
      
      const response = await fetch('/api/admin-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.email })
      })
      
      console.log('🔍 Admin panel access response status:', response.status)
      const data = await response.json()
      console.log('🔍 Admin panel access response data:', data)
      
      if (data.success && data.isAdmin) {
        // Store admin user info in localStorage
        localStorage.setItem('adminUser', JSON.stringify(data.user))
        
        // Use the token returned from API (it's the current user token)
        const adminToken = data.data.token
        localStorage.setItem('adminToken', adminToken)
        sessionStorage.setItem('adminToken', adminToken)
        
        // Also try to set cookie as backup
        setTokenCookie(adminToken)
        
        console.log('Admin access: Token stored in all storages for admin access')
        
        // Set cookie for middleware to read
        document.cookie = `auth_token=${adminToken}; path=/; max-age=86400; SameSite=Lax;`
        console.log('🍪 Set auth_token cookie for admin access')
        
        // Redirect to admin panel with the token
        router.push(`/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/dashboard?token=${adminToken}`)
      } else {
        alert('Admin paneline erişim izniniz bulunmuyor.')
      }
    } catch (error) {
      console.error('Admin panel access failed:', error)
      alert('Admin paneline erişim sağlanırken bir hata oluştu.')
    } finally {
      setIsAdminCheckLoading(false)
    }
  }

  // Check admin access when component mounts or user changes
  useEffect(() => {
    if (user?.email) {
      console.log('🔍 UserAuthButton useEffect - User email:', user.email)
      console.log('🔍 UserAuthButton useEffect - Checking localStorage for token...')
      
      // List all localStorage items
      if (typeof window !== 'undefined') {
        console.log('🔍 localStorage items:')
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          const value = localStorage.getItem(key || '')
          console.log(`  - ${key}: ${value?.substring(0, 20)}${value && value.length > 20 ? '...' : ''}`)
        }
      }
      
      checkAdminAccess()
    }
  }, [user?.email])

  // Check if user is currently in the app
  const isInApp = pathname.startsWith('/app')

  if (user) {
    // User is logged in
    const userInitials = user.email?.charAt(0).toUpperCase() || 'U'
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={userName} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isInApp && (
            <DropdownMenuItem onClick={handleGoToApp}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Uygulamaya Git</span>
            </DropdownMenuItem>
          )}
          
          {/* Admin Panel Access - Only show if user has admin privileges */}
          {isAdmin && (
            <DropdownMenuItem onClick={handleAdminPanelAccess} disabled={isAdminCheckLoading}>
              <Crown className="mr-2 h-4 w-4" />
              <span>{isAdminCheckLoading ? 'Yönlendiriliyor...' : 'Admin Paneli'}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleGoToSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('auth.settings') || 'Ayarlar'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetData} className="text-orange-600">
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Verileri Sıfırla</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeleteAccount} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Hesabı Sil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('auth.signOut') || 'Çıkış Yap'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // User is not logged in
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={onSignInClick}>
        {t('auth.signIn') || 'Giriş Yap'}
      </Button>
      <Button onClick={onSignUpClick}>
        {t('auth.signUp') || 'Kayıt Ol'}
      </Button>
    </div>
  )
}