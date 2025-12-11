'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  FileText,
  Save,
  X
} from 'lucide-react'
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

interface NotesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotesModal({ isOpen, onClose }: NotesModalProps) {
  const { toast } = useToast()
  
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')
  
  // Form states
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  // Fetch notes from API
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth-token')
      
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
      console.error('Error fetching notes:', error)
      toast({
        title: "Hata",
        description: "Notlar yüklenirken bir hata oluştu.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Create new note
  const createNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen başlık ve içerik alanlarını doldurun.",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/data/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: noteContent.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create note')
      }

      const data = await response.json()
      if (data.success) {
        setNotes(prev => [data.data, ...prev])
        setNoteTitle('')
        setNoteContent('')
        setIsCreateDialogOpen(false)
        
        toast({
          title: "Başarılı",
          description: "Not başarıyla oluşturuldu."
        })
      } else {
        throw new Error(data.error || 'Failed to create note')
      }
    } catch (error) {
      console.error('Error creating note:', error)
      toast({
        title: "Hata",
        description: "Not oluşturulurken bir hata oluştu.",
        variant: "destructive"
      })
    }
  }

  // Update note
  const updateNote = async () => {
    if (!selectedNote || !noteTitle.trim() || !noteContent.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen başlık ve içerik alanlarını doldurun.",
        variant: "destructive"
      })
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/data/notes', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedNote.id,
          title: noteTitle.trim(),
          content: noteContent.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update note')
      }

      const data = await response.json()
      if (data.success) {
        setNotes(prev => prev.map(note => 
          note.id === selectedNote.id ? data.data : note
        ))
        setIsEditDialogOpen(false)
        setSelectedNote(null)
        setNoteTitle('')
        setNoteContent('')
        
        toast({
          title: "Başarılı",
          description: "Not başarıyla güncellendi."
        })
      } else {
        throw new Error(data.error || 'Failed to update note')
      }
    } catch (error) {
      console.error('Error updating note:', error)
      toast({
        title: "Hata",
        description: "Not güncellenirken bir hata oluştu.",
        variant: "destructive"
      })
    }
  }

  // Delete note
  const deleteNote = async () => {
    if (!selectedNote) return

    try {
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch(`/api/data/notes/${selectedNote.id}`, {
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
        setNotes(prev => prev.filter(note => note.id !== selectedNote.id))
        setIsDeleteDialogOpen(false)
        setSelectedNote(null)
        
        toast({
          title: "Başarılı",
          description: "Not başarıyla silindi."
        })
      } else {
        throw new Error(data.error || 'Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast({
        title: "Hata",
        description: "Not silinirken bir hata oluştu.",
        variant: "destructive"
      })
    }
  }

  // Open edit dialog
  const openEditDialog = (note: Note) => {
    setSelectedNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const openDeleteDialog = (note: Note) => {
    setSelectedNote(note)
    setIsDeleteDialogOpen(true)
  }

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = searchTerm === '' || 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdat).getTime() - new Date(a.createdat).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

  // Load notes when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchNotes()
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notlarım
          </DialogTitle>
          <DialogDescription>
            Kişisel notlarınızı yönetin
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Notlarda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="date">Tarihe Göre</option>
                <option value="title">Başlığa Göre</option>
              </select>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Not
              </Button>
            </div>
          </div>

          {/* Notes Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Notlar yükleniyor...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Not Bulunamadı</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Arama kriterlerinize uygun not bulunamadı." 
                  : "Henüz hiç not oluşturmadınız."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Notu Oluştur
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium line-clamp-2 flex-1">{note.title}</h3>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(note)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(note)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(note.createdat).toLocaleDateString('tr-TR')}
                      </div>
                      <span>
                        {note.content.length} karakter
                      </span>
                      {note.updatedat !== note.createdat && (
                        <span>Güncellendi</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yeni Not Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir not oluşturmak için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Not başlığı..."
              />
            </div>
            <div>
              <Label htmlFor="content">İçerik</Label>
              <Textarea
                id="content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Not içeriği..."
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={createNote}>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Notu Düzenle</DialogTitle>
            <DialogDescription>
              Notu düzenlemek için aşağıdaki formu güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Başlık</Label>
              <Input
                id="edit-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Not başlığı..."
              />
            </div>
            <div>
              <Label htmlFor="edit-content">İçerik</Label>
              <Textarea
                id="edit-content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Not içeriği..."
                rows={6}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={updateNote}>
                <Save className="h-4 w-4 mr-2" />
                Güncelle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notu Sil</DialogTitle>
            <DialogDescription>
              Bu notu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedNote && (
              <div>
                <p className="font-medium">{selectedNote.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedNote.content.substring(0, 100)}...
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={deleteNote}>
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}