'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, TrendingUp, PiggyBank, Users, CheckCircle, BarChart3, Lock, Zap, HelpCircle, X, Mail, Send, AlertCircle, CheckCircle2, BookOpen, ExternalLink, Share } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { UserAuthButton } from '@/components/auth/UserAuthButton'
import { AuthModal } from '@/components/auth/AuthModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'

// Schema.org yapısal verileri
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Butcap",
  "description": "Butcap ile nakit, birikim ve banka hesaplarınızı tek yerden yönetin. Ücretsiz, güvenli ve modern kişisel finans uygulaması.",
  "url": "https://butcapp.com",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "TRY"
  },
  "creator": {
    "@type": "Organization",
    "name": "Butcap Team",
    "url": "https://butcapp.com"
  },
  "featureList": [
    "Kişisel finans yönetimi",
    "Nakit takibi",
    "Banka hesabı yönetimi",
    "Birikim takibi",
    "Bütçe analizi",
    "Otomatik işlemler",
    "Finansal raporlar"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1000"
  },
  "inLanguage": "tr-TR",
  "datePublished": "2025-01-01",
  "dateModified": "2025-01-01"
}

export default function HomePage() {
  const { t } = useLanguage()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authDefaultTab, setAuthDefaultTab] = useState<'signin' | 'signup'>('signup')
  
  // İletişim form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: t('contact.suggestion')
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // Redirect authenticated users to /app
  useEffect(() => {
    if (!loading && user) {
      router.push('/app')
    }
  }, [user, loading, router])
  
  // Don't render anything while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  // Don't render the home page for authenticated users (they will be redirected)
  if (user) {
    return null
  }

  // Auth modal açma fonksiyonları
  const openSignInModal = () => {
    setAuthDefaultTab('signin')
    setShowAuthModal(true)
  }

  const openSignUpModal = () => {
    setAuthDefaultTab('signup')
    setShowAuthModal(true)
  }

  // Form verilerini güncelle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Formu Formspree ile gönder
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const form = e.target as HTMLFormElement
      const formData = new FormData(form)
      
      // Formspree'ye gönder
      const response = await fetch('https://formspree.io/f/mzzwpgar', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        setSubmitStatus('success')
        setTimeout(() => {
          setShowContactDialog(false)
          setSubmitStatus('idle')
          // Formu sıfırla
          setFormData({
            name: '',
            email: '',
            subject: '',
            message: '',
            type: 'Öneri'
          })
          form.reset()
        }, 2000)
      } else {
        throw new Error('Form gönderilemedi. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.')
      }
      
    } catch (error) {
      console.error('Form gönderim hatası:', error)
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      id: 1,
      icon: PiggyBank,
      title: t('features.smartBalance'),
      description: t('features.smartBalanceDesc'),
      color: 'text-green-600'
    },
    {
      id: 2,
      icon: TrendingUp,
      title: t('features.autoTransactions'),
      description: t('features.autoTransactionsDesc'),
      color: 'text-blue-600'
    },
    {
      id: 3,
      icon: ArrowRight,
      title: t('features.instantTransfer'),
      description: t('features.instantTransferDesc'),
      color: 'text-purple-600'
    },
    {
      id: 4,
      icon: BarChart3,
      title: t('features.detailedReports'),
      description: t('features.detailedReportsDesc'),
      color: 'text-orange-600'
    }
  ]

  const stats = [
    { value: t('stats.secure'), icon: Lock },
    { value: t('stats.fast'), icon: Zap },
    { value: t('stats.simple'), icon: Users }
  ]

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-background transition-colors-slow">
      {/* Tema ve Dil Değiştirme Butonları */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <UserAuthButton onSignInClick={openSignInModal} onSignUpClick={openSignUpModal} />
        <LanguageToggle />
        <ThemeToggle />
      </div>
      
      {/* Hero Bölümü */}
      <section className="relative overflow-hidden">
        {/* Double Layer Opacity Gradient Background */}
        <div className="absolute inset-0">
          {/* Light Mode Gradient - Visible in light, hidden in dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 opacity-100 dark:opacity-0 transition-opacity duration-1000 ease-in-out"></div>
          
          {/* Dark Mode Gradient - Hidden in light, visible in dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-slate-950 opacity-0 dark:opacity-100 transition-opacity duration-1000 ease-in-out"></div>
        </div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 transition-opacity duration-1000">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center space-y-8">
            {/* Modern Logo */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-3xl blur-xl opacity-20 animate-pulse transition-colors-slow"></div>
                <div className="relative bg-card p-4 rounded-2xl shadow-2xl border border-border transition-colors-slow">
                  <img 
                    src="/favicon.png" 
                    alt="Butcap Logo" 
                    className="w-16 h-16"
                  />
                </div>
              </div>
            </div>
            
            {/* Modern Başlık */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground bg-clip-text text-transparent transition-colors-slow">
                  {t('home.title')}
                </span>
              </h1>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 blur-3xl opacity-20 transition-colors-slow"></div>
                <p className="relative text-lg sm:text-xl lg:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed transition-colors-slow">
                  <span className="text-green-600 dark:text-green-400 font-semibold transition-colors-slow">
                    {t('home.subtitle')}
                  </span>
                </p>
              </div>
            </div>

            {/* Modern CTA Butonları */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-6 sm:pt-8">
              <Button 
                size="lg" 
                className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-8 lg:px-12 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl transition-colors-fast min-h-[44px]"
                onClick={() => {
                  if (user) {
                    router.push('/app')
                  } else {
                    openSignInModal()
                  }
                }}
              >
                <span className="relative z-10 flex items-center">
                  {t('home.start')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-3 sm:pt-4">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-border text-muted-foreground hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl rounded-xl transition-colors-fast min-h-[44px]"
                onClick={() => router.push('/blog')}
              >
                <BookOpen className="mr-2 w-5 h-5" />
                Finans Rehberi
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
              
              <Button 
                size="lg" 
                variant="ghost" 
                onClick={() => setShowGuide(true)}
                className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 hover:bg-muted/50 rounded-xl transition-colors-fast min-h-[44px]"
              >
                <HelpCircle className="mr-2 w-5 h-5" />
                {t('home.howToUse')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Kullanım Rehberi Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('guide.title')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGuide(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Başlangıç */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">1</span>
                  {t('guide.quickStart')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.quickStartDesc')}
                </p>
              </div>

              {/* Hesap Yönetimi */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">2</span>
                  {t('guide.accountManagement')}
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p className="leading-relaxed">
                    {t('guide.accountManagementDesc')}
                  </p>
                  <div className="ml-4 space-y-2">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.cashAccount')}:</strong> {t('guide.cashAccountDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.bankAccount')}:</strong> {t('guide.bankAccountDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.savingsAccount')}:</strong> {t('guide.savingsAccountDesc')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* İşlem Ekleme */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">3</span>
                  {t('guide.addingTransactions')}
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p className="leading-relaxed">
                    {t('guide.addingTransactionsDesc')}
                  </p>
                  <div className="ml-4 space-y-2">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.addingIncome')}:</strong> {t('guide.addingIncomeDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.addingExpense')}:</strong> {t('guide.addingExpenseDesc')}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <strong>{t('guide.addingTransfer')}:</strong> {t('guide.addingTransferDesc')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Otomatik İşlemler */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">4</span>
                  {t('guide.autoTransactionsTitle')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.autoTransactionsDesc')}
                </p>
              </div>

              {/* Raporlama */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">5</span>
                  {t('guide.reporting')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.reportingDesc')}
                </p>
              </div>

              {/* Veri Güvenliği */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 flex items-center">
                  <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3 text-lg">6</span>
                  {t('guide.dataSecurity')}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {t('guide.dataSecurityDesc')}
                </p>
              </div>

              {/* İpuçları */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                  {t('guide.tips')}
                </h4>
                <ul className="space-y-2 text-green-700 dark:text-green-400">
                  <li>• {t('guide.tip1')}</li>
                  <li>• {t('guide.tip2')}</li>
                  <li>• {t('guide.tip3')}</li>
                  <li>• {t('guide.tip4')}</li>
                  <li>• {t('guide.tip5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Özellikler */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-background transition-all duration-700 ease-in-out">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="space-y-4">
              {/* Grid Stack Tekniği ile Başlık - Layout Shift Önleme */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight grid grid-cols-1 grid-rows-1">
                <span className="col-start-1 row-start-1 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent opacity-100 dark:opacity-0 transition-all duration-700 ease-in-out">
                  {t('features.title')}
                </span>
                <span className="col-start-1 row-start-1 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent opacity-0 dark:opacity-100 transition-all duration-700 ease-in-out">
                  {t('features.title')}
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed transition-all duration-700 ease-in-out">
                {t('features.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`group relative bg-card rounded-3xl p-8 border border-border shadow-lg hover:shadow-2xl transition-all duration-700 ease-in-out hover:scale-105 hover:-translate-y-2 cursor-pointer overflow-hidden ${
                  hoveredFeature === feature.id ? 'ring-2 ring-green-500/20' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {/* Senkronize Double Layer Background Gradient on Hover */}
                <div className="absolute inset-0">
                  {/* Light Mode Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 dark:opacity-0 transition-all duration-700 ease-in-out"></div>
                  {/* Dark Mode Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 to-emerald-950/20 opacity-0 dark:group-hover:opacity-100 transition-all duration-700 ease-in-out"></div>
                </div>
                
                {/* Icon Container */}
                <div className={`relative w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-700 ease-in-out group-hover:scale-110 ${
                  hoveredFeature === feature.id 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg' 
                    : 'bg-muted'
                }`}>
                  <feature.icon className={`w-8 h-8 transition-all duration-700 ease-in-out ${
                    hoveredFeature === feature.id ? 'text-white' : feature.color
                  }`} />
                </div>
                
                {/* Content */}
                <div className="relative space-y-4 text-center">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-700 ease-in-out">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm transition-all duration-700 ease-in-out">
                    {feature.description}
                  </p>
                </div>

                {/* Senkronize Double Layer Decorative Element */}
                <div className="absolute top-0 right-0 w-20 h-20">
                  {/* Light Mode Decorative Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 dark:opacity-0 transition-all duration-700 ease-in-out"></div>
                  {/* Dark Mode Decorative Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-full blur-2xl opacity-0 dark:group-hover:opacity-100 transition-all duration-700 ease-in-out"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Güven İndikatörleri */}
      <section className="py-20 px-6 bg-muted transition-colors-slow">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Neden Güvenilir?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Finansal verileriniz bizim için değerli. Güvenlik ve performans önceliğimiz.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="group text-center">
                <div className="relative mx-auto w-20 h-20 mb-6 bg-white dark:bg-gray-800 rounded-3xl shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 transition-colors-slow"></div>
                  <stat.icon className="relative w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {index === 0 ? 'Güvenlik' : index === 1 ? 'Performans' : 'Kullanım'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bölümü */}
      <section className="relative overflow-hidden">
        {/* Double Layer Opacity Gradient Background */}
        <div className="absolute inset-0">
          {/* Light Mode Green Gradient - Visible in light, hidden in dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 opacity-100 dark:opacity-0 transition-opacity duration-1000 ease-in-out"></div>
          
          {/* Dark Mode Green Gradient - Hidden in light, visible in dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800 opacity-0 dark:opacity-100 transition-opacity duration-1000 ease-in-out"></div>
        </div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 text-center">
          <div className="space-y-8">
            {/* Icon */}
            <div className="relative mx-auto w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
              <div className="absolute inset-0 bg-white/10 rounded-3xl animate-pulse"></div>
              <CheckCircle className="relative w-12 h-12 text-white" />
            </div>
            
            {/* Content */}
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                {t('cta.title')}
              </h2>
              
              <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                {t('cta.subtitle')}
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-8">
              <Link href="/app">
                <div className="group inline-block">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Button size="lg" className="relative bg-white text-green-600 hover:bg-gray-50 px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl">
                    {t('cta.freeStart')}
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Butcap
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('footer.copyright')}
          </p>
          
          {/* İletişim Linkleri */}
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setShowContactDialog(true)}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105"
            >
              <Mail className="mr-2 w-4 h-4" />
              {t('contact.title')}
            </Button>
            
            <Button 
              onClick={() => window.open('https://www.instagram.com/butcapp?igsh=dTdtZTR0cHhyb295', '_blank')}
              variant="outline"
              className="border-pink-300 dark:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-800 transition-all duration-300 hover:scale-105"
            >
              <Share className="mr-2 w-4 h-4 text-pink-600" />
              Instagram
            </Button>
          </div>
        </div>
      </footer>

      {/* İletişim Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  İletişim
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowContactDialog(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Durum Mesajı */}
                {submitStatus === 'success' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      Mesajınız başarıyla gönderildi! En kısa sürede yanıtlanacaktır.
                    </span>
                  </div>
                )}
                
                {submitStatus === 'error' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 dark:text-red-200 font-medium">
                      Form gönderilemedi. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.
                    </span>
                  </div>
                )}
                
                {/* Form Alanları */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ad Soyad *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Adınızı ve soyadınız"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        E-posta *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('contact.typeLabel')} *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Öneri">{t('contact.suggestion')}</option>
                        <option value="Şikayet">Şikayet</option>
                        <option value="Hata Bildirimi">Hata Bildirimi</option>
                        <option value="Özellik Talebi">Özellik Talebi</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('contact.subjectLabel')} *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={t('contact.subjectPlaceholder')}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('contact.messageLabel')} *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder={t('contact.messagePlaceholder')}
                    />
                  </div>
                </div>
                
                {/* Bilgilendirme */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-blue-800 dark:text-blue-200 text-sm">
                      <p className="font-medium mb-1">{t('contact.info')}</p>
                      <ul className="space-y-1 text-xs">
                        <li>• {t('contact.info1')}</li>
                        <li>• {t('contact.info2')}</li>
                        <li>• {t('contact.info3')}</li>
                        <li>• {t('contact.info4')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Butonlar */}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactDialog(false)}
                    disabled={isSubmitting}
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                  >
                    {t('contact.cancel')}
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center gap-2 transition-all duration-300 hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('contact.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('contact.send')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        defaultTab={authDefaultTab}
      />
    </div>
    </>
  )
}