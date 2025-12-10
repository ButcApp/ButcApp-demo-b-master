'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowRightLeft, 
  Eye, 
  EyeOff,
  Calendar,
  DollarSign,
  PiggyBank,
  Building,
  Settings,
  BarChart3,
  Target,
  AlertCircle,
  Clock,
  Timer,
  Shield,
  Smartphone,
  FileText,
  Download,
  Upload,
  Menu,
  X,
  ChevronRight,
  CheckCircle,
  LineChart as LineChartIcon,
  Mail,
  Send,
  CheckCircle2,
  Share,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  Repeat,
  CreditCard,
  ShoppingCart,
  Home,
  Car,
  Heart,
  Zap,
  Sparkles,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { UserAuthButton } from '@/components/auth/UserAuthButton'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { dataSync } from '@/lib/data-sync'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area } from 'recharts'
import Link from 'next/link'
import EditRecurringDialog from '@/components/EditRecurringDialog'
import { MiniChart } from '@/components/ui/mini-chart'
import { CategorySummary } from '@/components/ui/category-summary'
import { useMobile } from '@/hooks/useMobile'
import { MobileCarousel } from '@/components/ui/mobile-carousel'
import { MobileModal } from '@/components/ui/mobile-modal'
import { MobileSheet } from '@/components/ui/mobile-sheet'
import { MobileNavigation } from '@/components/ui/mobile-navigation'

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  category: string
  description: string
  date: string
  account: 'cash' | 'bank' | 'savings'
  isRecurring?: boolean
  recurringId?: string
  transferFrom?: 'cash' | 'bank' | 'savings'
  transferTo?: 'cash' | 'bank' | 'savings'
}

interface RecurringTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  account: 'cash' | 'bank' | 'savings'
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  customFrequency?: string
  dayOfWeek?: number
  dayOfMonth?: number
  monthOfYear?: number
  startDate: string
  endDate?: string
  isActive: boolean
}

interface AccountBalances {
  cash: number
  bank: number
  savings: number
}

interface Note {
  id: string
  content: string
  date: string
  createdAt: string
  tags?: string[]
}

