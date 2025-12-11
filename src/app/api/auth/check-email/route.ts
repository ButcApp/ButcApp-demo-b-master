import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Hardcoded Supabase configuration
const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHECK EMAIL API START ===')
    
    const body = await request.json()
    const { email } = body

    if (!email) {
      console.log('❌ No email provided')
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    console.log('🔍 Checking email existence:', email)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email)
      return NextResponse.json({
        success: false,
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Check if user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .limit(1)

    if (error) {
      console.error('❌ Error checking email:', error)
      return NextResponse.json({
        success: false,
        error: 'Database error'
      }, { status: 500 })
    }

    const exists = user && user.length > 0
    
    console.log('✅ Email check completed for:', email, 'Exists:', exists)
    console.log('=== CHECK EMAIL API END ===')

    return NextResponse.json({
      success: true,
      exists: exists
    })

  } catch (error) {
    console.error('❌ Check email API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 })
  }
}