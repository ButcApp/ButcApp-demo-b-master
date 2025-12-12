import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostsWithFallback } from '@/lib/supabase-config'

// GET - Fetch blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    // Get posts with fallback
    let posts = await getBlogPostsWithFallback()

    // Apply filters
    if (category && category !== 'all') {
      posts = posts.filter(post => post.category === category)
    }
    if (featured === 'true') {
      posts = posts.filter(post => post.featured)
    }
    if (search) {
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.content.toLowerCase().includes(search.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedPosts = posts.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedPosts,
      pagination: {
        page,
        limit,
        total: posts.length,
        totalPages: Math.ceil(posts.length / limit)
      }
    })

  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content || !body.excerpt) {
      return NextResponse.json({ 
        success: false,
        error: 'Title, content, and excerpt are required' 
      }, { status: 400 })
    }

    // Generate slug from title
    const slug = body.slug || body.title
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Create blog post
    const blogPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: body.title.trim(),
      slug: slug,
      excerpt: body.excerpt.trim(),
      content: body.content.trim(),
      authorid: `author_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      authorname: body.author?.name || 'ButcApp Team',
      category: body.category,
      status: body.status || 'draft'
    }

    const { data: newPost, error } = await supabase
      .from('blog_posts')
      .insert([blogPost])
      .select()
      .single()

    if (error) {
      console.error('Blog post creation error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      console.error('Blog post data attempted:', blogPost)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create blog post',
        details: error.message 
      }, { status: 500 })
    }

    // Transform response
    const transformedPost = {
      id: newPost.id,
      title: newPost.title,
      slug: newPost.slug,
      excerpt: newPost.excerpt,
      content: newPost.content,
      status: newPost.status
    }

    return NextResponse.json({ 
      success: true,
      message: 'Blog post created successfully',
      data: transformedPost 
    }, { status: 201 })

  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}