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

// GET /api/data/transactions - Fetch user transactions
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('Fetching transactions for userId:', userId, {
      limit, offset, type, category, startDate, endDate
    })

    let query = supabase
      .from('user_data')
      .select('*')
      .eq('userid', userId)
      .eq('type', 'transaction')

    // Apply filters
    if (type) {
      query = query.eq('category', type)
    }
    
    if (category) {
      query = query.eq('category', category)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: transactions, error } = await query
      .order('date', { ascending: false })
      .range(offset, limit)

    if (error) {
      console.error('Transactions fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch transactions'
      }, { status: 500 })
    }

    console.log('Transactions fetched successfully:', transactions?.length || 0)

    return NextResponse.json({
      success: true,
      data: transactions || [],
      pagination: {
        limit,
        offset,
        hasMore: transactions && transactions.length === limit
      }
    })

  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/data/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const body = await request.json()

    // Validate required fields
    const { amount, description, category, type = 'expense' } = body
    
    if (!amount || !description || !category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: amount, description, category'
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

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Type must be either income or expense'
      }, { status: 400 })
    }

    console.log('Creating transaction:', { userId, amount, description, category, type })

    const { data: transaction, error } = await supabase
      .from('user_data')
      .insert({
        id: `trans_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userid: userId,
        type: 'transaction',
        amount: parsedAmount,
        description: description.trim(),
        category: category.trim(),
        date: new Date(body.date || Date.now()).toISOString(),
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Transaction creation error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create transaction'
      }, { status: 500 })
    }

    console.log('Transaction created successfully:', transaction.id)

    return NextResponse.json({
      success: true,
      data: transaction
    })

  } catch (error) {
    console.error('Transactions POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/data/transactions - Update transaction
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const body = await request.json()
    const { id, amount, description, category, type, date } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 })
    }

    console.log('Updating transaction:', { id, userId, body })

    // First check if transaction exists and belongs to user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', id)
      .eq('userid', userId)
      .eq('type', 'transaction')
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
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

    if (type !== undefined && ['income', 'expense'].includes(type)) {
      updateData.type = type
    }

    if (date !== undefined) {
      updateData.date = new Date(date).toISOString()
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('user_data')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Transaction update error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update transaction'
      }, { status: 500 })
    }

    console.log('Transaction updated successfully:', id)

    return NextResponse.json({
      success: true,
      data: updatedTransaction
    })

  } catch (error) {
    console.error('Transactions PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/data/transactions - Reset all user transactions
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Use authenticated user's ID instead of requiring userId parameter
    const userId = auth.user.id

    const { data, error } = await supabase
      .from('user_data')
      .delete()
      .eq('userid', userId)
      .eq('type', 'transaction')

    if (error) {
      console.error('Transactions reset error:', error)
      return NextResponse.json({
        success: false,
        error: 'Transactions reset failed'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'All transactions successfully deleted'
    })

  } catch (error) {
    console.error('Transactions DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/data/transactions - Reset all user transactions
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 })
    }

    console.log('Deleting transaction:', { transactionId, userId })

    // First check if transaction exists and belongs to user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', transactionId)
      .eq('userid', userId)
      .eq('type', 'transaction')
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('user_data')
      .delete()
      .eq('id', transactionId)
      .eq('userid', userId)

    if (deleteError) {
      console.error('Transaction delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete transaction'
      }, { status: 500 })
    }

    console.log('Transaction deleted successfully:', transactionId)

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })

  } catch (error) {
    console.error('Transactions DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}