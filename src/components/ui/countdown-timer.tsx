'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Calendar, AlertCircle, Timer } from 'lucide-react'

interface CountdownTimerProps {
  targetDate: string
  title: string
  description?: string
  className?: string
}

export default function CountdownTimer({ 
  targetDate, 
  title, 
  description,
  className = "" 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        })
        setIsExpired(false)
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setIsExpired(true)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0')
  }

  const getUrgencyColor = () => {
    if (isExpired) return 'destructive'
    if (timeLeft.days <= 1) return 'destructive'
    if (timeLeft.days <= 3) return 'secondary'
    return 'default'
  }

  const getUrgencyText = () => {
    if (isExpired) return 'Süresi Doldu'
    if (timeLeft.days <= 1) return 'Acil!'
    if (timeLeft.days <= 3) return 'Yaklaşıyor'
    return 'Zaman Var'
  }

  return (
    <Card className={`${className} ${isExpired ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant={getUrgencyColor()} className="text-xs">
            {getUrgencyText()}
          </Badge>
        </div>
        {description && (
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(timeLeft.days)}
            </div>
            <div className="text-xs text-muted-foreground">Gün</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(timeLeft.hours)}
            </div>
            <div className="text-xs text-muted-foreground">Saat</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(timeLeft.minutes)}
            </div>
            <div className="text-xs text-muted-foreground">Dakika</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(timeLeft.seconds)}
            </div>
            <div className="text-xs text-muted-foreground">Saniye</div>
          </div>
        </div>
        
        {isExpired && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Bu işlemin zamanı geçmiş!</span>
          </div>
        )}
        
        {!isExpired && timeLeft.days <= 1 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
            <Clock className="w-4 h-4" />
            <span>Yaklaşan işlem!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}