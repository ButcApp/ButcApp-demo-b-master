import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { createClient } from '@supabase/supabase-js'
import { Logger } from '@/lib/logger'

// Create Supabase client directly
const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authentication middleware
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

// GET /api/data/recurring-transactions - Fetch user recurring transactions
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id

    console.log('Fetching recurring transactions for userId:', userId)

    const { data: recurringTransactions, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('userid', userId)
      .eq('type', 'recurring')
      .order('createdat', { ascending: false })

    if (error) {
      console.error('Recurring transactions fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch recurring transactions'
      }, { status: 500 })
    }

    console.log('Recurring transactions fetched successfully:', recurringTransactions?.length || 0)
    console.log('Sample transaction IDs:', recurringTransactions?.slice(0, 3).map(t => ({ id: t.id, category: t.category })))

    return NextResponse.json({
      success: true,
      data: recurringTransactions || []
    })

  } catch (error) {
    console.error('Recurring Transactions GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/data/recurring-transactions - Create new recurring transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const body = await request.json()

    // Validate required fields
    const { amount, description, category, frequency, startDate, endDate } = body
    
    console.log('Received body:', body)
    console.log('Field validation:', {
      hasAmount: !!amount,
      hasDescription: !!description,
      hasCategory: !!category,
      hasFrequency: !!frequency,
      hasStartDate: !!startDate,
      amount,
      description,
      category,
      frequency,
      startDate
    })
    
    if (!amount || !description || !category || !frequency || !startDate) {
      console.log('Validation failed - missing fields')
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: amount, description, category, frequency, startDate'
      }, { status: 400 })
    }

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a positive number'
      }, { status: 400 })
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly', 'custom']
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json({
        success: false,
        error: 'Frequency must be one of: daily, weekly, monthly, yearly, custom'
      }, { status: 400 })
    }

    console.log('Creating recurring transaction:', { userId, amount, description, category, frequency, startDate, endDate })

    const insertData = {
        id: `recurring_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userid: userId,
        type: 'recurring',
        amount: parsedAmount,
        description: description.trim(),
        category: category.trim(),
        frequency: frequency,
        startdate: new Date(startDate).toISOString(),
        enddate: endDate ? new Date(endDate).toISOString() : null,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
    }

    console.log('Insert data prepared:', insertData)

    const { data: recurringTransaction, error } = await supabase
      .from('user_data')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Recurring transaction creation error:', error)
      console.error('Creation error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to create recurring transaction',
        details: error.message
      }, { status: 500 })
    }

    console.log('Recurring transaction created successfully:', recurringTransaction.id)

    return NextResponse.json({
      success: true,
      data: recurringTransaction
    })

  } catch (error) {
    console.error('Recurring Transactions POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/data/recurring-transactions - Update recurring transaction
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const body = await request.json()
    const { id, amount, description, category, frequency, startDate, endDate, isActive } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Recurring transaction ID is required'
      }, { status: 400 })
    }

    console.log('Updating recurring transaction:', { id, userId, body })

    // First check if transaction exists and belongs to user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', id)
      .eq('userid', userId)
      .eq('type', 'recurring')
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json({
        success: false,
        error: 'Recurring transaction not found'
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updatedat: new Date().toISOString()
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount)
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        updateData.amount = parsedAmount
      }
    }

    if (description !== undefined) {
      updateData.description = description.trim()
    }

    if (category !== undefined) {
      updateData.category = category.trim()
    }

    if (frequency !== undefined) {
      const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly']
      if (validFrequencies.includes(frequency)) {
        updateData.frequency = frequency
      }
    }

    if (startDate !== undefined) {
      updateData.startdate = new Date(startDate).toISOString()
    }

    if (endDate !== undefined) {
      updateData.enddate = endDate ? new Date(endDate).toISOString() : null
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('user_data')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Recurring transaction update error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update recurring transaction'
      }, { status: 500 })
    }

    console.log('Recurring transaction updated successfully:', id)

    return NextResponse.json({
      success: true,
      data: updatedTransaction
    })

  } catch (error) {
    console.error('Recurring Transactions PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/data/recurring-transactions - Delete recurring transaction
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const recurringTransactionId = searchParams.get('id')

    if (!recurringTransactionId) {
      return NextResponse.json({
        success: false,
        error: 'Recurring transaction ID is required'
      }, { status: 400 })
    }

    console.log('Deleting recurring transaction:', { recurringTransactionId, userId })
    console.log('Looking for transaction with ID:', recurringTransactionId)

    // First check if transaction exists and belongs to user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', recurringTransactionId)
      .eq('userid', userId)
      .eq('type', 'recurring')
      .single()

    console.log('Fetch result:', { existingTransaction, fetchError })

    if (fetchError || !existingTransaction) {
      console.log('Transaction not found or fetch error:', { fetchError, existingTransaction })
      return NextResponse.json({
        success: false,
        error: 'Recurring transaction not found',
        details: fetchError?.message || 'Transaction does not exist or does not belong to user'
      }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('user_data')
      .delete()
      .eq('id', recurringTransactionId)
      .eq('userid', userId)

    if (deleteError) {
      console.error('Recurring transaction delete error:', deleteError)
      console.error('Delete error details:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to delete recurring transaction',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log('Recurring transaction deleted successfully:', recurringTransactionId)

    return NextResponse.json({
      success: true,
      message: 'Recurring transaction deleted successfully'
    })

  } catch (error) {
    console.error('Recurring Transactions DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}