import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = "https://dfiwgngtifuqrrxkvknn.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaXdnbmd0aWZ1cXJyeGt2a25uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI3NzMyMSwiZXhwIjoyMDgwODUzMzIxfQ.uCfJ5DzQ2QCiyXycTrHEaKh1EvAFbuP8HBORmBSPbX8";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email ve şifre gerekli'
      }, { status: 400 })
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10)

    // Kullanıcının şifresini güncelle
    const { data, error } = await supabase
      .from('users')
      .update({ passwordhash: hashedPassword })
      .eq('email', email.toLowerCase())

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json({
        success: false,
        error: 'Şifre güncellenemedi: ' + error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Şifre başarıyla güncellendi',
      updated: data
    })

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json({
      success: false,
      error: 'İşlem başarısız: ' + (error as Error).message
    }, { status: 500 })
  }
}