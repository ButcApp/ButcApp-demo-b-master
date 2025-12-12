'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Plus, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  MoreHorizontal,
  Target
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import CountdownTimer from '@/components/ui/countdown-timer'

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
  startDate: string
  endDate?: string
  isActive: boolean
}

interface EnhancedRecurringTransactionsListProps {
  recurringTransactions: RecurringTransaction[]
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>
  onEditRecurring: (recurring: RecurringTransaction) => void
}

export default function EnhancedRecurringTransactionsList({ 
  recurringTransactions, 
  setRecurringTransactions, 
  onEditRecurring 
}: EnhancedRecurringTransactionsListProps) {
  const { t } = useLanguage()

  const frequencyOptions = [
    { value: 'daily', label: 'Günlük', icon: Calendar },
    { value: 'weekly', label: 'Haftalık', icon: Calendar },
    { value: 'monthly', label: 'Aylık', icon: Calendar },
    { value: 'yearly', label: 'Yıllık', icon: Calendar },
    { value: 'custom', label: 'Diğer', icon: Calendar }
  ]

  const getFrequencyLabel = (frequency: string) => {
    const option = frequencyOptions.find(opt => opt.value === frequency)
    return option?.label || frequency
  }

  const getNextOccurrence = (recurring: RecurringTransaction) => {
    if (!recurring.isActive) return null

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()
    const currentWeekDay = today.getDay()

    let nextDate = new Date()

    switch (recurring.frequency) {
      case 'daily':
        nextDate = new Date(currentYear, currentMonth, currentDay + 1)
        break
      case 'weekly':
        if (recurring.dayOfWeek) {
          const jsDayOfWeek = recurring.dayOfWeek === 7 ? 0 : recurring.dayOfWeek
          const daysUntilNext = (jsDayOfWeek - currentWeekDay + 7) % 7
          nextDate = new Date(currentYear, currentMonth, currentDay + daysUntilNext)
        }
        break
      case 'monthly':
        nextDate = new Date(currentYear, currentMonth + 1, Math.min(currentDay, 28))
        break
      case 'yearly':
        nextDate = new Date(currentYear + 1, currentMonth, currentDay)
        break
      case 'custom':
        nextDate = new Date(currentYear, currentMonth + 1, currentDay)
        break
      default:
        return null
    }

    return nextDate
  }

  const getDaysUntilNext = (recurring: RecurringTransaction) => {
    const nextDate = getNextOccurrence(recurring)
    if (!nextDate) return null
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    nextDate.setHours(0, 0, 0, 0)
    
    const diffTime = nextDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const toggleRecurringTransaction = async (id: string) => {
    setRecurringTransactions(prev => 
      prev.map(r => 
        r.id === id ? { ...r, isActive: !r.isActive } : r
      )
    )
  }

  const deleteRecurringTransaction = (id: string) => {
    if (confirm('Bu tekrarlayan işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      setRecurringTransactions(prev => prev.filter(r => r.id !== id))
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  const getAccountLabel = (account: string) => {
    const labels = {
      cash: 'Nakit',
      bank: 'Banka',
      savings: 'Birikim'
    }
    return labels[account as keyof typeof labels] || account
  }

  const getUrgencyColor = (daysLeft: number | null) => {
    if (daysLeft === null || daysLeft === undefined) return 'secondary'
    if (daysLeft <= 0) return 'destructive'
    if (daysLeft <= 1) return 'destructive'
    if (daysLeft <= 3) return 'secondary'
    return 'outline'
  }

  const getUrgencyText = (daysLeft: number | null) => {
    if (daysLeft === null || daysLeft === undefined) return 'Bilinmiyor'
    if (daysLeft <= 0) return 'Gecikmiş'
    if (daysLeft <= 1) return 'Bugün!'
    if (daysLeft <= 3) return `${daysLeft} gün`
    return `${daysLeft} gün`
  }

  const activeTransactions = recurringTransactions.filter(r => r.isActive)
  const inactiveTransactions = recurringTransactions.filter(r => !r.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tekrarlayan İşlemler
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Otomatik tekrarlanan finansal işlemlerinizi yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {activeTransactions.length} Aktif
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {inactiveTransactions.length} Pasif
          </Badge>
        </div>
      </div>

      {/* Active Transactions with Countdown */}
      {activeTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Aktif Tekrarlayan İşlemler
            </CardTitle>
            <CardDescription>
              Aşağıdaki işlemler otomatik olarak tekrarlanmaktadır
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                {activeTransactions.map((recurring) => {
                  const daysLeft = getDaysUntilNext(recurring)
                  const nextDate = getNextOccurrence(recurring)
                  
                  return (
                    <div key={recurring.id} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              recurring.type === 'income' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                            }`}>
                              {recurring.type === 'income' ? (
                                <TrendingUp className="w-5 h-5" />
                              ) : (
                                <TrendingDown className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {recurring.description || recurring.category}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {recurring.category} • {getAccountLabel(recurring.account)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatAmount(recurring.amount)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {getFrequencyLabel(recurring.frequency)}
                            </Badge>
                            <Badge 
                              variant={getUrgencyColor(daysLeft)} 
                              className="text-xs"
                            >
                              {getUrgencyText(daysLeft)}
                            </Badge>
                          </div>

                          {nextDate && (
                            <div className="mb-3">
                              <CountdownTimer
                                targetDate={nextDate.toISOString()}
                                title="Sonraki İşlem"
                                description={`${recurring.description || recurring.category} - ${formatAmount(recurring.amount)}`}
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRecurringTransaction(recurring.id)}
                            className="h-8 w-8"
                            title="Durum değiştir"
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditRecurring(recurring)}
                            className="h-8 w-8"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRecurringTransaction(recurring.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Inactive Transactions */}
      {inactiveTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-gray-600" />
              Pasif Tekrarlayan İşlemler
            </CardTitle>
            <CardDescription>
              Durumu durdurulmuş işlemler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-3">
                {inactiveTransactions.map((recurring) => (
                  <div key={recurring.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        recurring.type === 'income' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                          : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                      }`}>
                        {recurring.type === 'income' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {recurring.description || recurring.category}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatAmount(recurring.amount)} • {getFrequencyLabel(recurring.frequency)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRecurringTransaction(recurring.id)}
                        className="h-8 w-8"
                        title="Etkinleştir"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRecurringTransaction(recurring.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recurringTransactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tekrarlayan İşlem Bulunamadı
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Otomatik tekrarlanmasını istediğiniz işlemleri ekleyerek finansal yönetiminizi kolaylaştırabilirsiniz.
            </p>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              İlk Tekrarlayan İşlemi Ekle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}