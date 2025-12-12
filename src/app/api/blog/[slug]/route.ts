import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostBySlug, getRelatedPosts } from '@/lib/blog-service'

// GET - Fetch single blog post by slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // Blog post'unu getir
    const post = await getBlogPostBySlug(slug)

    if (!post) {
      return NextResponse.json({ 
        success: false, 
        error: 'Blog post not found' 
      }, { status: 404 })
    }

    // İlgili post'ları getir
    const relatedPosts = await getRelatedPosts(post.id, post.category, 3)

    return NextResponse.json({
      success: true,
      post,
      relatedPosts
    })

  } catch (error) {
    console.error('Blog post API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}