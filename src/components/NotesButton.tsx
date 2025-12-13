'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Calendar as CalendarIcon,
  Search,
  Filter,
  Clock,
  RotateCcw
} from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatDistanceToNow, format, isAfter, isBefore, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface NotesButtonProps {
  className?: string
}

export function NotesButton({ className }: NotesButtonProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Tarih filtreleme state'leri
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [showDateFilter, setShowDateFilter] = useState(false)
  
  const { notes, loading, error, addNote, deleteNote, updateNote } = useNotes()

  // Not ekle
  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return

    const success = await addNote({
      title: newNoteTitle.trim(),
      content: newNoteContent.trim()
    })

    if (success) {
      setNewNoteTitle('')
      setNewNoteContent('')
      setShowAddForm(false)
    }
  }

  // Not sil
  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      await deleteNote(noteId)
    }
  }

  // Not düzenleme başlat
  const startEdit = (note: any) => {
    setEditingNote(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  // Not düzenleme iptal
  const cancelEdit = () => {
    setEditingNote(null)
    setEditTitle('')
    setEditContent('')
  }

  // Not güncelle
  const handleUpdateNote = async (noteId: string) => {
    if (!editTitle.trim() || !editContent.trim()) return

    const success = await updateNote(noteId, {
      title: editTitle.trim(),
      content: editContent.trim()
    })

    if (success) {
      cancelEdit()
    }
  }

  // Tarih filtreleme fonksiyonları
  const filterNotesByDate = (notes: any[]) => {
    const now = new Date()
    
    return notes.filter(note => {
      const noteDate = new Date(note.createdat)
      
      switch (dateFilter) {
        case 'today':
          return isToday(noteDate)
        case 'yesterday':
          return isYesterday(noteDate)
        case 'thisWeek':
          return isThisWeek(noteDate, { weekStartsOn: 1 })
        case 'thisMonth':
          return isThisMonth(noteDate)
        case 'last7days':
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return isAfter(noteDate, sevenDaysAgo)
        case 'last30days':
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return isAfter(noteDate, thirtyDaysAgo)
        case 'custom':
          if (customStartDate && customEndDate) {
            return isAfter(noteDate, customStartDate) && isBefore(noteDate, customEndDate)
          } else if (customStartDate) {
            return isAfter(noteDate, customStartDate)
          } else if (customEndDate) {
            return isBefore(noteDate, customEndDate)
          }
          return true
        default:
          return true
      }
    })
  }

  // Filtreleri temizle
  const clearFilters = () => {
    setDateFilter('all')
    setCustomStartDate(undefined)
    setCustomEndDate(undefined)
    setSearchTerm('')
  }

  // Notları filtrele (arama ve tarih filtreleri birlikte)
  const filteredNotes = filterNotesByDate(
    notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const noteCount = notes.length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative ${className}`}
        >
          <StickyNote className="h-4 w-4" />
          {noteCount > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
            >
              {noteCount}
            </Badge>
          )}
          <span className="hidden sm:inline ml-2">Notlar</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notlarım
            {noteCount > 0 && (
              <Badge variant="secondary">{noteCount}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Arama ve Filtreleme Bölümü */}
          <div className="flex-shrink-0 space-y-3 mb-4">
            {/* Ana Arama Satırı */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Notlarda ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                size="sm"
                variant={showAddForm ? "secondary" : "default"}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Yeni Not</span>
              </Button>
            </div>

            {/* Tarih Filtreleme Satırı */}
            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tarih filtrele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Notlar</SelectItem>
                    <SelectItem value="today">Bugün</SelectItem>
                    <SelectItem value="yesterday">Dün</SelectItem>
                    <SelectItem value="thisWeek">Bu Hafta</SelectItem>
                    <SelectItem value="thisMonth">Bu Ay</SelectItem>
                    <SelectItem value="last7days">Son 7 Gün</SelectItem>
                    <SelectItem value="last30days">Son 30 Gün</SelectItem>
                    <SelectItem value="custom">Özel Tarih</SelectItem>
                  </SelectContent>
                </Select>

                {/* Özel Tarih Seçimi */}
                {dateFilter === 'custom' && (
                  <div className="flex gap-2 items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[140px] justify-start text-left font-normal",
                            !customStartDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {customStartDate ? format(customStartDate, "dd.MM.yyyy") : "Başlangıç"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customStartDate}
                          onSelect={setCustomStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <span className="text-sm text-muted-foreground">-</span>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[140px] justify-start text-left font-normal",
                            !customEndDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {customEndDate ? format(customEndDate, "dd.MM.yyyy") : "Bitiş"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customEndDate}
                          onSelect={setCustomEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              {/* Filtreleri Temizle Butonu */}
              {(searchTerm || dateFilter !== 'all' || customStartDate || customEndDate) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Temizle
                </Button>
              )}
            </div>
          </div>

          {/* Yeni Not Ekle Form */}
          {showAddForm && (
            <Card className="mb-4 flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Yeni Not Ekle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="new-note-title" className="text-sm">Başlık</Label>
                  <Input
                    id="new-note-title"
                    placeholder="Not başlığı..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-note-content" className="text-sm">İçerik</Label>
                  <Textarea
                    id="new-note-content"
                    placeholder="Not içeriği..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddNote}
                    disabled={!newNoteTitle.trim() || !newNoteContent.trim() || loading}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAddForm(false)
                      setNewNoteTitle('')
                      setNewNoteContent('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    İptal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notlar Listesi */}
          <ScrollArea className="flex-1 overflow-y-auto max-h-[400px]">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Notlar yükleniyor...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-destructive">
                {error}
              </div>
            )}

            {!loading && !error && filteredNotes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || dateFilter !== 'all' || customStartDate || customEndDate 
                  ? 'Arama ve filtre kriterlerine uygun not bulunamadı.' 
                  : 'Henüz not eklenmemiş.'}
              </div>
            )}

            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4" onClick={() => startEdit(note)}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm">{note.title}</h3>
                      <div className="flex gap-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(note)
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNote(note.id)
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDistanceToNow(new Date(note.createdat), { 
                        addSuffix: true, 
                        locale: tr 
                      })}
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {note.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Düzenleme Modal */}
        {editingNote && (
          <Dialog open={!!editingNote} onOpenChange={() => editingNote && cancelEdit()}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Notu Düzenle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-note-title">Başlık</Label>
                  <Input
                    id="edit-note-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Başlık..."
                  />
                </div>
                <div>
                  <Label htmlFor="edit-note-content">İçerik</Label>
                  <Textarea
                    id="edit-note-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Not içeriği..."
                    className="min-h-[150px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUpdateNote(editingNote)}
                    disabled={!editTitle.trim() || !editContent.trim() || loading}
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    İptal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}