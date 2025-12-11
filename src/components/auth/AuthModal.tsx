'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Captcha } from '@/components/ui/captcha'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const { t } = useLanguage()
  const { signIn, signUp, loading, user } = useAuth()
  
  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [signInError, setSignInError] = useState('')
  const [signInCaptchaValid, setSignInCaptchaValid] = useState(false)
  const [signInCaptchaAnswer, setSignInCaptchaAnswer] = useState('')
  
  // Sign Up form state
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpFullName, setSignUpFullName] = useState('')
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [signUpError, setSignUpError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [emailExistsWarning, setEmailExistsWarning] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [signUpCaptchaValid, setSignUpCaptchaValid] = useState(false)
  const [signUpCaptchaAnswer, setSignUpCaptchaAnswer] = useState('')
  const emailCheckTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Close modal if user is already logged in
  useEffect(() => {
    if (user && isOpen) {
      onClose()
    }
  }, [user, isOpen, onClose])

  // Modal açıldığında email warning'ı temizle
  useEffect(() => {
    if (isOpen) {
      setEmailExistsWarning(false)
      setIsCheckingEmail(false)
    }
  }, [isOpen])

  // Component unmount olduğunda timeout'u temizle
  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const validatePassword = (password: string) => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('En az 8 karakter')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('En az bir büyük harf')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('En az bir küçük harf')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('En az bir rakam')
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('En az bir özel karakter')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Email kontrol fonksiyonu
  const checkEmailExists = async (email: string) => {
    if (!validateEmail(email)) {
      setEmailExistsWarning(false)
      return
    }

    setIsCheckingEmail(true)
    
    try {
      const response = await fetch(`${window.location.origin}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })
      
      if (!response.ok) {
        // If API returns 404 or error, just continue without email check
        console.warn('Email check API not available, skipping:', response.status)
        setEmailExistsWarning(false)
        return
      }
      
      const data = await response.json()
      setEmailExistsWarning(data.exists || false)
    } catch (error) {
      console.error('Email check error:', error)
      // Don't show error to user, just skip email check
      setEmailExistsWarning(false)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Email input değişiminde kontrol et
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setSignUpEmail(email)
    
    // Önceki timeout'u temizle
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current)
    }
    
    // 500ms sonra kontrol et (debounce)
    emailCheckTimeoutRef.current = setTimeout(() => {
      checkEmailExists(email)
    }, 500)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError('')
    
    const trimmedEmail = signInEmail.trim()
    
    if (!validateEmail(trimmedEmail)) {
      setSignInError('Geçerli bir e-posta adresi girin')
      return
    }
    
    if (signInPassword.length < 1) {
      setSignInError('Şifre alanı boş bırakılamaz')
      return
    }

    if (!signInCaptchaValid) {
      setSignInError('Lütfen insan doğrulamasını tamamlayın')
      return
    }
    
    const { error } = await signIn(trimmedEmail, signInPassword, signInCaptchaAnswer)
    if (error) {
      setSignInError(error)
    } else {
      // Başarılı giriş - modalı kapat
      setSignInEmail('')
      setSignInPassword('')
      onClose()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError('')
    setSignUpSuccess(false)
    
    const trimmedEmail = signUpEmail.trim()
    const trimmedFullName = signUpFullName.trim()
    
    if (!validateEmail(trimmedEmail)) {
      setSignUpError('Geçerli bir e-posta adresi girin')
      return
    }
    
    // E-posta zaten varsa kayda etme
    if (emailExistsWarning) {
      setSignUpError('Bu e-posta adresi zaten kayıtlı. Lütfen farklı bir e-posta adresi kullanın.')
      return
    }

    if (!signUpCaptchaValid) {
      setSignUpError('Lütfen insan doğrulamasını tamamlayın')
      return
    }
    
    const passwordValidation = validatePassword(signUpPassword)
    if (!passwordValidation.isValid) {
      setSignUpError(`Şifre gereksinimleri: ${passwordValidation.errors.join(', ')}`)
      return
    }
    
    if (trimmedFullName.length < 2) {
      setSignUpError('Ad soyad en az 2 karakter olmalıdır')
      return
    }
    
    const { error } = await signUp(trimmedEmail, signUpPassword, trimmedFullName, signUpCaptchaAnswer)
    console.log('AuthModal: SignUp response error:', error)
    if (error) {
      setSignUpError(error)
    } else {
      setSignUpSuccess(true)
      // Reset form
      setSignUpEmail('')
      setSignUpPassword('')
      setSignUpFullName('')
      setEmailExistsWarning(false)
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        onClose()
        setSignUpSuccess(false)
      }, 2000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full max-w-md">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl"></div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        
        <Card className="relative border-0 bg-transparent shadow-none">
          <CardHeader className="text-center space-y-4 pb-6">
            {/* Modern Icon */}
            <div className="relative mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
              <svg className="relative w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {t('auth.welcome') || 'Hoş Geldiniz'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                {t('auth.description') || 'ButcApp hesabınıza giriş yapın veya yeni hesap oluşturun'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-5">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl h-10">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {t('auth.signIn') || 'Giriş Yap'}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {t('auth.signUp') || 'Kayıt Ol'}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-5">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('auth.email') || 'E-posta'}
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                      </div>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder') || 'ornek@email.com'}
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="pl-11 h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        required
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('auth.password') || 'Şifre'}
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                      </div>
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? 'text' : 'password'}
                        placeholder={t('auth.passwordPlaceholder') || '•••••'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="pl-11 pr-11 h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        required
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        disabled={loading}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Captcha 
                    onVerify={setSignInCaptchaValid}
                    onCaptchaChange={setSignInCaptchaAnswer}
                    disabled={loading}
                    error={signInError && !signInCaptchaValid ? 'İnsan doğrulaması gereklidir' : ''}
                  />

                  {signInError && (
                    <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 dark:bg-red-950/20">
                      <AlertDescription className="text-red-800 dark:text-red-200">{signInError}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('auth.signingIn') || 'Giriş Yapılıyor'}
                      </>
                    ) : (
                      t('auth.signIn') || 'Giriş Yap'
                    )}
                  </Button>
                </form>
              </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-fullname" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.fullName') || 'Ad Soyad'}
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <Input
                      id="signup-fullname"
                      type="text"
                      placeholder={t('auth.fullNamePlaceholder') || 'Ahmet Yılmaz'}
                      value={signUpFullName}
                      onChange={(e) => setSignUpFullName(e.target.value)}
                      className="pl-11 h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                      required
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.email') || 'E-posta'}
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder') || 'ornek@email.com'}
                      value={signUpEmail}
                      onChange={handleEmailChange}
                      className="pl-11 h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                    {isCheckingEmail && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Exists Warning Banner */}
                {emailExistsWarning && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-3 py-2 rounded-xl">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Bu e-posta adresi zaten kayıtlı!</p>
                        <p className="text-xs mt-1 opacity-90">Lütfen farklı bir e-posta adresi kullanın veya giriş yapın.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('auth.password') || 'Şifre'}
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder') || '••••••'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="pl-11 pr-11 h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                      required
                      minLength={8}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      disabled={loading}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Şifre gereksinimleri:</p>
                    <div className="text-xs text-gray-400 dark:text-gray-500 grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>8+ karakter</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>Büyük harf</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>Küçük harf</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>Rakam</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>Özel karakter (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Captcha 
                  onVerify={setSignUpCaptchaValid}
                  onCaptchaChange={setSignUpCaptchaAnswer}
                  disabled={loading}
                  error={signUpError && !signUpCaptchaValid ? 'İnsan doğrulaması gereklidir' : ''}
                />

                {signUpError && (
                  <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertDescription className="text-red-800 dark:text-red-200">{signUpError}</AlertDescription>
                  </Alert>
                )}

                {signUpSuccess && (
                  <Alert className="rounded-xl border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Kayıt başarılı! Hesabınız oluşturuldu ve giriş yapıldı.
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 border-0" 
                  disabled={loading || signUpSuccess}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('auth.signingUp') || 'Kayıt Yapılıyor'}
                    </>
                  ) : signUpSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Kayıt Başarılı
                    </>
                  ) : (
                    t('auth.signUp') || 'Kayıt Ol'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-6 py-2 transition-all duration-200" 
              disabled={loading}
            >
              {t('auth.cancel') || 'İptal'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
  )
}