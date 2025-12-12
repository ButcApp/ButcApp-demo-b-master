import { NextRequest, NextResponse } from 'next/server'
import { getBlogCategories } from '@/lib/blog-service'

// GET - Fetch blog categories
export async function GET(request: NextRequest) {
  try {
    // Kategorileri getir
    const categories = await getBlogCategories()

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}