'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  RefreshCw,
  Trash2,
  UserX,
  Shield,
  UserCog
} from 'lucide-react'

interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  lastLogin: string
  totalTransactions: number
  totalBalance: number
  role?: string // Rol bilgisi eklendi
}

export function UserManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
        setError('')
        setSuccess('')
      } else {
        setLoading(true)
      }

      // Get admin token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      
      if (!token) {
        setError('Admin oturumu bulunamadı. Lütfen giriş yapın.')
        setLoading(false)
        setRefreshing(false)
        return
      }

      console.log('Fetching users with token:', token.substring(0, 10) + '...')

      const response = await fetch('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Users API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Users API error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Users API response data:', data)
      
      if (data.success) {
        setUsers(data.users || [])
        setLastRefreshTime(new Date())
        
        if (isRefresh) {
          const userCount = data.users?.length || 0
          setSuccess(`${userCount} kullanıcı başarıyla yüklendi`)
        }
      } else {
        if (response.status === 401) {
          setError('Yetkisiz erişim. Admin yetkisi gerekiyor.')
        } else {
          setError('Kullanıcılar yüklenemedi: ' + (data.error || 'Bilinmeyen hata'))
        }
      }
    } catch (error) {
      console.error('Users fetch error:', error)
      setError('Kullanıcılar yüklenemedi: ' + (error as Error).message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchUsers(true)
  }

  const handleToggleActive = async (userId: string) => {
    try {
      // Get admin token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      
      if (!token) {
        setError('Admin oturumu bulunamadı. Lütfen giriş yapın.')
        return
      }

      const response = await fetch(`/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/api/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        fetchUsers() // Refresh the list
        setSuccess('Kullanıcı durumu güncellendi!')
      } else {
        setError('Durum güncellenemedi')
      }
    } catch (error) {
      setError('Durum güncellenemedi')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      // Get admin token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      
      if (!token) {
        setError('Admin oturumu bulunamadı. Lütfen giriş yapın.')
        return
      }

      const response = await fetch(`/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/api/users/${userId}/update-role`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })
      
      if (response.ok) {
        fetchUsers() // Refresh the list
        setSuccess('Kullanıcı rolü güncellendi!')
      } else {
        const data = await response.json()
        setError('Rol güncellenemedi: ' + (data.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      setError('Rol güncellenemedi')
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeleting(true)
      setError('')
      
      // Get admin token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
      
      if (!token) {
        setError('Admin oturumu bulunamadı. Lütfen giriş yapın.')
        return
      }

      const response = await fetch('/0gv6O9Gizwrd1FCb40H22JE8y9aIgK/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userToDelete.id,
          action: 'delete'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setDeleteDialogOpen(false)
        setUserToDelete(null)
        fetchUsers() // Refresh the list
        setSuccess(`"${userToDelete.fullName || userToDelete.email}" kullanıcısı başarıyla silindi!`)
      } else {
        setError('Kullanıcı silinemedi: ' + (data.error || 'Bilinmeyen hata'))
      }
    } catch (error) {
      console.error('Delete user error:', error)
      setError('Kullanıcı silinemedi')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Kullanıcı Yönetimi</h3>
          {lastRefreshTime && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Son güncelleme: {lastRefreshTime.toLocaleTimeString('tr-TR')}
            </p>
          )}
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Yenileniyor...' : 'Yenile'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Kayıtlı Kullanıcılar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refreshing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <span className="text-slate-600 dark:text-slate-400">Kullanıcılar yenileniyor...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Henüz kayıtlı kullanıcı bulunmuyor.</p>
              <Button 
                className="mt-4"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead>İşlem Sayısı</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>
                      <div className="flex items-center">
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt={user.fullName || user.email}
                            className="h-8 w-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {(user.fullName || user.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {user.fullName || 'İsimsiz Kullanıcı'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        <Activity className="h-3 w-3 inline mr-1" />
                        {formatDate(user.lastLogin)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <Badge variant="outline">
                          {user.totalTransactions} işlem
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
                        ₺{user.totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={user.role || 'user'}
                          onValueChange={(value) => handleUpdateRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <div className="flex items-center">
                              {user.role === 'admin' ? (
                                <Shield className="h-4 w-4 mr-2 text-red-500" />
                              ) : user.role === 'moderator' ? (
                                <UserCog className="h-4 w-4 mr-2 text-blue-500" />
                              ) : (
                                <UserCog className="h-4 w-4 mr-2 text-gray-500" />
                              )}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center">
                                <UserCog className="h-4 w-4 mr-2 text-gray-500" />
                                User
                              </div>
                            </SelectItem>
                            <SelectItem value="moderator">
                              <div className="flex items-center">
                                <UserCog className="h-4 w-4 mr-2 text-blue-500" />
                                Moderatör
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center">
                                <Shield className="h-4 w-4 mr-2 text-red-500" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user.id)}
                          className={user.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                        >
                          {user.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Kullanıcı Silme Onayı
            </DialogTitle>
            <DialogDescription>
              Bu işlemi geri alamazsınız. Kullanıcı ve tüm verileri (işlemler, notlar, profil bilgileri) kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {userToDelete.avatarUrl ? (
                      <img 
                        src={userToDelete.avatarUrl} 
                        alt={userToDelete.fullName || userToDelete.email}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(userToDelete.fullName || userToDelete.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {userToDelete.fullName || 'İsimsiz Kullanıcı'}
                    </p>
                    <p className="text-sm text-gray-500">{userToDelete.email}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Kayıt Tarihi:</span> {formatDate(userToDelete.createdAt)}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">İşlem Sayısı:</span> {userToDelete.totalTransactions}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Bakiye:</span> ₺{userToDelete.totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>⚠️ DİKKAT - KALICI SİLME:</strong> Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve kullanıcının tüm verileri kalıcı olarak silinecektir.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
              }}
              disabled={deleting}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Kullanıcıyı Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}