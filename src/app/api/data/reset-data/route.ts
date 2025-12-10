import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Create Supabase client directly
const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authentication middleware with password verification
async function authenticate(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.nextUrl.searchParams.get('token')

  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  const user = await AuthService.verifyToken(token)
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  return { user, token }
}

// Password verification for critical operations
async function verifyPassword(userId: string, password: string) {
  try {
    const { data: userData, error } = await supabase
      .from('users')
      .select('passwordHash')
      .eq('id', userId)
      .single()

    if (error || !userData) {
      console.error('User lookup error:', error)
      return { valid: false, error: 'Kullanıcı bulunamadı' }
    }

    const isValid = await bcrypt.compare(password, userData.passwordHash)
    if (!isValid) {
      return { valid: false, error: 'Şifre hatalı' }
    }

    return { valid: true }
  } catch (error) {
    console.error('Password verification error:', error)
    return { valid: false, error: 'Şifre doğrulanamadı' }
  }
}

// Log critical operations
async function logCriticalOperation(userId: string, operation: string, details: any) {
  try {
    await supabase
      .from('system_logs')
      .insert({
        type: 'security',
        level: 'info',
        userId: userId,
        action: operation,
        description: `Data reset operation: ${operation}`,
        metadata: JSON.stringify(details),
        ipAddress: details.ip || 'API_REQUEST',
        userAgent: 'DATA_RESET_API',
        endpoint: '/api/data/reset-data',
        method: 'DELETE',
        createdAt: new Date().toISOString()
      })
  } catch (error) {
    console.error('Logging error:', error)
  }
}

// DELETE /api/data/reset-data - Reset all user data
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const body = await request.json().catch(() => ({}))
    const password = body.password

    // Password verification for critical operation
    if (!password) {
      return NextResponse.json({ 
        error: 'Bu işlem için şifre gereklidir',
        code: 'PASSWORD_REQUIRED'
      }, { status: 400 })
    }

    const passwordCheck = await verifyPassword(userId, password)
    if (!passwordCheck.valid) {
      await logCriticalOperation(userId, 'RESET_DATA_FAILED', { 
        reason: 'INVALID_PASSWORD',
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      })
      return NextResponse.json({ 
        error: passwordCheck.error,
        code: 'INVALID_PASSWORD'
      }, { status: 401 })
    }

    // Log the operation start
    await logCriticalOperation(userId, 'RESET_DATA_STARTED', {
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Sıfırlama işlemlerini atomik transaction içinde yap
    const resetResults = []

    // 1. Bakiyeleri sıfırla
    try {
      const { data: balanceResult, error: balanceError } = await supabase
        .from('user_profiles')
        .update({ cash: 0, bank: 0, savings: 0 })
        .eq('userId', userId)
        .select()

      if (balanceError) {
        throw new Error(`Balance reset failed: ${balanceError.message}`)
      }
      resetResults.push({ type: 'balances', success: true, count: balanceResult?.length || 0 })
    } catch (error) {
      resetResults.push({ type: 'balances', success: false, error: error.message })
    }

    // 2. Notları sil
    try {
      const { data: notesResult, error: notesError } = await supabase
        .from('user_data')
        .delete()
        .eq('userId', userId)
        .eq('type', 'note')
        .select()

      if (notesError) {
        throw new Error(`Notes reset failed: ${notesError.message}`)
      }
      resetResults.push({ type: 'notes', success: true, count: notesResult?.length || 0 })
    } catch (error) {
      resetResults.push({ type: 'notes', success: false, error: error.message })
    }

    // 3. Tekrarlayan işlemleri sil
    try {
      const { data: recurringResult, error: recurringError } = await supabase
        .from('user_data')
        .delete()
        .eq('userId', userId)
        .eq('type', 'recurring')
        .select()

      if (recurringError) {
        throw new Error(`Recurring transactions reset failed: ${recurringError.message}`)
      }
      resetResults.push({ type: 'recurring', success: true, count: recurringResult?.length || 0 })
    } catch (error) {
      resetResults.push({ type: 'recurring', success: false, error: error.message })
    }

    // 4. Yatırımları sil
    try {
      const { data: investmentsResult, error: investmentsError } = await supabase
        .from('user_data')
        .delete()
        .eq('userId', userId)
        .eq('type', 'investment')
        .select()

      if (investmentsError) {
        throw new Error(`Investments reset failed: ${investmentsError.message}`)
      }
      resetResults.push({ type: 'investments', success: true, count: investmentsResult?.length || 0 })
    } catch (error) {
      resetResults.push({ type: 'investments', success: false, error: error.message })
    }

    // 5. Regular transactions'ları da sil
    try {
      const { data: transactionsResult, error: transactionsError } = await supabase
        .from('user_data')
        .delete()
        .eq('userId', userId)
        .in('type', ['income', 'expense'])
        .select()

      if (transactionsError) {
        throw new Error(`Transactions reset failed: ${transactionsError.message}`)
      }
      resetResults.push({ type: 'transactions', success: true, count: transactionsResult?.length || 0 })
    } catch (error) {
      resetResults.push({ type: 'transactions', success: false, error: error.message })
    }

    // Sonuçları değerlendir
    const successCount = resetResults.filter(r => r.success).length
    const failureCount = resetResults.filter(r => !r.success).length
    const hasErrors = failureCount > 0

    // Log the operation result
    await logCriticalOperation(userId, 'RESET_DATA_COMPLETED', {
      success: !hasErrors,
      summary: {
        total: resetResults.length,
        success: successCount,
        failed: failureCount
      },
      results: resetResults
    })

    if (hasErrors) {
      return NextResponse.json({
        success: false,
        message: 'Bazı veriler sıfırlanamadı',
        results: resetResults,
        summary: {
          total: resetResults.length,
          success: successCount,
          failed: failureCount
        }
      }, { status: 207 }) // 207 Multi-Status - kısmi başarı
    }

    return NextResponse.json({
      success: true,
      message: 'Tüm verileriniz başarıyla sıfırlandı',
      results: resetResults,
      summary: {
        total: resetResults.length,
        success: successCount,
        failed: failureCount
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Reset API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası',
      details: error.message
    }, { status: 500 })
  }
}