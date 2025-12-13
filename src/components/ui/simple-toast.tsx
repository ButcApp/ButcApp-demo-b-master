'use client'

import React, { useState, useEffect } from 'react'

interface SimpleToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export function SimpleToast({ message, type, duration = 3000 }: SimpleToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  if (!isVisible) return null

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full">
      <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between`}>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Global toast state
let toastQueue: Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; duration?: number }> = []

export function showSimpleToast(message: string, type: 'success' | 'error' | 'info', duration?: number) {
  const id = Date.now().toString()
  toastQueue.push({ id, message, type, duration })
  
  // Trigger re-render
  window.dispatchEvent(new CustomEvent('showToast', { detail: { id, message, type, duration } }))
}

export function SimpleToastContainer() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; duration?: number }>>([])

  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const toast = event.detail
      setToasts(prev => [...prev, toast])
      
      // Auto remove after duration
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, toast.duration || 3000)
    }

    window.addEventListener('showToast', handleShowToast as EventListener)
    
    return () => {
      window.removeEventListener('showToast', handleShowToast as EventListener)
    }
  }, [])

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <SimpleToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
        />
      ))}
    </div>
  )
}