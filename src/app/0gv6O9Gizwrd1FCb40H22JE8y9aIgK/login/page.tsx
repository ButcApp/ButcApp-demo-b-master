'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ThemeToggle } from '@/components/theme-toggle'
import { Captcha } from '@/components/ui/captcha'
import { useAuth } from '@/contexts/AdminAuthContext'

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    identifier: '', // Kullanıcı adı veya e-posta
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [captchaValid, setCaptchaValid] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Temporarily bypass captcha for debugging
    if (!captchaValid && false) {
      setError('Lütfen insan doğrulamasını tamamlayın')
      return
    }

    console.log('Submitting login form with:', { identifier: formData.identifier, captchaValid });
    
    try {
      const result = await login(formData.identifier, formData.password, captchaAnswer)
      console.log('Login result:', result);

      if (result.success) {
        console.log('Login successful, checking cookie...');
        
        // Cookie'nin set olup olmadığını kontrol et
        const cookies = document.cookie.split(';');
        const authTokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
        console.log('Cookie found:', !!authTokenCookie);
        if (authTokenCookie) {
          console.log('Cookie value:', authTokenCookie.split('=')[1]);
        }
        
        // State'in güncellenmesini bekle
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          router.push('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/dashboard');
        }, 1000);
      } else {
        console.log('Login failed:', result.error);
        setError(result.error || 'Giriş başarısız oldu')
      }
    } catch (error) {
      console.error('Login form error:', error);
      setError('Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mb-6">
            <Shield className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Admin Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Yönetim paneline hoş geldiniz
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-none">
          <CardContent className="space-y-6 pt-0">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium text-foreground">
                  Kullanıcı Adı veya E-posta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    value={formData.identifier}
                    onChange={handleInputChange}
                    placeholder="Admin kullanıcı adı veya e-posta"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Şifreniz"
                    className="pl-10 pr-10 h-11"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Captcha 
                onVerify={setCaptchaValid}
                onCaptchaChange={setCaptchaAnswer}
                error={error && !captchaValid ? 'İnsan doğrulaması gereklidir' : ''}
              />

              <Button
                type="submit"
                className="w-full h-11"
              >
                <div className="flex items-center">
                  <LogIn className="h-4 w-4 mr-2" />
                  Giriş Yap
                </div>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            <a 
              href="/" 
              className="text-foreground hover:text-muted-foreground font-medium transition-colors"
            >
              ← Ana Sayfaya Dön
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}