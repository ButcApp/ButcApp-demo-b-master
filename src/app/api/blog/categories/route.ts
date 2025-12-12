import { NextRequest, NextResponse } from 'next/server'
import { getCategoriesWithFallback } from '@/lib/supabase-config'

// GET - Fetch blog categories
export async function GET(request: NextRequest) {
  try {
    // Get categories with fallback
    const categories = await getCategoriesWithFallback()

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}