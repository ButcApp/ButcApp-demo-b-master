import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Token verification
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await verifyAdminToken(token)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const postId = id

    // Delete blog post
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      console.error('Delete post error:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete blog post'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    })

  } catch (error) {
    console.error('Delete post API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Token verification
    const token = request.cookies.get('auth-token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = await verifyAdminToken(token)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const postId = id
    const body = await request.json()

    // Update blog post
    const { data: post, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        status: body.status,
        category: body.category,
        tags: JSON.stringify(body.tags || []),
        meta_title: body.metaTitle,
        meta_description: body.metaDescription,
        meta_keywords: JSON.stringify(body.metaKeywords || []),
        featured: body.featured,
        published_at: body.status === 'published' && !body.publishedAt ? new Date() : body.publishedAt,
        updated_at: new Date()
      })
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('Update post error:', updateError)
      return NextResponse.json({
        error: 'Failed to update blog post'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: post
    })

  } catch (error) {
    console.error('Update post API error:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}