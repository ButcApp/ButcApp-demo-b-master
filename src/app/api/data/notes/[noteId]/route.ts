import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { createClient } from '@supabase/supabase-js'

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

// GET /api/data/notes/[noteId] - Fetch specific note
export async function GET(request: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: note, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', noteId)
      .eq('userid', auth.user.id)
      .eq('type', 'note')
      .single()

    if (error) {
      console.error('Note GET error:', error)
      return NextResponse.json({
        success: false,
        error: 'Note not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: note
    })

  } catch (error) {
    console.error('Note GET error:', error)
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

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, content'
      }, { status: 400 })
    }

    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userid: auth.user.id,
      type: 'note',
      title: body.title.trim(),
      content: body.content.trim(),
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_data')
      .insert(note)
      .select()
      .single()

    if (error) {
      console.error('Note creation error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create note'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Note POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/data/notes/[noteId] - Update note
export async function PUT(request: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params
    
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()

    // Check if note belongs to user
    const { data: existingNote, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', noteId)
      .eq('userid', auth.user.id)
      .eq('type', 'note')
      .single()

    if (fetchError || !existingNote) {
      return NextResponse.json({
        success: false,
        error: 'Note not found'
      }, { status: 404 })
    }

    const updateData = {
      title: body.title?.trim() || existingNote.title,
      content: body.content?.trim() || existingNote.content,
      updatedat: new Date().toISOString()
    }

    const { data, error: updateError } = await supabase
      .from('user_data')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single()

    if (updateError) {
      console.error('Note update error:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update note'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Note PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE /api/data/notes/[noteId] - Delete note
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Check if note belongs to user
    const { data: existingNote, error: fetchError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', noteId)
      .eq('userid', auth.user.id)
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

    if (deleteError) {
      console.error('Note delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete note'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    })

  } catch (error) {
    console.error('Note DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}