export default function ButcapApp() {
  const { t } = useLanguage()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [balances, setBalances] = useState<AccountBalances>({ cash: 0, bank: 0, savings: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [showRecurringDialog, setShowRecurringDialog] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showEditRecurringDialog, setShowEditRecurringDialog] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [showNotesSection, setShowNotesSection] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showAllNotesDialog, setShowAllNotesDialog] = useState(false)
  const [noteFilter, setNoteFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [showNavigationConfirmDialog, setShowNavigationConfirmDialog] = useState(false)
  const [balanceHidden, setBalanceHidden] = useState(false)
  
  // Notlar state
  const [notes, setNotes] = useState<Note[]>([])
  const [noteContent, setNoteContent] = useState('')
  const [noteTags, setNoteTags] = useState('')
  
  // Yeni işlem form state
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    category: '',
    description: '',
    account: 'cash' as 'cash' | 'bank' | 'savings',
    transferFrom: 'cash' as 'cash' | 'bank' | 'savings',
    transferTo: 'bank' as 'cash' | 'bank' | 'savings',
    transferAmount: '',
    transferDescription: ''
  })

  // Yeni tekrarlayan işlem form state
  const [newRecurring, setNewRecurring] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    account: 'cash' as 'cash' | 'bank' | 'savings',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
    dayOfWeek: 1,
    dayOfMonth: 1,
    monthOfYear: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  })

  const isMobile = useMobile()

  const checkAndApplyRecurringTransactions = useCallback(() => {
    if (!user) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    recurringTransactions.forEach(recurring => {
      if (!recurring.isActive) return

      const startDate = new Date(recurring.startDate)
      startDate.setHours(0, 0, 0, 0)
      
      if (startDate > today) return

      const datesToApply = getRecurringDates(recurring, startDate, today)
      
      datesToApply.forEach(date => {
        const dateStr = date.toISOString().split('T')[0]
        
        const alreadyApplied = transactions.some(t => 
          t.recurringId === recurring.id && 
          t.date.startsWith(dateStr)
        )

        if (!alreadyApplied) {
          addTransaction({
            type: recurring.type,
            amount: recurring.amount,
            category: recurring.category,
            description: `${recurring.description} (Otomatik)`,
            account: recurring.account,
            date: date.toISOString(),
            isRecurring: true,
            recurringId: recurring.id
          })
        }
      })
    })
  }, [user, recurringTransactions, transactions])

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) {
      alert('İşlem eklemek için lütfen giriş yapın.')
      return
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: `trans_${user?.id || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    setTransactions(prev => [newTransaction, ...prev])
    
    try {
      const transactionAdded = await dataSync.addTransaction(newTransaction)
      
      if (!transactionAdded) {
        setTransactions(prev => prev.filter(t => t.id !== newTransaction.id))
        alert('İşlem kaydedilemedi. Lütfen tekrar deneyin.')
        return
      }
    } catch (error) {
      console.error('❌ Transaction kaydedilirken hata:', error)
      setTransactions(prev => prev.filter(t => t.id !== newTransaction.id))
      alert('İşlem kaydedilemedi. Lütfen tekrar deneyin.')
      return
    }
    
    // Bakiyeleri güncelle
    if (transaction.type === 'transfer' && transaction.transferFrom && transaction.transferTo) {
      const newBalances = { ...balances }
      newBalances[transaction.transferFrom!] -= transaction.amount
      newBalances[transaction.transferTo!] += transaction.amount
      setBalances(newBalances)
      
      try {
        const balanceUpdated = await dataSync.updateBalances(newBalances)
        if (!balanceUpdated) {
          setBalances(balances)
          alert('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
        }
      } catch (error) {
        console.error('❌ Bakiyeler güncellenirken hata:', error)
        setBalances(balances)
        alert('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
      }
    } else {
      const newBalances = { ...balances }
      if (transaction.type === 'income') {
        newBalances[transaction.account] += transaction.amount
      } else if (transaction.type === 'expense') {
        newBalances[transaction.account] -= transaction.amount
      }
      setBalances(newBalances)
      
      try {
        const balanceUpdated = await dataSync.updateBalances(newBalances)
        if (!balanceUpdated) {
          setBalances(balances)
          alert('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
        }
      } catch (error) {
        console.error('❌ Bakiyeler güncellenirken hata:', error)
        setBalances(balances)
        alert('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
      }
    }
  }, [user, balances])

  // Verileri Supabase'den yükle
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        const balancesData = await dataSync.getBalances()
        const transactionsData = await dataSync.getTransactions()
        const recurringData = await dataSync.getRecurringTransactions()
        const notesData = await dataSync.getNotes()

        if (balancesData) {
          setBalances(balancesData)
          setIsFirstTime(false)
        }
        
        if (transactionsData) {
          setTransactions(transactionsData)
        }

        if (recurringData) {
          setRecurringTransactions(recurringData)
        }

        if (notesData) {
          setNotes(notesData)
        }
      } catch (error) {
        console.error('❌ Veriler yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Gizleme ayarını localStorage'dan yükle
  useEffect(() => {
    const savedHiddenState = localStorage.getItem('balanceHidden')
    if (savedHiddenState !== null) {
      setBalanceHidden(savedHiddenState === 'true')
    }
  }, [])

  // Tekrarlayan işlemleri kontrol et
  useEffect(() => {
    if (user && recurringTransactions.length > 0) {
      checkAndApplyRecurringTransactions()
    }
  }, [recurringTransactions.length, user])

  const getRecurringDates = (recurring: RecurringTransaction, startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = []
    let currentDate = new Date(startDate)

    switch (recurring.frequency) {
      case 'daily':
        while (currentDate <= endDate) {
          dates.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + 1)
        }
        break
        
      case 'weekly':
        if (recurring.dayOfWeek) {
          const jsDayOfWeek = recurring.dayOfWeek === 7 ? 0 : recurring.dayOfWeek
          
          while (currentDate.getDay() !== jsDayOfWeek && currentDate <= endDate) {
            currentDate.setDate(currentDate.getDate() + 1)
          }
          
          while (currentDate <= endDate) {
            dates.push(new Date(currentDate))
            currentDate.setDate(currentDate.getDate() + 7)
          }
        }
        break
        
      case 'monthly':
        const startDay = startDate.getDate()
        currentDate = new Date(startDate)
        
        while (currentDate <= endDate) {
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
          const dayToUse = Math.min(startDay, lastDayOfMonth)
          
          currentDate.setDate(dayToUse)
          if (currentDate >= startDate && currentDate <= endDate) {
            dates.push(new Date(currentDate))
          }
          
          currentDate.setMonth(currentDate.getMonth() + 1)
          currentDate.setDate(1)
        }
        break
        
      case 'yearly':
        currentDate = new Date(startDate)
        
        while (currentDate <= endDate) {
          if (currentDate >= startDate) {
            dates.push(new Date(currentDate))
          }
          currentDate.setFullYear(currentDate.getFullYear() + 1)
        }
        break
        
      case 'custom':
        currentDate = new Date(startDate)
        
        while (currentDate <= endDate) {
          if (currentDate >= startDate) {
            dates.push(new Date(currentDate))
          }
          currentDate.setDate(currentDate.getDate() + 30)
        }
        break
    }

    return dates
  }

  const handleInitialSetup = async (newBalances: AccountBalances) => {
    setBalances(newBalances)
    setIsFirstTime(false)
    
    try {
      const balanceUpdated = await dataSync.updateBalances(newBalances)
      if (!balanceUpdated) {
        console.error('Bakiyeler kaydedilemedi, state geri alınıyor')
        setBalances({ cash: 0, bank: 0, savings: 0 })
        setIsFirstTime(true)
        alert('Bakiyeler kaydedilemedi. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('Bakiyeler kaydedilirken hata:', error)
      setBalances({ cash: 0, bank: 0, savings: 0 })
      setIsFirstTime(true)
      alert('Bakiyeler kaydedilemedi. Lütfen tekrar deneyin.')
    }
  }

  const addRecurringTransaction = async () => {
    if (!user) {
      alert('Tekrarlayan işlem eklemek için lütfen giriş yapın.')
      return
    }

    const newRecurringTransaction: RecurringTransaction = {
      id: `recurring_${user?.id || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: newRecurring.type,
      amount: parseFloat(newRecurring.amount),
      category: newRecurring.category,
      description: newRecurring.description,
      account: newRecurring.account,
      frequency: newRecurring.frequency,
      dayOfWeek: newRecurring.frequency === 'weekly' ? newRecurring.dayOfWeek : undefined,
      dayOfMonth: newRecurring.frequency === 'monthly' ? newRecurring.dayOfMonth : undefined,
      monthOfYear: newRecurring.frequency === 'yearly' ? newRecurring.monthOfYear : undefined,
      startDate: newRecurring.startDate,
      endDate: newRecurring.endDate || undefined,
      isActive: true
    }

    try {
      const added = await dataSync.addRecurringTransaction(newRecurringTransaction)
      if (added) {
        setRecurringTransactions(prev => [...prev, newRecurringTransaction])
        setShowRecurringDialog(false)
        setNewRecurring({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          account: 'cash',
          frequency: 'monthly',
          dayOfWeek: 1,
          dayOfMonth: 1,
          monthOfYear: 1,
          startDate: new Date().toISOString().split('T')[0],
          endDate: ''
        })
      } else {
        alert('Tekrarlayan işlem kaydedilemedi. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('❌ Tekrarlayan işlem kaydedilirken hata:', error)
      alert('Tekrarlayan işlem kaydedilemedi. Lütfen tekrar deneyin.')
    }
  }

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) {
      alert('Lütfen tüm zorunlu alanları doldurun.')
      return
    }

    addTransaction({
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
      description: newTransaction.description,
      account: newTransaction.account,
      date: new Date().toISOString()
    })

    setNewTransaction({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      account: 'cash',
      transferFrom: 'cash',
      transferTo: 'bank',
      transferAmount: '',
      transferDescription: ''
    })
    setShowAddTransaction(false)
  }

  const handleAddTransfer = () => {
    if (!newTransaction.transferAmount || !newTransaction.transferDescription) {
      alert('Lütfen tüm zorunlu alanları doldurun.')
      return
    }

    addTransaction({
      type: 'transfer',
      amount: parseFloat(newTransaction.transferAmount),
      category: 'Transfer',
      description: newTransaction.transferDescription,
      account: newTransaction.transferFrom,
      date: new Date().toISOString(),
      transferFrom: newTransaction.transferFrom,
      transferTo: newTransaction.transferTo
    })

    setNewTransaction({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      account: 'cash',
      transferFrom: 'cash',
      transferTo: 'bank',
      transferAmount: '',
      transferDescription: ''
    })
    setShowTransferDialog(false)
  }

  const handleHeaderClick = () => {
    setShowNavigationConfirmDialog(true)
  }
  
  const handleNavigationConfirm = async () => {
    setShowNavigationConfirmDialog(false)
    
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
    
    window.location.href = '/'
  }

  const toggleBalanceHidden = () => {
    const newHiddenState = !balanceHidden
    setBalanceHidden(newHiddenState)
    localStorage.setItem('balanceHidden', newHiddenState.toString())
  }

  const totalBalance = balances.cash + balances.bank + balances.savings
  const filteredTransactions = selectedDate === 'all' 
    ? transactions 
    : transactions.filter(t => t.date.startsWith(selectedDate))

  const recentTransactions = filteredTransactions.slice(0, 5)

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyData = transactions
    .filter(t => t.type !== 'transfer')
    .reduce((acc, t) => {
      const month = new Date(t.date).toLocaleDateString('tr-TR', { month: 'short' })
      const existing = acc.find(item => item.month === month)
      if (existing) {
        if (t.type === 'income') {
          existing.income += t.amount
        } else {
          existing.expense += t.amount
        }
      } else {
        acc.push({
          month,
          income: t.type === 'income' ? t.amount : 0,
          expense: t.type === 'expense' ? t.amount : 0
        })
      }
      return acc
    }, [] as { month: string; income: number; expense: number }[])
    .slice(-6)

  // Mevcut ayın toplam giderini hesapla
  const currentMonth = new Date().toLocaleDateString('tr-TR', { month: 'short' })
  const currentMonthData = monthlyData.find(m => m.month === currentMonth)
  const currentMonthExpense = currentMonthData ? currentMonthData.expense : 0

  // Mevcut ayın toplam gelirini hesapla
  const currentMonthIncome = currentMonthData ? currentMonthData.income : 0

  const chartData = [
    { name: 'Nakit', value: balances.cash, color: '#10b981' },
    { name: 'Banka', value: balances.bank, color: '#3b82f6' },
    { name: 'Birikim', value: balances.savings, color: '#8b5cf6' }
  ]

  // Kategori ikonları
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes('market') || lowerCategory.includes('gıda')) return <ShoppingCart className="h-4 w-4" />
    if (lowerCategory.includes('ev') || lowerCategory.includes('kira')) return <Home className="h-4 w-4" />
    if (lowerCategory.includes('araba') || lowerCategory.includes('yakıt')) return <Car className="h-4 w-4" />
    if (lowerCategory.includes('sağlık') || lowerCategory.includes('hastane')) return <Heart className="h-4 w-4" />
    if (lowerCategory.includes('fatura') || lowerCategory.includes('elektrik') || lowerCategory.includes('su')) return <Zap className="h-4 w-4" />
    return <CreditCard className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ButcApp'e Hoş Geldiniz
            </CardTitle>
            <CardDescription className="text-gray-600">
              Başlamak için hesap bakiyelerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cash" className="text-sm font-medium text-gray-700">Nakit</Label>
              <Input
                id="cash"
                type="number"
                placeholder="0"
                value={balances.cash || ''}
                onChange={(e) => setBalances(prev => ({ ...prev, cash: parseFloat(e.target.value) || 0 }))}
                className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank" className="text-sm font-medium text-gray-700">Banka</Label>
              <Input
                id="bank"
                type="number"
                placeholder="0"
                value={balances.bank || ''}
                onChange={(e) => setBalances(prev => ({ ...prev, bank: parseFloat(e.target.value) || 0 }))}
                className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings" className="text-sm font-medium text-gray-700">Birikim</Label>
              <Input
                id="savings"
                type="number"
                placeholder="0"
                value={balances.savings || ''}
                onChange={(e) => setBalances(prev => ({ ...prev, savings: parseFloat(e.target.value) || 0 }))}
                className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <Button 
              onClick={() => handleInitialSetup(balances)}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg"
            >
              Başla
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 flex h-16 items-center">
          <button 
            onClick={handleHeaderClick}
            className="mr-4 flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">ButcApp</span>
          </button>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Button variant="ghost" size="sm" className="w-full justify-start text-gray-600 hover:text-gray-900">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ayarlar</span>
              </Button>
            </div>
            <nav className="flex items-center space-x-2">
              <ThemeToggle />
              <LanguageToggle />
              <UserAuthButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section - Total Balance */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Toplam Bakiye</h1>
                <p className="text-white/80">Finansal durumunuz</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBalanceHidden}
                className="text-white hover:bg-white/20"
              >
                {balanceHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
            </div>
            
            <div className="text-4xl font-bold mb-8">
              {balanceHidden ? '***.*** TL' : `${totalBalance.toLocaleString('tr-TR')} TL`}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Nakit</span>
                </div>
                <p className="text-xl font-bold">
                  {balanceHidden ? '***' : `${balances.cash.toLocaleString('tr-TR')} TL`}
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Banka</span>
                </div>
                <p className="text-xl font-bold">
                  {balanceHidden ? '***' : `${balances.bank.toLocaleString('tr-TR')} TL`}
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-purple-400 rounded-lg flex items-center justify-center">
                    <PiggyBank className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Birikim</span>
                </div>
                <p className="text-xl font-bold">
                  {balanceHidden ? '***' : `${balances.savings.toLocaleString('tr-TR')} TL`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
            <DialogTrigger asChild>
              <Button className="h-20 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">İşlem Ekle</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni İşlem</DialogTitle>
                <DialogDescription>
                  Gelir veya gider işlemi ekleyin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İşlem Tipi</Label>
                    <Select
                      value={newTransaction.type}
                      onValueChange={(value: 'income' | 'expense') => 
                        setNewTransaction(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Gelir</SelectItem>
                        <SelectItem value="expense">Gider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hesap</Label>
                    <Select
                      value={newTransaction.account}
                      onValueChange={(value: 'cash' | 'bank' | 'savings') => 
                        setNewTransaction(prev => ({ ...prev, account: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Nakit</SelectItem>
                        <SelectItem value="bank">Banka</SelectItem>
                        <SelectItem value="savings">Birikim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tutar</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Input
                    placeholder="Örn: Market, Yakıt, Maaş"
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    placeholder="İsteğe bağlı"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <Button onClick={handleAddTransaction} className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Ekle
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <DialogTrigger asChild>
              <Button className="h-20 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRightLeft className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Transfer</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Hesap Transferi</DialogTitle>
                <DialogDescription>
                  Hesaplar arasında para transferi yapın
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kaynak Hesap</Label>
                    <Select
                      value={newTransaction.transferFrom}
                      onValueChange={(value: 'cash' | 'bank' | 'savings') => 
                        setNewTransaction(prev => ({ ...prev, transferFrom: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Nakit</SelectItem>
                        <SelectItem value="bank">Banka</SelectItem>
                        <SelectItem value="savings">Birikim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hedef Hesap</Label>
                    <Select
                      value={newTransaction.transferTo}
                      onValueChange={(value: 'cash' | 'bank' | 'savings') => 
                        setNewTransaction(prev => ({ ...prev, transferTo: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Nakit</SelectItem>
                        <SelectItem value="bank">Banka</SelectItem>
                        <SelectItem value="savings">Birikim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tutar</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTransaction.transferAmount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, transferAmount: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    placeholder="Transfer açıklaması"
                    value={newTransaction.transferDescription}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, transferDescription: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <Button onClick={handleAddTransfer} className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Transfer Et
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
            <DialogTrigger asChild>
              <Button className="h-20 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 group">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Repeat className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Tekrarlayan</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tekrarlayan İşlem</DialogTitle>
                <DialogDescription>
                  Otomatik tekrar eden işlem ekleyin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İşlem Tipi</Label>
                    <Select
                      value={newRecurring.type}
                      onValueChange={(value: 'income' | 'expense') => 
                        setNewRecurring(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Gelir</SelectItem>
                        <SelectItem value="expense">Gider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hesap</Label>
                    <Select
                      value={newRecurring.account}
                      onValueChange={(value: 'cash' | 'bank' | 'savings') => 
                        setNewRecurring(prev => ({ ...prev, account: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Nakit</SelectItem>
                        <SelectItem value="bank">Banka</SelectItem>
                        <SelectItem value="savings">Birikim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tutar</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newRecurring.amount}
                    onChange={(e) => setNewRecurring(prev => ({ ...prev, amount: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Input
                    placeholder="Örn: Kira, Fatura, Maaş"
                    value={newRecurring.category}
                    onChange={(e) => setNewRecurring(prev => ({ ...prev, category: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    placeholder="İşlem açıklaması"
                    value={newRecurring.description}
                    onChange={(e) => setNewRecurring(prev => ({ ...prev, description: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Periyot</Label>
                    <Select
                      value={newRecurring.frequency}
                      onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => 
                        setNewRecurring(prev => ({ ...prev, frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Günlük</SelectItem>
                        <SelectItem value="weekly">Haftalık</SelectItem>
                        <SelectItem value="monthly">Aylık</SelectItem>
                        <SelectItem value="yearly">Yıllık</SelectItem>
                        <SelectItem value="custom">Özel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={newRecurring.startDate}
                      onChange={(e) => setNewRecurring(prev => ({ ...prev, startDate: e.target.value }))}
                      className="h-12"
                    />
                  </div>
                </div>
                <Button onClick={addRecurringTransaction} className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Ekle
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="h-20 bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 group"
            onClick={() => router.push('/app/investments')}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Yatırımlar</span>
            </div>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium mb-1">Toplam Gelir</p>
                  <p className="text-3xl font-bold text-green-700">
                    {income.toLocaleString('tr-TR')} TL
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    Bu ay: {currentMonthIncome.toLocaleString('tr-TR')} TL
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium mb-1">Toplam Gider</p>
                  <p className="text-3xl font-bold text-red-700">
                    {totalExpense.toLocaleString('tr-TR')} TL
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    Bu ay: {(currentMonthData ? currentMonthData.expense : 0).toLocaleString('tr-TR')} TL
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Bakiye Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('tr-TR')} TL`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-6 mt-4">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-800">Aylık Gelir/Gider</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('tr-TR')} TL`} />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Gelir" />
                  <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Gider" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Son İşlemler</CardTitle>
            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
              Tümünü Gör
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Henüz işlem bulunmuyor</p>
                  <p className="text-gray-400 text-sm mt-1">İlk işleminizi eklemek için yukarıdaki butonları kullanın</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                        transaction.type === 'expense' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUp className="h-6 w-6 text-white" />
                        ) : transaction.type === 'expense' ? (
                          <ArrowDown className="h-6 w-6 text-white" />
                        ) : (
                          <ArrowRightLeft className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-800">{transaction.category}</p>
                          <div className="text-gray-400">
                            {getCategoryIcon(transaction.category)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        transaction.type === 'income' ? 'text-green-600' : 
                        transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : 
                         transaction.type === 'expense' ? '-' : ''} 
                        {transaction.amount.toLocaleString('tr-TR')} TL
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(transaction.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Navigation Confirmation Dialog */}
      <Dialog open={showNavigationConfirmDialog} onOpenChange={setShowNavigationConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ana Sayfaya Dön</DialogTitle>
            <DialogDescription>
              Ana sayfaya dönmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowNavigationConfirmDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleNavigationConfirm}>
              Ana Sayfaya Dön
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}