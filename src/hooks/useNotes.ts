'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { dataSync } from '@/lib/data-sync'

export interface Note {
  id: string
  title: string
  content: string
  createdat: string
  updatedat: string
  userid: string
  type: string
}

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Notları yükle
  const loadNotes = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const notesData = await dataSync.getNotes()
      setNotes(notesData || [])
    } catch (err) {
      console.error('Notlar yüklenirken hata:', err)
      setError('Notlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Not ekle
  const addNote = useCallback(async (noteData: { title: string; content: string }) => {
    if (!user) return false

    try {
      setLoading(true)
      setError(null)
      
      const success = await dataSync.addNote(noteData)
      if (success) {
        // Notları yeniden yükle
        await loadNotes()
        return true
      }
      return false
    } catch (err) {
      console.error('Not eklenirken hata:', err)
      setError('Not eklenemedi')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, loadNotes])

  // Not sil
  const deleteNote = useCallback(async (noteId: string) => {
    if (!user) return false

    try {
      setLoading(true)
      setError(null)
      
      const success = await dataSync.deleteNote(noteId)
      if (success) {
        // State'den direkt sil
        setNotes(prev => prev.filter(note => note.id !== noteId))
        return true
      }
      return false
    } catch (err) {
      console.error('Not silinirken hata:', err)
      setError('Not silinemedi')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Not güncelle (data-sync'de bu fonksiyon yok, API ile yapılacak)
  const updateNote = useCallback(async (noteId: string, noteData: { title?: string; content?: string }) => {
    if (!user) return false

    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/data/notes', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: noteId,
          ...noteData
        })
      })

      if (response.ok) {
        // State'de güncelle
        setNotes(prev => prev.map(note => 
          note.id === noteId 
            ? { 
                ...note, 
                ...noteData, 
                updatedat: new Date().toISOString() 
              }
            : note
        ))
        return true
      }
      return false
    } catch (err) {
      console.error('Not güncellenirken hata:', err)
      setError('Not güncellenemedi')
      return false
    } finally {
      setLoading(false)
    }
  }, [user])

  // Kullanıcı değiştiğinde notları yükle
  useEffect(() => {
    if (user) {
      loadNotes()
    } else {
      setNotes([])
    }
  }, [user, loadNotes])

  return {
    notes,
    loading,
    error,
    loadNotes,
    addNote,
    deleteNote,
    updateNote
  }
}