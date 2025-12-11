import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Note {
  id: string
  title: string
  content: string
  createdat: string
  updatedat: string
  userid: string
  type: string
}

interface UseNotesReturn {
  notes: Note[]
  loading: boolean
  error: string | null
  fetchNotes: () => Promise<void>
  createNote: (title: string, content: string) => Promise<boolean>
  updateNote: (id: string, title: string, content: string) => Promise<boolean>
  deleteNote: (id: string) => Promise<boolean>
  getNoteById: (id: string) => Note | undefined
  searchNotes: (query: string) => Note[]
}

export function useNotes(): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication token not found')
      }
      
      const response = await fetch('/api/data/notes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }

      const data = await response.json()
      if (data.success) {
        setNotes(data.data || [])
      } else {
        throw new Error(data.error || 'Failed to fetch notes')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      toast({
        title: "Hata",
        description: "Notlar yüklenirken bir hata oluştu.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createNote = useCallback(async (title: string, content: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication token not found')
      }
      
      const response = await fetch('/api/data/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create note')
      }

      const data = await response.json()
      if (data.success) {
        setNotes(prev => [data.data, ...prev])
        toast({
          title: "Başarılı",
          description: "Not başarıyla oluşturuldu."
        })
        return true
      } else {
        throw new Error(data.error || 'Failed to create note')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Hata",
        description: "Not oluşturulurken bir hata oluştu.",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  const updateNote = useCallback(async (id: string, title: string, content: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication token not found')
      }
      
      const response = await fetch('/api/data/notes', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          title: title.trim(),
          content: content.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update note')
      }

      const data = await response.json()
      if (data.success) {
        setNotes(prev => prev.map(note => 
          note.id === id ? data.data : note
        ))
        toast({
          title: "Başarılı",
          description: "Not başarıyla güncellendi."
        })
        return true
      } else {
        throw new Error(data.error || 'Failed to update note')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Hata",
        description: "Not güncellenirken bir hata oluştu.",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication token not found')
      }
      
      const response = await fetch(`/api/data/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      const data = await response.json()
      if (data.success) {
        setNotes(prev => prev.filter(note => note.id !== id))
        toast({
          title: "Başarılı",
          description: "Not başarıyla silindi."
        })
        return true
      } else {
        throw new Error(data.error || 'Failed to delete note')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Hata",
        description: "Not silinirken bir hata oluştu.",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  const getNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(note => note.id === id)
  }, [notes])

  const searchNotes = useCallback((query: string): Note[] => {
    if (!query.trim()) return notes
    
    const lowercaseQuery = query.toLowerCase()
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery)
    )
  }, [notes])

  // Auto-fetch notes on hook mount
  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      fetchNotes()
    } else {
      setLoading(false)
    }
  }, [fetchNotes])

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    searchNotes
  }
}