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
      // Get auth token from localStorage
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/admin-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: user.email })
      })
      
      const data = await response.json()
      if (data.success) {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error('Admin access check failed:', error)
    } finally {
      setIsAdminCheckLoading(false)
    }
  }

  // Handle admin panel access
  const handleAdminPanelAccess = async () => {
    if (!user?.email) return
    
    setIsAdminCheckLoading(true)
    try {
      const response = await fetch('/api/admin-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store admin user info in localStorage and sessionStorage
        localStorage.setItem('adminUser', JSON.stringify(data.data.adminUser))
        localStorage.setItem('adminToken', data.data.token)
        sessionStorage.setItem('adminToken', data.data.token)
        
        // Also try to set cookie as backup
        setTokenCookie(data.data.token)
        
        console.log('Admin access: Token stored in all storages')
        
        // Redirect to admin panel with token in URL
        router.push(`/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/dashboard?token=${data.data.token}`)
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