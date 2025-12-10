import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID gerekli' },
        { status: 400 }
      )
    }

    // Kullanıcı ID'sine göre tüm verileri sıfırla
    const resetPromises = [
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/balances/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/transactions/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/notes/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/data/recurring-transactions/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
    ]

    // Tüm sıfırlama işlemlerini paralel çalıştır
    const results = await Promise.allSettled(resetPromises)
    
    const errors = results.filter(result => result.status === 'rejected')
    
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Bazı veriler sıfırlanamadı',
          details: errors.map(err => err.reason).filter(Boolean)
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Tüm veriler başarıyla sıfırlandı',
        resetCount: results.length
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset API Error:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}