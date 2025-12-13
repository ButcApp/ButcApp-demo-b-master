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
  MoreHorizontal,
  Laptop,
  Coffee,
  Edit,
  Trash2,
  Play,
  Pause
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
import { NotesButton } from '@/components/NotesButton'
import EnhancedRecurringTransactionsList from '@/components/ui/enhanced-recurring-transactions-list'
import { toast } from 'sonner'

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
  
  // All transactions modal state
  const [showAllTransactionsDialog, setShowAllTransactionsDialog] = useState(false)
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState('all')
  const [transactionDateFilter, setTransactionDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
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

  // Kategori listeleri
  const incomeCategories = [
    'Maaş',
    'Freelance',
    'Yatırım Geliri',
    'Kira Geliri',
    'Bonus',
    'Hediye',
    'Diğer Gelir'
  ]

  const expenseCategories = [
    'Market & Gıda',
    'Kira & Ev Giderleri',
    'Ulaşım & Yakıt',
    'Faturalar (Elektrik, Su, Doğalgaz)',
    'İnternet & Telefon',
    'Sağlık & İlaç',
    'Eğitim & Kurs',
    'Giyim & Alışveriş',
    'Eğlence & Sosyal',
    'Restoran & Kafe',
    'Spor & Salon',
    'Pet Shop & Evcil Hayvan',
    'Bakım & Onarım',
    'Sigorta',
    'Vergi & Resmi Ödemeler',
    'Diğer Giderler'
  ]

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
      toast.error('İşlem eklemek için lütfen giriş yapın.')
      return
    }

    // Bakiye kontrolü
    if (transaction.type === 'expense') {
      if (balances[transaction.account] < transaction.amount) {
        const accountName = transaction.account === 'cash' ? 'Nakit' : transaction.account === 'bank' ? 'Banka' : 'Birikim'
        const currentBalance = balances[transaction.account].toLocaleString('tr-TR')
        const requestedAmount = transaction.amount.toLocaleString('tr-TR')
        toast.error(`Yetersiz bakiye! ${accountName} hesabınızda sadece ${currentBalance} TL bulunuyor. ${requestedAmount} TL'lik işlem yapamazsınız.`, {
          duration: 5000
        })
        return
      }
    } else if (transaction.type === 'transfer' && transaction.transferFrom && transaction.transferTo) {
      if (balances[transaction.transferFrom] < transaction.amount) {
        const accountName = transaction.transferFrom === 'cash' ? 'Nakit' : transaction.transferFrom === 'bank' ? 'Banka' : 'Birikim'
        const currentBalance = balances[transaction.transferFrom].toLocaleString('tr-TR')
        const requestedAmount = transaction.amount.toLocaleString('tr-TR')
        toast.error(`Yetersiz bakiye! ${accountName} hesabınızda sadece ${currentBalance} TL bulunuyor. ${requestedAmount} TL transfer yapamazsınız.`, {
          duration: 5000
        })
        return
      }
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
        toast.error('İşlem kaydedilemedi. Lütfen tekrar deneyin.')
        return
      }
      
      // Başarılı işlem için toast göster
      if (transaction.type === 'income') {
        toast.success(`${transaction.amount.toLocaleString('tr-TR')} TL gelir başarıyla eklendi.`, {
          duration: 3000,
          position: 'top-center'
        })
      } else if (transaction.type === 'expense') {
        toast.success(`${transaction.amount.toLocaleString('tr-TR')} TL gider başarıyla eklendi.`, {
          duration: 3000,
          position: 'top-center'
        })
      } else if (transaction.type === 'transfer') {
        const fromAccount = transaction.transferFrom === 'cash' ? 'Nakit' : transaction.transferFrom === 'bank' ? 'Banka' : 'Birikim'
        const toAccount = transaction.transferTo === 'cash' ? 'Nakit' : transaction.transferTo === 'bank' ? 'Banka' : 'Birikim'
        toast.success(`${fromAccount} hesabından ${toAccount} hesabına ${transaction.amount.toLocaleString('tr-TR')} TL transfer yapıldı.`, {
          duration: 3000,
          position: 'top-center'
        })
      }
      
    } catch (error) {
      console.error('❌ Transaction kaydedilirken hata:', error)
      setTransactions(prev => prev.filter(t => t.id !== newTransaction.id))
      toast.error('İşlem kaydedilemedi. Lütfen tekrar deneyin.')
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
          toast.error('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
        } else {
          // Transfer başarılı mesajını zaten yukarıda ekledik
        }
      } catch (error) {
        console.error('❌ Bakiyeler güncellenirken hata:', error)
        setBalances(balances)
        toast.error('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
      }
    } else {
      const newBalances = { ...balances }
      if (transaction.type === 'income') {
        newBalances[transaction.account] += transaction.amount
      } else if (transaction.type === 'expense') {
        newBalances[transaction.account] -= transaction.amount
      } else if (transaction.type === 'transfer') {
        // Transfer için kaynak hesaptan düş, hedef hesaba ekle
        newBalances[transaction.account] -= transaction.amount // Kaynak hesaptan düş
        if (transaction.transferTo) {
          newBalances[transaction.transferTo] += transaction.amount // Hedef hesaba ekle
        }
      }
      setBalances(newBalances)
      
      try {
        const balanceUpdated = await dataSync.updateBalances(newBalances)
        if (!balanceUpdated) {
          setBalances(balances)
          toast.error('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
        } else {
          // Income/expense için success mesajları zaten yukarıda eklendi
        }
      } catch (error) {
        console.error('❌ Bakiyeler güncellenirken hata:', error)
        setBalances(balances)
        toast.error('Bakiyeler güncellenemedi. Lütfen tekrar deneyin.')
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
    checkAndApplyRecurringTransactions()
  }, [recurringTransactions.length, user, checkAndApplyRecurringTransactions])

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
        toast.error('Bakiyeler kaydedilemedi. Lütfen tekrar deneyin.')
      } else {
        toast.success('Bakiyeler başarıyla kaydedildi. Hoş geldiniz!', {
          duration: 4000
        })
      }
    } catch (error) {
      console.error('Bakiyeler kaydedilirken hata:', error)
      setBalances({ cash: 0, bank: 0, savings: 0 })
      setIsFirstTime(true)
      toast.error('Bakiyeler kaydedilemedi. Lütfen tekrar deneyin.')
    }

    // Test toast - basit bir test
    setTimeout(() => {
      console.log('Test toast çalıştırılıyor...')
      toast.success('Bu bir test mesajıdır!', {
        duration: 3000
      })
    }, 1000)
  }

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) {
      toast.error('İşlem silmek için lütfen giriş yapın.')
      return
    }

    console.log('Frontend attempting to delete recurring transaction:', id)
    console.log('Available transactions:', recurringTransactions.map(rt => ({ id: rt.id, category: rt.category })))
    console.log('Transaction to delete exists in state:', recurringTransactions.some(rt => rt.id === id))

    try {
      const deleted = await dataSync.deleteRecurringTransaction(id)
      if (deleted) {
        setRecurringTransactions(prev => prev.filter(rt => rt.id !== id))
        // State'i yenilemek için verileri tekrar yükle
        setTimeout(async () => {
          const refreshedTransactions = await dataSync.getRecurringTransactions()
          setRecurringTransactions(refreshedTransactions)
        }, 500)
      } else {
        toast.error('Tekrarlayan işlem silinemedi. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('❌ Tekrarlayan işlem silinirken hata:', error)
      toast.error('Tekrarlayan işlem silinemedi. Lütfen tekrar deneyin.')
    }
  }

  const updateRecurringTransaction = async (updatedTransaction: RecurringTransaction) => {
    if (!user) {
      toast.error('İşlem güncellemek için lütfen giriş yapın.')
      return
    }

    try {
      const updated = await dataSync.updateRecurringTransaction(updatedTransaction)
      if (updated) {
        setRecurringTransactions(prev => 
          prev.map(rt => rt.id === updatedTransaction.id ? updatedTransaction : rt)
        )
        setShowEditRecurringDialog(false)
        setEditingRecurring(null)
      } else {
        toast.error('Tekrarlayan işlem güncellenemedi. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('❌ Tekrarlayan işlem güncellenirken hata:', error)
      toast.error('Tekrarlayan işlem güncellenemedi. Lütfen tekrar deneyin.')
    }
  }

  const getNextOccurrence = (recurring: RecurringTransaction): Date | null => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startDate = new Date(recurring.startDate)
    startDate.setHours(0, 0, 0, 0)
    
    if (startDate > today) return startDate
    
    const dates = getRecurringDates(recurring, startDate, new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000))
    const futureDates = dates.filter(date => date >= today)
    
    return futureDates.length > 0 ? futureDates[0] : null
  }

  const getDaysUntil = (date: Date): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    
    const diffTime = targetDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleEditRecurring = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring)
    setShowEditRecurringDialog(true)
  }

  const toggleRecurringStatus = async (id: string, isActive: boolean) => {
    if (!user) return
    
    // Database'de isactive column'ı olmadığı için暂时 devre dışı
    toast.error('Özür: Bu özellik database güncellemesi gerektiriyor. Şimdilik tüm işlemler aktiftir.')
    return
    
    const recurring = recurringTransactions.find(rt => rt.id === id)
    if (!recurring) return
    
    const updatedRecurring = { 
      ...recurring, 
      isActive: !isActive,
      // API'nin beklediği tüm field'ları ekle
      amount: recurring.amount,
      description: recurring.description,
      category: recurring.category,
      frequency: recurring.frequency,
      startDate: recurring.startDate,
      endDate: recurring.endDate
    }
    
    try {
      const updated = await dataSync.updateRecurringTransaction(updatedRecurring)
      if (updated) {
        setRecurringTransactions(prev => 
          prev.map(rt => rt.id === id ? updatedRecurring : rt)
        )
      }
    } catch (error) {
      console.error('❌ Tekrarlayan işlem durumu güncellenirken hata:', error)
    }
  }

  const addRecurringTransaction = async () => {
    if (!user) {
      toast.error('Tekrarlayan işlem eklemek için lütfen giriş yapın.')
      return
    }

    // Form validasyonu
    if (!newRecurring.amount || newRecurring.amount.trim() === '' || 
        !newRecurring.category || newRecurring.category.trim() === '' || 
        !newRecurring.description || newRecurring.description.trim() === '' || 
        !newRecurring.frequency || 
        !newRecurring.startDate || newRecurring.startDate.trim() === '') {
      toast.error('Lütfen tüm zorunlu alanları doldurun: Tutar, Kategori, Açıklama, Periyot, Başlangıç Tarihi')
      console.log('Validation failed:', {
        amount: newRecurring.amount,
        category: newRecurring.category,
        description: newRecurring.description,
        frequency: newRecurring.frequency,
        startDate: newRecurring.startDate
      })
      return
    }

    const parsedAmount = parseFloat(newRecurring.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Lütfen geçerli bir tutar girin.')
      return
    }

    const newRecurringTransaction: RecurringTransaction = {
      id: `recurring_${user?.id || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: newRecurring.type,
      amount: parsedAmount,
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
      console.log('Frontend attempting to add recurring transaction:', newRecurringTransaction)
      const added = await dataSync.addRecurringTransaction(newRecurringTransaction)
      console.log('Add result:', added)
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
        toast.error('Tekrarlayan işlem kaydedilemedi. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('❌ Tekrarlayan işlem kaydedilirken hata:', error)
      toast.error('Tekrarlayan işlem kaydedilemedi. Lütfen tekrar deneyin.')
    }
  }

  const handleAddTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.')
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
    if (!newTransaction.transferAmount) {
      toast.error('Lütfen tutar girin.')
      return
    }

    if (newTransaction.transferFrom === newTransaction.transferTo) {
      toast.error('Kaynak ve hedef hesap aynı olamaz.')
      return
    }

    const amount = parseFloat(newTransaction.transferAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Lütfen geçerli bir tutar girin.')
      return
    }

    addTransaction({
      type: 'transfer',
      amount: amount,
      category: 'Transfer',
      description: newTransaction.transferDescription.trim() || 'Transfer',
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

  // Filter transactions for modal
  const filteredModalTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(transactionSearch.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(transactionSearch.toLowerCase())
    const matchesType = transactionFilter === 'all' || transaction.type === transactionFilter
    const matchesCategory = transactionCategoryFilter === 'all' || transaction.category === transactionCategoryFilter
    
    // Date filtering logic
    const transactionDate = new Date(transaction.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let matchesDate = true
    if (transactionDateFilter === 'today') {
      const todayStr = today.toISOString().split('T')[0]
      matchesDate = transaction.date.startsWith(todayStr)
    } else if (transactionDateFilter === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = transactionDate >= weekAgo
    } else if (transactionDateFilter === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchesDate = transactionDate >= monthAgo
    } else if (transactionDateFilter === 'custom') {
      if (customStartDate) {
        const startDate = new Date(customStartDate)
        startDate.setHours(0, 0, 0, 0)
        matchesDate = transactionDate >= startDate
      }
      if (customEndDate) {
        const endDate = new Date(customEndDate)
        endDate.setHours(23, 59, 59, 999)
        matchesDate = matchesDate && transactionDate <= endDate
      }
    }
    
    return matchesSearch && matchesType && matchesCategory && matchesDate
  })

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const chartData = [
    { name: 'Nakit', value: balances.cash, color: '#10b981' },
    { name: 'Banka', value: balances.bank, color: '#3b82f6' },
    { name: 'Birikim', value: balances.savings, color: '#8b5cf6' }
  ]

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

  // Kategori ikonları
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    
    // Gelir Kategorileri
    if (lowerCategory.includes('maaş') || lowerCategory.includes('salary')) return <DollarSign className="h-4 w-4" />
    if (lowerCategory.includes('freelance')) return <Laptop className="h-4 w-4" />
    if (lowerCategory.includes('yatırım')) return <TrendingUp className="h-4 w-4" />
    if (lowerCategory.includes('kira gelir')) return <Home className="h-4 w-4" />
    if (lowerCategory.includes('bonus')) return <Target className="h-4 w-4" />
    if (lowerCategory.includes('hediye')) return <Heart className="h-4 w-4" />
    
    // Gider Kategorileri
    if (lowerCategory.includes('market') || lowerCategory.includes('gıda')) return <ShoppingCart className="h-4 w-4" />
    if (lowerCategory.includes('kira') || lowerCategory.includes('ev gider')) return <Home className="h-4 w-4" />
    if (lowerCategory.includes('ulaşım') || lowerCategory.includes('yakıt') || lowerCategory.includes('araba')) return <Car className="h-4 w-4" />
    if (lowerCategory.includes('fatura') || lowerCategory.includes('elektrik') || lowerCategory.includes('su') || lowerCategory.includes('doğalgaz')) return <Zap className="h-4 w-4" />
    if (lowerCategory.includes('internet') || lowerCategory.includes('telefon')) return <Smartphone className="h-4 w-4" />
    if (lowerCategory.includes('sağlık') || lowerCategory.includes('ilaç') || lowerCategory.includes('hastane')) return <Heart className="h-4 w-4" />
    if (lowerCategory.includes('eğitim') || lowerCategory.includes('kurs')) return <BookOpen className="h-4 w-4" />
    if (lowerCategory.includes('giyim') || lowerCategory.includes('alışveriş')) return <ShoppingCart className="h-4 w-4" />
    if (lowerCategory.includes('eğlence') || lowerCategory.includes('sosyal')) return <Target className="h-4 w-4" />
    if (lowerCategory.includes('restoran') || lowerCategory.includes('kafe')) return <Coffee className="h-4 w-4" />
    if (lowerCategory.includes('spor') || lowerCategory.includes('salon')) return <Target className="h-4 w-4" />
    if (lowerCategory.includes('pet') || lowerCategory.includes('evcil')) return <Heart className="h-4 w-4" />
    if (lowerCategory.includes('bakım') || lowerCategory.includes('onarım')) return <Settings className="h-4 w-4" />
    if (lowerCategory.includes('sigorta')) return <Shield className="h-4 w-4" />
    if (lowerCategory.includes('vergi') || lowerCategory.includes('resmi')) return <FileText className="h-4 w-4" />
    
    return <CreditCard className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 transition-colors">
        <Card className="w-full max-w-md shadow-lg dark:shadow-md border-0 bg-card/80 backdrop-blur-sm transition-colors">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ButcApp'e Hoş Geldiniz
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Başlamak için hesap bakiyelerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cash" className="text-sm font-medium text-foreground">Nakit</Label>
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
              <Label htmlFor="bank" className="text-sm font-medium text-foreground">Banka</Label>
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
              <Label htmlFor="savings" className="text-sm font-medium text-foreground">Birikim</Label>
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
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-md dark:shadow-sm hover:shadow-lg dark:hover:shadow-md transition-all duration-200"
            >
              Başla
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 transition-colors shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 flex h-14 sm:h-16 items-center">
          <button 
            onClick={handleHeaderClick}
            className="mr-2 sm:mr-4 flex items-center space-x-2 sm:space-x-3 group"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md dark:shadow-sm group-hover:shadow-lg dark:group-hover:shadow-md transition-shadow">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">ButcApp</span>
          </button>
          
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="hidden md:flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start text-muted-foreground hover:text-foreground h-10 px-3 transition-colors duration-200"
                onClick={() => router.push('/blog')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                <span>Finans Rehberi</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start text-muted-foreground hover:text-foreground h-10 px-3 transition-colors duration-200"
                onClick={() => toast.error('Test error mesajı!', {
                  duration: 3000
                })}
              >
                Test Hata
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start text-muted-foreground hover:text-foreground h-10 px-3 transition-colors duration-200"
                onClick={() => toast.success('Test başarı mesajı!', {
                  duration: 3000
                })}
              >
                Test Başarı
              </Button>
            </div>
            <nav className="flex items-center space-x-1">
              {/* Mobile buttons */}
              <div className="md:hidden flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="justify-start text-muted-foreground hover:text-foreground h-10 px-3 transition-colors duration-200"
                  onClick={() => router.push('/blog')}
                  title="Finans Rehberi"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Common buttons */}
              <NotesButton />
              <ThemeToggle />
              <LanguageToggle />
              <UserAuthButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Hero Section - Total Balance */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/90 via-green-600/80 to-teal-600/70 dark:from-emerald-600/30 dark:via-green-700/25 dark:to-teal-700/20 p-4 sm:p-6 lg:p-8 text-white dark:text-gray-100 shadow-lg dark:shadow-md border border-white/10 dark:border-gray-700/30 transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 dark:bg-white/2 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 dark:bg-white/2 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Toplam Bakiye</h1>
                <p className="text-white/80 dark:text-gray-300/80 text-sm sm:text-base">Finansal durumunuz</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleBalanceHidden}
                className="text-white/90 dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30 transition-colors duration-200"
              >
                {balanceHidden ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
            </div>
            
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-8">
              {balanceHidden ? '***.*** TL' : `${totalBalance.toLocaleString('tr-TR')} TL`}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/10 dark:bg-gray-700/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 dark:border-gray-600/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-400/80 dark:bg-green-500/60 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Nakit</span>
                </div>
                <p className="text-xl font-bold">
                  {balanceHidden ? '***' : `${balances.cash.toLocaleString('tr-TR')} TL`}
                </p>
              </div>
              
              <div className="bg-white/10 dark:bg-gray-700/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 dark:border-gray-600/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-blue-400/80 dark:bg-blue-500/60 rounded-lg flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">Banka</span>
                </div>
                <p className="text-xl font-bold">
                  {balanceHidden ? '***' : `${balances.bank.toLocaleString('tr-TR')} TL`}
                </p>
              </div>
              
              <div className="bg-white/10 dark:bg-gray-700/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 dark:border-gray-600/20">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-purple-400/80 dark:bg-purple-500/60 rounded-lg flex items-center justify-center">
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
              <Button className="h-20 bg-card hover:bg-card/80 border border-border shadow-md dark:shadow-sm hover:shadow-lg dark:hover:shadow-md transition-colors group">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500/80 to-green-600/70 dark:from-emerald-600/50 dark:to-green-700/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">İşlem Ekle</span>
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
                  <Select
                    value={newTransaction.category}
                    onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {newTransaction.type === 'income' ? (
                        incomeCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      ) : newTransaction.type === 'expense' ? (
                        expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="Transfer">Transfer</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
              <Button className="h-20 bg-card hover:bg-card/80 border border-border shadow-md dark:shadow-sm hover:shadow-lg dark:hover:shadow-md transition-colors group">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500/80 to-cyan-600/70 dark:from-teal-600/50 dark:to-cyan-700/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <ArrowRightLeft className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Transfer</span>
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
                    placeholder="Transfer açıklaması (isteğe bağlı)"
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
              <Button className="h-20 bg-card hover:bg-card/80 border border-border shadow-md dark:shadow-sm hover:shadow-lg dark:hover:shadow-md transition-colors group">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500/80 to-green-600/70 dark:from-emerald-600/50 dark:to-green-700/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <Repeat className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Tekrarlayan</span>
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
                  <Select
                    value={newRecurring.category}
                    onValueChange={(value) => setNewRecurring(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {newRecurring.type === 'income' ? (
                        incomeCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      ) : (
                        expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
            className="h-20 bg-card hover:bg-card/80 border border-border shadow-md dark:shadow-sm hover:shadow-lg dark:hover:shadow-md transition-all duration-200 group"
            onClick={() => router.push('/app/investments')}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-r from-lime-500/80 to-emerald-600/70 dark:from-lime-600/50 dark:to-emerald-700/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-foreground">Yatırımlar</span>
            </div>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md dark:shadow-sm bg-gradient-to-br from-emerald-50/60 to-green-50/40 dark:from-emerald-950/15 dark:to-green-950/10 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-1 transition-colors">Toplam Gelir</p>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 transition-colors">
                    {income.toLocaleString('tr-TR')} TL
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/70 to-green-600/60 dark:from-emerald-600/40 dark:to-green-700/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md dark:shadow-sm bg-gradient-to-br from-red-50/60 to-pink-50/40 dark:from-red-950/15 dark:to-pink-950/10 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1 transition-colors">Toplam Gider</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300 transition-colors">
                    {expense.toLocaleString('tr-TR')} TL
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-red-500/70 to-pink-600/60 dark:from-red-600/40 dark:to-pink-700/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <TrendingDown className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-md dark:shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Bakiye Dağılımı</CardTitle>
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
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md dark:shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Aylık Gelir/Gider</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('tr-TR')} TL`} />
                  <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Gelir" />
                  <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Gider" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recurring Transactions Section */}
        <Card className="border-0 shadow-md dark:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center space-x-2">
              <Repeat className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold text-foreground">Tekrarlayan İşlemler</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600 hover:text-green-700"
              onClick={() => setShowRecurringDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Yeni Ekle
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recurringTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Repeat className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Henüz tekrarlayan işlem bulunmuyor</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">Otomatik işlemler eklemek için yukarıdaki butonu kullanın</p>
                </div>
              ) : (
                recurringTransactions.map((recurring) => {
                  const nextOccurrence = getNextOccurrence(recurring)
                  const daysUntil = nextOccurrence ? getDaysUntil(nextOccurrence) : null
                  
                  return (
                    <div key={recurring.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                          recurring.type === 'income' 
                            ? 'bg-gradient-to-r from-emerald-500/80 to-green-600/70 dark:from-emerald-600/50 dark:to-green-700/40' 
                            : 'bg-gradient-to-r from-red-500/80 to-pink-600/70 dark:from-red-600/50 dark:to-pink-700/40'
                        }`}>
                          {recurring.type === 'income' ? (
                            <ArrowUp className="h-6 w-6 text-white" />
                          ) : (
                            <ArrowDown className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-foreground transition-colors">{recurring.category}</p>
                            <Badge variant={recurring.isActive ? "default" : "secondary"} className="text-xs">
                              {recurring.isActive ? "Aktif" : "Pasif"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground transition-colors">
                            {recurring.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {recurring.frequency === 'daily' && 'Günlük'}
                              {recurring.frequency === 'weekly' && 'Haftalık'}
                              {recurring.frequency === 'monthly' && 'Aylık'}
                              {recurring.frequency === 'yearly' && 'Yıllık'}
                              {recurring.frequency === 'custom' && 'Özel'}
                            </span>
                            {nextOccurrence && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {daysUntil === 0 ? 'Bugün' : 
                                 daysUntil === 1 ? 'Yarın' : 
                                 `${daysUntil} gün sonra`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-2">
                          <p className={`font-bold text-lg transition-colors ${
                            recurring.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {recurring.type === 'income' ? '+' : '-'}{recurring.amount.toLocaleString('tr-TR')} TL
                          </p>
                          <p className="text-xs text-muted-foreground transition-colors">
                            {recurring.account === 'cash' ? 'Nakit' : 
                             recurring.account === 'bank' ? 'Banka' : 'Birikim'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted-foreground/10"
                            onClick={() => toggleRecurringStatus(recurring.id, recurring.isActive)}
                            title={recurring.isActive ? "Duraklat" : "Başlat"}
                          >
                            {recurring.isActive ? (
                              <Pause className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Play className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted-foreground/10"
                            onClick={() => handleEditRecurring(recurring)}
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={() => deleteRecurringTransaction(recurring.id)}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-0 shadow-md dark:shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Son İşlemler</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600 hover:text-green-700"
              onClick={() => setShowAllTransactionsDialog(true)}
            >
              Tümünü Gör
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Henüz işlem bulunmuyor</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">İlk işleminizi eklemek için yukarıdaki butonları kullanın</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl hover:bg-muted transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                        transaction.type === 'income' ? 'bg-gradient-to-r from-emerald-500/80 to-green-600/70 dark:from-emerald-600/50 dark:to-green-700/40' : 
                        transaction.type === 'expense' ? 'bg-gradient-to-r from-red-500/80 to-pink-600/70 dark:from-red-600/50 dark:to-pink-700/40' : 'bg-gradient-to-r from-blue-500/80 to-cyan-600/70 dark:from-blue-600/50 dark:to-cyan-700/40'
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
                          <p className="font-semibold text-foreground transition-colors">{transaction.category}</p>
                          <div className="text-muted-foreground transition-colors">
                            {getCategoryIcon(transaction.category)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground transition-colors">
                          {transaction.type === 'transfer' 
                            ? `${transaction.transferFrom === 'cash' ? 'Nakit' : transaction.transferFrom === 'bank' ? 'Banka' : 'Birikim'} → ${transaction.transferTo === 'cash' ? 'Nakit' : transaction.transferTo === 'bank' ? 'Banka' : 'Birikim'}: ${transaction.description}`
                            : transaction.description
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg transition-colors ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 
                        transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : 
                         transaction.type === 'expense' ? '-' : ''} 
                        {transaction.amount.toLocaleString('tr-TR')} TL
                      </p>
                      <p className="text-xs text-muted-foreground transition-colors">
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

      {/* Edit Recurring Transaction Dialog */}
      <Dialog open={showEditRecurringDialog} onOpenChange={setShowEditRecurringDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tekrarlayan İşlemi Düzenle</DialogTitle>
            <DialogDescription>
              Otomatik tekrar eden işlem bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          {editingRecurring && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>İşlem Tipi</Label>
                  <Select
                    value={editingRecurring.type}
                    onValueChange={(value: 'income' | 'expense') => 
                      setEditingRecurring(prev => prev ? { ...prev, type: value } : null)
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
                    value={editingRecurring.account}
                    onValueChange={(value: 'cash' | 'bank' | 'savings') => 
                      setEditingRecurring(prev => prev ? { ...prev, account: value } : null)
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
                  value={editingRecurring.amount}
                  onChange={(e) => setEditingRecurring(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={editingRecurring.category}
                  onValueChange={(value) => setEditingRecurring(prev => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {editingRecurring.type === 'income' ? (
                      incomeCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    ) : (
                      expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                  placeholder="İşlem açıklaması"
                  value={editingRecurring.description}
                  onChange={(e) => setEditingRecurring(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Periyot</Label>
                  <Select
                    value={editingRecurring.frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => 
                      setEditingRecurring(prev => prev ? { ...prev, frequency: value } : null)
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
                    value={editingRecurring.startDate}
                    onChange={(e) => setEditingRecurring(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                    className="h-12"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditRecurringDialog(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button 
                  onClick={() => editingRecurring && updateRecurringTransaction(editingRecurring)} 
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Güncelle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Transactions Modal */}
      <Dialog open={showAllTransactionsDialog} onOpenChange={setShowAllTransactionsDialog}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold">Tüm İşlemler</DialogTitle>
            <DialogDescription>
              Tüm finansal işlemlerinizi görüntüleyin, arayın ve filtreleyin
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col flex-1 overflow-hidden space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex-shrink-0 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 sm:flex-initial sm:w-64">
                  <Input
                    placeholder="İşlem veya kategori ara..."
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={transactionDateFilter}
                    onValueChange={(value: 'all' | 'today' | 'week' | 'month' | 'custom') => 
                      setTransactionDateFilter(value)
                    }
                  >
                    <SelectTrigger className="w-40 h-12">
                      <SelectValue placeholder="Tarih Aralığı" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Tarihler</SelectItem>
                      <SelectItem value="today">Bugün</SelectItem>
                      <SelectItem value="week">Son 7 Gün</SelectItem>
                      <SelectItem value="month">Son 30 Gün</SelectItem>
                      <SelectItem value="custom">Özel Tarih</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={transactionFilter}
                    onValueChange={(value: 'all' | 'income' | 'expense' | 'transfer') => 
                      setTransactionFilter(value)
                    }
                  >
                    <SelectTrigger className="w-32 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="income">Gelir</SelectItem>
                      <SelectItem value="expense">Gider</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={transactionCategoryFilter}
                    onValueChange={setTransactionCategoryFilter}
                  >
                    <SelectTrigger className="w-40 h-12">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {[...incomeCategories, ...expenseCategories].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Date Inputs */}
              {transactionDateFilter === 'custom' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="start-date" className="text-sm font-medium text-muted-foreground mb-1 block">
                      Başlangıç Tarihi
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="end-date" className="text-sm font-medium text-muted-foreground mb-1 block">
                      Bitiş Tarihi
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredModalTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {transactionSearch || transactionFilter !== 'all' || transactionCategoryFilter !== 'all' 
                      ? 'Eşleşen işlem bulunamadı' 
                      : 'Henüz işlem bulunmuyor'
                    }
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-1">
                    {transactionSearch || transactionFilter !== 'all' || transactionCategoryFilter !== 'all' 
                      ? 'Filtreleri değiştirmeyi deneyin' 
                      : 'İlk işleminizi eklemek için ana sayfadaki butonları kullanın'
                    }
                  </p>
                </div>
              ) : (
                filteredModalTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                        transaction.type === 'income' ? 'bg-gradient-to-r from-emerald-500/80 to-green-600/70 dark:from-emerald-600/50 dark:to-green-700/40' : 
                        transaction.type === 'expense' ? 'bg-gradient-to-r from-red-500/80 to-pink-600/70 dark:from-red-600/50 dark:to-pink-700/40' : 'bg-gradient-to-r from-blue-500/80 to-cyan-600/70 dark:from-blue-600/50 dark:to-cyan-700/40'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUp className="h-5 w-5 text-white" />
                        ) : transaction.type === 'expense' ? (
                          <ArrowDown className="h-5 w-5 text-white" />
                        ) : (
                          <ArrowRightLeft className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-foreground transition-colors">{transaction.category}</p>
                          <div className="text-muted-foreground transition-colors">
                            {getCategoryIcon(transaction.category)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {transaction.type === 'income' ? 'Gelir' : 
                             transaction.type === 'expense' ? 'Gider' : 'Transfer'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground transition-colors">
                          {transaction.type === 'transfer' 
                            ? `${transaction.transferFrom === 'cash' ? 'Nakit' : transaction.transferFrom === 'bank' ? 'Banka' : 'Birikim'} → ${transaction.transferTo === 'cash' ? 'Nakit' : transaction.transferTo === 'bank' ? 'Banka' : 'Birikim'}: ${transaction.description}`
                            : transaction.description
                          }
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {transaction.account === 'cash' ? 'Nakit' : 
                           transaction.account === 'bank' ? 'Banka' : 'Birikim'} • 
                          {new Date(transaction.date).toLocaleDateString('tr-TR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg transition-colors ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 
                        transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : 
                         transaction.type === 'expense' ? '-' : ''} 
                        {transaction.amount.toLocaleString('tr-TR')} TL
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary */}
            {filteredModalTransactions.length > 0 && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Gelir</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {filteredModalTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gider</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {filteredModalTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {filteredModalTransactions
                        .filter(t => t.type === 'transfer')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString('tr-TR')} TL
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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