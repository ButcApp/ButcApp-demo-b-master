import { NextRequest, NextResponse } from 'next/server'
import { getBlogPosts } from '@/lib/blog-service'

// GET - Fetch blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    // Offset hesapla
    const offset = (page - 1) * limit

    // Blog post'larını getir
    const posts = await getBlogPosts({
      category: category || undefined,
      featured: featured === 'true',
      search: search || undefined,
      limit,
      offset
    })

    // Toplam sayıyı almak için ayrı sorgu
    const totalPosts = await getBlogPosts({
      category: category || undefined,
      featured: featured === 'true',
      search: search || undefined
    })

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total: totalPosts.length,
        totalPages: Math.ceil(totalPosts.length / limit)
      }
    })

  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}