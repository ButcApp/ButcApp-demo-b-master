import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-service'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client directly
const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authentication middleware
async function authenticate(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
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

// GET /api/data/balances - Fetch user balances
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Use authenticated user's ID instead of requiring userId parameter
    const userId = auth.user.id

    // Get user profile with balance information
    const { data: userProfileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('userid', userId)
      .limit(1)

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({
        success: false,
        error: 'Profile fetch failed'
      }, { status: 500 })
    }

    const userProfile = userProfileData && userProfileData.length > 0 ? userProfileData[0] : null

    if (!userProfile) {
      // Create default profile if not exists
      const { data: newProfileData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: `profile_${userId}_${Date.now()}`,
          userid: userId,
          email: '',
          fullname: '',
          cash: 0,
          bank: 0,
          savings: 0
        })
        .select()
        .single()

      if (insertError) {
        console.error('Profile creation error:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Profile creation failed'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: newProfileData
      })
    }

    return NextResponse.json({
      success: true,
      data: userProfile
    })

  } catch (error) {
    console.error('Balances GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/data/balances - Update user balances
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()

    // Use authenticated user's ID instead of requiring userId parameter
    const userId = auth.user.id

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('userid', userId)
      .limit(1)

    const updateData = {
      cash: parseFloat(body.cash) || 0,
      bank: parseFloat(body.bank) || 0,
      savings: parseFloat(body.savings) || 0,
      email: body.email || '',
      fullname: body.fullName || '',
      updatedat: new Date().toISOString()
    }

    let updatedProfile

    if (existingProfile && existingProfile.length > 0) {
      // Update existing profile
      const { data } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('userid', userId)
        .select()
        .single()
      updatedProfile = data
    } else {
      // Create new profile
      const { data } = await supabase
        .from('user_profiles')
        .insert({
          id: `profile_${userId}_${Date.now()}`,
          userid: userId,
          ...updateData,
          createdat: new Date().toISOString()
        })
        .select()
        .single()
      updatedProfile = data
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile
    })

  } catch (error) {
    console.error('Balances PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}