import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostsWithFallback } from '@/lib/supabase-config'

// GET - Fetch single blog post by slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // Get posts with fallback
    const posts = await getBlogPostsWithFallback()
    
    // Find the specific post by slug
    const post = posts.find(p => p.slug === slug)

    if (!post) {
      return NextResponse.json({ 
        success: false, 
        error: 'Blog post not found' 
      }, { status: 404 })
    }

    // Get related posts (same category, excluding current post)
    const relatedPosts = posts
      .filter(p => p.category === post.category && p.id !== post.id)
      .slice(0, 3)
      .map(relatedPost => ({
        id: relatedPost.id,
        title: relatedPost.title,
        slug: relatedPost.slug,
        excerpt: relatedPost.excerpt,
        coverImage: relatedPost.coverImage,
        category: relatedPost.category,
        publishedAt: relatedPost.publishedAt,
        readingTime: relatedPost.readingTime,
        featured: relatedPost.featured
      }))

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        views: post.views + 1 // Increment view count
      },
      relatedPosts
    })

  } catch (error) {
    console.error('Blog post API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}