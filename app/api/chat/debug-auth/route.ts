import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Verificando autenticación...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client no disponible' }, { status: 500 })
    }

    // Verificar headers de autenticación
    const authHeader = request.headers.get('authorization')
    const cookies = request.headers.get('cookie')
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      hasAuthHeader: !!authHeader,
      authHeaderValue: authHeader ? 'Presente' : 'Ausente',
      hasCookies: !!cookies,
      cookiesValue: cookies ? 'Presente' : 'Ausente',
      cookieNames: cookies ? cookies.split(';').map(c => c.split('=')[0].trim()) : [],
      tokenFound: false,
      user: null,
      authError: null
    }

    // Buscar token en header
    let token = null
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
      debugInfo.tokenFound = true
      debugInfo.tokenSource = 'Authorization header'
    } else if (cookies) {
      // Buscar token en cookies
      const supabaseTokenMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/)
      if (supabaseTokenMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(supabaseTokenMatch[1]))
          token = tokenData.access_token
          debugInfo.tokenFound = true
          debugInfo.tokenSource = 'Cookies'
        } catch (e) {
          debugInfo.cookieParseError = e.message
        }
      }
    }

    if (token) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError) {
          debugInfo.authError = authError.message
        } else if (user) {
          debugInfo.user = {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          }
        }
      } catch (e: any) {
        debugInfo.authError = e.message
      }
    }

    return NextResponse.json(debugInfo)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      stack: e?.stack 
    }, { status: 500 })
  }
}

