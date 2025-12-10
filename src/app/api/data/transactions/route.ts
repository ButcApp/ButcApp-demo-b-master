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
      limit,
      offset,
      type,
      category,
      startDate,
      endDate
    })

    let query = supabase
      .from('user_data')
      .select('*')
      .eq('userid', userId)
      .in('type', ['income', 'expense']) // Only income and expense transactions
      .order('createdat', { ascending: false })

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (startDate) {
      query = query.gte('date', new Date(startDate).toISOString())
    }
    
    if (endDate) {
      query = query.lte('date', new Date(endDate).toISOString())
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: transactions, error } = await query

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
      data: transactions || []
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
    const { type, amount, description, category, date, account } = body
    
    if (!type || !amount || !description || !category || !account) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, amount, description, category, account'
      }, { status: 400 })
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Type must be either income or expense'
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

    console.log('Creating transaction:', { userId, type, amount, description, category, account })

    const { data: transaction, error } = await supabase
      .from('user_data')
      .insert({
        id: `transaction_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userid: userId,
        type: type,
        amount: parsedAmount,
        description: description.trim(),
        category: category.trim(),
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
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
    const { id, type, amount, description, category, date } = body

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
      .in('type', ['income', 'expense'])
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

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return NextResponse.json({
          success: false,
          error: 'Type must be either income or expense'
        }, { status: 400 })
      }
      updateData.type = type
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

// DELETE /api/data/transactions - Delete transaction
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 })
    }

    console.log('Deleting transaction:', { id, userId })

    // First check if transaction exists and belongs to user
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', id)
      .eq('userid', userId)
      .in('type', ['income', 'expense'])
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('user_data')
      .delete()
      .eq('id', id)
      .eq('userid', userId)

    if (error) {
      console.error('Transaction delete error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete transaction'
      }, { status: 500 })
    }

    console.log('Transaction deleted successfully:', id)

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: existingTransaction
    })

  } catch (error) {
    console.error('Transactions DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}