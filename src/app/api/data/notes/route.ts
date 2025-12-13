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
  const token = request.cookies.get('auth_token')?.value || 
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

// GET /api/data/notes - Fetch user notes
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

    console.log('Fetching notes for userId:', userId, { limit, offset })

    const { data: notes, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('userid', userId)
      .eq('type', 'note')
      .order('createdat', { ascending: false })
      .range(offset, limit)

    if (error) {
      console.error('Notes fetch error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch notes'
      }, { status: 500 })
    }

    console.log('Notes fetched successfully:', notes?.length || 0)

    return NextResponse.json({
      success: true,
      data: notes || [],
      pagination: {
        limit,
        offset,
        hasMore: notes && notes.length === limit
      }
    })

  } catch (error) {
    console.error('Notes GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST /api/data/notes - Create new note
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const body = await request.json()

    // Validate required fields
    const { title, content } = body
    
    if (!title || !content) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, content'
      }, { status: 400 })
    }

    console.log('Creating note:', { userId, title })

    const { data: note, error } = await supabase
      .from('user_data')
      .insert({
        id: `note_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userid: userId,
        type: 'note',
        title: title.trim(),
        content: content.trim(),
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Note creation error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create note'
      }, { status: 500 })
    }

    console.log('Note created successfully:', note.id)

    return NextResponse.json({
      success: true,
      data: note
    })

  } catch (error) {
    console.error('Notes POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/data/notes - Update note
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const body = await request.json()
    const { id, title, content } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Note ID is required'
      }, { status: 400 })
    }

    console.log('Updating note:', { id, userId, body })

    // First check if note exists and belongs to user
    const { data: existingNote, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', id)
      .eq('userid', userId)
      .eq('type', 'note')
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({
        success: false,
        error: 'Note not found'
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updatedat: new Date().toISOString()
    }

    if (title !== undefined) {
      updateData.title = title.trim()
    }

    if (content !== undefined) {
      updateData.content = content.trim()
    }

    const { data: updatedNote, error: updateError } = await supabase
      .from('user_data')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Note update error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update note'
      }, { status: 500 })
    }

    console.log('Note updated successfully:', id)

    return NextResponse.json({
      success: true,
      data: updatedNote
    })

  } catch (error) {
    console.error('Notes PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/data/notes/[noteId] - Delete note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const userId = auth.user.id
    const noteId = (await params).noteId

    if (!noteId) {
      return NextResponse.json({
        success: false,
        error: 'Note ID is required'
      }, { status: 400 })
    }

    console.log('Deleting note:', { noteId, userId })

    // First check if note exists and belongs to user
    const { data: existingNote, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', noteId)
      .eq('userid', userId)
      .eq('type', 'note')
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({
        success: false,
        error: 'Note not found'
      }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('user_data')
      .delete()
      .eq('id', noteId)
      .eq('userid', userId)

    if (deleteError) {
      console.error('Note delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete note'
      }, { status: 500 })
    }

    console.log('Note deleted successfully:', noteId)

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    })

  } catch (error) {
    console.error('Notes DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}