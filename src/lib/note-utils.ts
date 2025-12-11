import { Note } from '@/hooks/use-notes'

export interface NoteUtils {
  formatDate: (dateString: string) => string
  formatDateRelative: (dateString: string) => string
  truncateContent: (content: string, maxLength: number) => string
  extractTags: (content: string) => string[]
  searchInNote: (note: Note, query: string) => boolean
  sortNotes: (notes: Note[], sortBy: 'date' | 'title' | 'updated') => Note[]
  filterNotesByDateRange: (notes: Note[], startDate: Date, endDate: Date) => Note[]
  exportNotesToJSON: (notes: Note[]) => string
  importNotesFromJSON: (jsonString: string) => Note[]
  generateNoteSlug: (title: string) => string
  countWords: (content: string) => number
  estimateReadingTime: (content: string) => number
}

export const noteUtils: NoteUtils = {
  formatDate: (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  formatDateRelative: (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInDays > 7) {
      return noteUtils.formatDate(dateString)
    } else if (diffInDays > 0) {
      return `${diffInDays} gün önce`
    } else if (diffInHours > 0) {
      return `${diffInHours} saat önce`
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} dakika önce`
    } else {
      return 'Az önce'
    }
  },

  truncateContent: (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  },

  extractTags: (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g
    const tags = []
    let match
    
    while ((match = hashtagRegex.exec(content)) !== null) {
      tags.push(match[1])
    }
    
    return [...new Set(tags)] // Remove duplicates
  },

  searchInNote: (note: Note, query: string): boolean => {
    const lowercaseQuery = query.toLowerCase()
    return (
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery)
    )
  },

  sortNotes: (notes: Note[], sortBy: 'date' | 'title' | 'updated'): Note[] => {
    const sortedNotes = [...notes]
    
    switch (sortBy) {
      case 'date':
        return sortedNotes.sort((a, b) => 
          new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
        )
      case 'title':
        return sortedNotes.sort((a, b) => a.title.localeCompare(b.title))
      case 'updated':
        return sortedNotes.sort((a, b) => 
          new Date(b.updatedat).getTime() - new Date(a.updatedat).getTime()
        )
      default:
        return sortedNotes
    }
  },

  filterNotesByDateRange: (notes: Note[], startDate: Date, endDate: Date): Note[] => {
    return notes.filter(note => {
      const noteDate = new Date(note.createdat)
      return noteDate >= startDate && noteDate <= endDate
    })
  },

  exportNotesToJSON: (notes: Note[]): string => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      notes: notes.map(({ id, title, content, createdat, updatedat }) => ({
        id,
        title,
        content,
        createdat,
        updatedat
      }))
    }
    
    return JSON.stringify(exportData, null, 2)
  },

  importNotesFromJSON: (jsonString: string): Note[] => {
    try {
      const importData = JSON.parse(jsonString)
      
      if (!importData.notes || !Array.isArray(importData.notes)) {
        throw new Error('Invalid import format')
      }
      
      return importData.notes.map((note: any) => ({
        ...note,
        userid: '', // Will be set during import
        type: 'note'
      }))
    } catch (error) {
      throw new Error('Failed to parse import data')
    }
  },

  generateNoteSlug: (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  },

  countWords: (content: string): number => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
  },

  estimateReadingTime: (content: string): number => {
    const wordsPerMinute = 200 // Average reading speed
    const words = noteUtils.countWords(content)
    return Math.max(1, Math.ceil(words / wordsPerMinute))
  }
}

// Additional utility functions for note management
export const noteValidation = {
  isValidTitle: (title: string): boolean => {
    return title.trim().length >= 1 && title.trim().length <= 100
  },

  isValidContent: (content: string): boolean => {
    return content.trim().length >= 1 && content.trim().length <= 2000
  },

  sanitizeTitle: (title: string): string => {
    return title.trim().substring(0, 100)
  },

  sanitizeContent: (content: string): string => {
    return content.trim().substring(0, 2000)
  }
}

// Note statistics utilities
export const noteStats = {
  getTotalNotes: (notes: Note[]): number => {
    return notes.length
  },

  getTotalWords: (notes: Note[]): number => {
    return notes.reduce((total, note) => total + noteUtils.countWords(note.content), 0)
  },

  getTotalCharacters: (notes: Note[]): number => {
    return notes.reduce((total, note) => total + note.content.length, 0)
  },

  getAverageNoteLength: (notes: Note[]): number => {
    if (notes.length === 0) return 0
    return Math.round(noteStats.getTotalCharacters(notes) / notes.length)
  },

  getNotesCreatedThisWeek: (notes: Note[]): number => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    return notes.filter(note => new Date(note.createdat) >= oneWeekAgo).length
  },

  getNotesCreatedThisMonth: (notes: Note[]): number => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    return notes.filter(note => new Date(note.createdat) >= oneMonthAgo).length
  },

  getMostRecentNote: (notes: Note[]): Note | null => {
    if (notes.length === 0) return null
    return notes.reduce((mostRecent, note) => 
      new Date(note.createdat) > new Date(mostRecent.createdat) ? note : mostRecent
    )
  },

  getOldestNote: (notes: Note[]): Note | null => {
    if (notes.length === 0) return null
    return notes.reduce((oldest, note) => 
      new Date(note.createdat) < new Date(oldest.createdat) ? note : oldest
    )
  }
}