import { ClientAuthService } from './client-auth-service'

// Basit veri senkronizasyon fonksiyonları
export const dataSync = {
  // Mevcut kullanıcı ID'sini al
  async getCurrentUserId() {
    try {
      const token = ClientAuthService.getToken()
      if (!token) return null
      
      const user = await ClientAuthService.verifyToken(token)
      return user?.id || null
    } catch (error) {
      console.error('Error in getCurrentUserId:', error)
      return null
    }
  },

  // Bakiyeleri getir
  async getBalances() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No user ID found, returning default balances')
        return { cash: 0, bank: 0, savings: 0 }
      }

      console.log('Fetching balances for userId:', userId)
      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/balances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch balances:', response.status, response.statusText)
        return { cash: 0, bank: 0, savings: 0 }
      }

      const data = await response.json()
      console.log('Balances retrieved from API:', data)
      
      if (data.success && data.data) {
        return data.data
      } else {
        console.error('Balances API returned error:', data.error)
        return { cash: 0, bank: 0, savings: 0 }
      }
    } catch (error) {
      console.error('Error in getBalances:', error)
      return { cash: 0, bank: 0, savings: 0 }
    }
  },

  // Bakiyeleri güncelle
  async updateBalances(balances: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for updating balances')
        return false
      }

      console.log('Updating balances via API:', balances)

      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/balances`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(balances)
      })

      if (!response.ok) {
        console.error('Failed to update balances:', response.status, response.statusText)
        return false
      }

      const data = await response.json()
      console.log('Balances update response:', data)
      
      if (data.success) {
        console.log('Balances successfully updated via API')
        return true
      } else {
        console.error('Balances update failed:', data.error)
        return false
      }
    } catch (error) {
      console.error('Error in updateBalances:', error)
      return false
    }
  },

  // İşlemleri getir
  async getTransactions() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No user ID found, returning empty transactions')
        return []
      }

      console.log('Fetching transactions for userId:', userId)
      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch transactions:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      console.log('Transactions retrieved from API:', data?.length || 0)
      
      if (data.success && data.data) {
        return data.data
      } else {
        console.error('Transactions API returned error:', data.error)
        return []
      }
    } catch (error) {
      console.error('Error in getTransactions:', error)
      return []
    }
  },

  // İşlem ekle
  async addTransaction(transaction: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('Kullanıcı ID bulunamadı')
        return false
      }

      // İşlem verilerini sunucunun beklediği formata dönüştürüyoruz
      const transactionData = {
        amount: transaction.amount,
        description: transaction.description || transaction.category, // Eğer açıklama yoksa kategoriyi kullan
        category: transaction.category,
        type: transaction.type || 'expense', // Varsayılan olarak 'expense' (gider) kullan
        account: transaction.account || 'cash', // Account alanını ekle
        date: transaction.date || new Date().toISOString()
      }

      console.log('API üzerinden işlem ekleniyor:', transactionData)

      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('İşlem eklenemedi:', response.status, response.statusText, errorData)
        return false
      }

      const data = await response.json()
      console.log('İşlem yanıtı:', data)
      
      if (data.success) {
        console.log('İşlem başarıyla eklendi')
        return true
      } else {
        console.error('İşlem eklenirken hata:', data.error)
        return false
      }
    } catch (error) {
      console.error('Error in addTransaction:', error)
      return false
    }
  },

  // Tekrarlayan işlemleri getir
  async getRecurringTransactions() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No user ID found, returning empty recurring transactions')
        return []
      }

      console.log('Fetching recurring transactions for userId:', userId)
      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/recurring-transactions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch recurring transactions:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      console.log('Recurring transactions retrieved from API:', data?.data?.length || 0)
      
      if (data.success && data.data) {
        // API'den gelen veriyi frontend'in beklediği formata dönüştür
        return data.data.map((item: any) => ({
          id: item.id,
          type: item.category === 'Maaş' || item.category === 'Ek Gelir' || item.category === 'Yatırım' || item.category === 'Hediye' || item.category === 'Kira Geliri' ? 'income' : 'expense',
          amount: item.amount,
          category: item.category,
          description: item.description,
          account: 'bank', // Varsayılan olarak banka hesabı
          frequency: item.frequency,
          customFrequency: item.customFrequency,
          dayOfWeek: item.dayOfWeek,
          startDate: item.startdate || item.startDate,
          endDate: item.enddate || item.endDate,
          isActive: true // Varsayılan olarak aktif
        }))
      } else {
        console.error('Recurring transactions API returned error:', data.error)
        return []
      }
    } catch (error) {
      console.error('Error in getRecurringTransactions:', error)
      return []
    }
  },

  // Tekrarlayan işlem ekle
  async addRecurringTransaction(recurring: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for adding recurring transaction')
        return false
      }

      // API'nin beklediği formata dönüştür
      const recurringData = {
        amount: recurring.amount,
        description: recurring.description,
        category: recurring.category,
        frequency: recurring.frequency,
        startDate: recurring.startDate,
        endDate: recurring.endDate || null
      }

      console.log('Adding recurring transaction via API:', recurringData)

      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/recurring-transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recurringData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to add recurring transaction:', response.status, response.statusText, errorData)
        return false
      }

      const data = await response.json()
      console.log('Recurring transaction response:', data)
      
      if (data.success) {
        console.log('Recurring transaction successfully added via API')
        return true
      } else {
        console.error('Recurring transaction addition failed:', data.error)
        return false
      }
    } catch (error) {
      console.error('Error in addRecurringTransaction:', error)
      return false
    }
  },

  // Tekrarlayan işlem güncelle
  async updateRecurringTransaction(updatedRecurring: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for updating recurring transaction')
        return false
      }

      console.log('Updating recurring transaction via API:', updatedRecurring)

      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/recurring-transactions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedRecurring)
      })

      if (!response.ok) {
        console.error('Failed to update recurring transaction:', response.statusText)
        return false
      }

      console.log('Recurring transaction successfully updated via API')
      return true
    } catch (error) {
      console.error('Error in updateRecurringTransaction:', error)
      return false
    }
  },

  // Notları getir
  async getNotes() {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.log('No user ID found, returning empty notes')
        return []
      }

      console.log('Fetching notes for userId:', userId)
      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/notes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch notes:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      console.log('Notes retrieved from API:', data?.length || 0)
      
      if (data.success && data.data) {
        return data.data
      } else {
        console.error('Notes API returned error:', data.error)
        return []
      }
    } catch (error) {
      console.error('Error in getNotes:', error)
      return []
    }
  },

  // Not ekle
  async addNote(note: any) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for adding note')
        return false
      }

      console.log('Adding note via API:', note)

      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(note)
      })

      if (!response.ok) {
        console.error('Failed to add note:', response.statusText)
        return false
      }

      console.log('Note successfully added via API')
      return true
    } catch (error) {
      console.error('Error in addNote:', error)
      return false
    }
  },

  // Not sil
  async deleteNote(noteId: string) {
    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        console.error('No user ID found for deleting note')
        return false
      }

      console.log('Deleting note via API:', noteId)

      const response = await fetch(`${ClientAuthService.getBaseUrl()}/api/data/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ClientAuthService.getToken()}`
        }
      })

      if (!response.ok) {
        console.error('Failed to delete note:', response.statusText)
        return false
      }
      
      console.log('Note successfully deleted via API')
      return true
    } catch (error) {
      console.error('Error in deleteNote:', error)
      return false
    }
  }
}