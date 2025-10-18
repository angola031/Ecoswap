import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG SESSION] Verificando sesión...')
    
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
      authError: null,
      sessionValid: false
    }

    // Buscar token en header
    let token = null
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
      debugInfo.tokenFound = true
      debugInfo.tokenSource = 'Authorization header'
      debugInfo.tokenLength = token.length
    } else if (cookies) {
      // Buscar token en cookies
      const supabaseTokenMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/)
      if (supabaseTokenMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(supabaseTokenMatch[1]))
          token = tokenData.access_token
          debugInfo.tokenFound = true
          debugInfo.tokenSource = 'Cookies'
          debugInfo.tokenLength = token ? token.length : 0
        } catch (e) {
          debugInfo.cookieParseError = e.message
        }
      }
    }

    if (token) {
      try {
        // Verificar token con Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError) {
          debugInfo.authError = authError.message
          debugInfo.sessionValid = false
        } else if (user) {
          debugInfo.user = {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at
          }
          debugInfo.sessionValid = true
          
          // Verificar también la sesión completa
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            debugInfo.sessionError = sessionError.message
          } else if (session) {
            debugInfo.sessionInfo = {
              hasSession: true,
              expiresAt: session.expires_at,
              isExpired: session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false,
              tokenType: session.token_type,
              provider: session.user?.app_metadata?.provider
            }
          } else {
            debugInfo.sessionInfo = {
              hasSession: false
            }
          }
        }
      } catch (e: any) {
        debugInfo.authError = e.message
        debugInfo.sessionValid = false
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

