'use client'

import React, { useState, useRef } from 'react'
import { Menu, X, Home, Settings, CreditCard, TrendingUp, User, Bell, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMobile } from '@/hooks/useMobile'

interface MobileNavigationProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
}

export function MobileNavigation({ 
  isOpen, 
  onClose, 
  title = 'Menu',
  className = ''
}: MobileNavigationProps) {
  const { isMobile } = useMobile()
  const [activeItem, setActiveItem] = useState<string | null>(null)

  const navigationItems = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: <Home className="h-5 w-5" />, badge: null },
    { id: 'transactions', label: 'İşlemler', icon: <CreditCard className="h-5 w-5" />, badge: null },
    { id: 'analytics', label: 'Analiz', icon: <TrendingUp className="h-5 w-5" />, badge: null },
    { id: 'settings', label: 'Ayarlar', icon: <Settings className="h-5 w-5" />, badge: null },
    { id: 'notifications', label: 'Bildirimler', icon: <Bell className="h-5 w-5" />, badge: '5' },
    { id: 'profile', label: 'Profil', icon: <User className="h-5 w-5" />, badge: null },
    { id: 'help', label: 'Yardım', icon: <HelpCircle className="h-5 w-5" />, badge: null }
  ]

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
    // Close navigation after item click
    onClose()
    // Navigate to the page
    window.location.href = itemId === 'dashboard' ? '/app' : `/${itemId}`
  }

  const handleBackdropClick = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-800 h-full w-full max-w-sm mx-auto shadow-xl">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <div className="flex items-center gap-2 sm:gap-3">
            <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors ${
                activeItem === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                {item.icon}
              </div>
              <span className="flex-1 text-gray-900 dark:text-white font-medium">
                {item.label}
              </span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            Menüden çıkmak için dışarı alana dokunun veya ESC tuşuna basın
          </div>
        </div>
      </div>
    </div>
  )
}