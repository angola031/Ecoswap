import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [VALIDATE AUTH] Iniciando validación completa de autenticación...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ [VALIDATE AUTH] Supabase client no disponible')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Obtener todos los headers para debug
    const headers = Object.fromEntries(request.headers.entries())
    
    const validationResult: any = {
      timestamp: new Date().toISOString(),
      requestInfo: {
        method: request.method,
        url: request.url,
        hasFormData: false,
        formDataFields: []
      },
      authentication: {
        hasAuthHeader: false,
        authHeaderValue: null,
        hasCookies: false,
        cookieNames: [],
        tokenFound: false,
        tokenSource: null,
        tokenLength: 0,
        tokenValid: false,
        tokenExpired: false,
        tokenExpiresAt: null
      },
      supabase: {
        clientAvailable: true,
        sessionValid: false,
        userInfo: null,
        sessionInfo: null,
        authError: null
      },
      storage: {
        canAccess: false,
        bucketExists: false,
        bucketError: null
      }
    }

    // 1. Verificar FormData
    try {
      const formData = await request.formData()
      validationResult.requestInfo.hasFormData = true
      
      // Obtener todos los campos del FormData (compatible con targets antiguos)
      const entries = Array.from(formData.entries()) as [string, FormDataEntryValue][]
      for (const [key, value] of entries) {
        if (value instanceof File) {
          validationResult.requestInfo.formDataFields.push({
            name: key,
            type: 'file',
            fileName: value.name,
            fileSize: value.size,
            fileType: value.type
          })
        } else {
          validationResult.requestInfo.formDataFields.push({
            name: key,
            type: 'text',
            value: value.toString()
          })
        }
      }
    } catch (e) {
      validationResult.requestInfo.formDataError = e.message
    }

    // 2. Verificar autenticación
    const authHeader = request.headers.get('authorization')
    const cookies = request.headers.get('cookie')
    
    validationResult.authentication.hasAuthHeader = !!authHeader
    validationResult.authentication.authHeaderValue = authHeader ? 'Presente' : 'Ausente'
    validationResult.authentication.hasCookies = !!cookies
    validationResult.authentication.cookieNames = cookies ? cookies.split(';').map(c => c.split('=')[0].trim()) : []

    // 3. Buscar token
    let token = null
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
      validationResult.authentication.tokenFound = true
      validationResult.authentication.tokenSource = 'Authorization header'
      validationResult.authentication.tokenLength = token.length
    } else if (cookies) {
      // Buscar token en cookies de Supabase
      const supabaseTokenMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/)
      if (supabaseTokenMatch) {
        try {
          const tokenData = JSON.parse(decodeURIComponent(supabaseTokenMatch[1]))
          token = tokenData.access_token
          validationResult.authentication.tokenFound = true
          validationResult.authentication.tokenSource = 'Cookies'
          validationResult.authentication.tokenLength = token ? token.length : 0
        } catch (e) {
          validationResult.authentication.cookieParseError = e.message
        }
      }
    }

    // 4. Validar token con Supabase
    if (token) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        
        if (authError) {
          validationResult.supabase.authError = authError.message
          validationResult.authentication.tokenValid = false
        } else if (user) {
          validationResult.authentication.tokenValid = true
          validationResult.supabase.userInfo = {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            email_confirmed_at: user.email_confirmed_at
          }
          validationResult.supabase.sessionValid = true
        }

        // Verificar sesión completa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          validationResult.supabase.sessionError = sessionError.message
        } else if (session) {
          validationResult.supabase.sessionInfo = {
            hasSession: true,
            expiresAt: session.expires_at,
            expiresAtDate: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            isExpired: session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false,
            tokenType: session.token_type,
            provider: session.user?.app_metadata?.provider
          }
          validationResult.authentication.tokenExpiresAt = session.expires_at
          validationResult.authentication.tokenExpired = session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false
        }
      } catch (e: any) {
        validationResult.supabase.authError = e.message
      }
    }

    // 5. Verificar acceso a storage
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (bucketError) {
        validationResult.storage.bucketError = bucketError.message
      } else {
        const ecoswapBucket = buckets?.find(b => b.name === 'Ecoswap')
        validationResult.storage.bucketExists = !!ecoswapBucket
        validationResult.storage.canAccess = !!ecoswapBucket
        
        if (ecoswapBucket) {
          validationResult.storage.bucketInfo = {
            name: ecoswapBucket.name,
            id: ecoswapBucket.id,
            public: ecoswapBucket.public,
            created_at: ecoswapBucket.created_at
          }
        }
      }
    } catch (e: any) {
      validationResult.storage.bucketError = e.message
    }

    // 6. Determinar si puede proceder con la subida
    validationResult.canProceed = validationResult.authentication.tokenValid && 
                                  validationResult.supabase.sessionValid && 
                                  validationResult.storage.canAccess &&
                                  !validationResult.authentication.tokenExpired

    console.log('✅ [VALIDATE AUTH] Validación completada:', {
      canProceed: validationResult.canProceed,
      tokenValid: validationResult.authentication.tokenValid,
      sessionValid: validationResult.supabase.sessionValid,
      canAccessStorage: validationResult.storage.canAccess
    })

    // Si la validación es exitosa, simular una respuesta de subida exitosa
    if (validationResult.canProceed) {
      const mockResponse = {
        success: true,
        data: {
          fileName: 'test_validation.txt',
          url: 'https://example.com/test-validation.txt',
          originalName: 'test.txt',
          size: 12,
          type: 'text/plain',
          path: 'mensajes/chat_test/test_validation.txt',
          validationPassed: true
        }
      }
      console.log('✅ [VALIDATE AUTH] Devolviendo respuesta simulada exitosa')
      return NextResponse.json(mockResponse)
    }

    // Si la validación falla, devolver error
    return NextResponse.json({ 
      error: 'Validación de autenticación falló',
      details: validationResult,
      canProceed: false
    }, { status: 401 })

  } catch (error: any) {
    console.error('❌ [VALIDATE AUTH] Error inesperado:', error.message)
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
