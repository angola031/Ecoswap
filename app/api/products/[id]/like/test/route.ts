import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🧪 TEST - Verificando configuración de likes...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client no disponible',
        config: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 })
    }

    const productoId = Number(params.id)
    
    // Verificar autenticación
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    
    const testInfo: any = {
      productoId,
      isProductIdValid: !isNaN(productoId) && productoId > 0,
      hasAuthHeader: !!auth,
      hasToken: !!token,
      tokenLength: token.length,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      authUser: null,
      authError: null,
      usuarioFound: false,
      usuarioError: null,
      usuarioData: null,
      favoritoTableAccessible: false,
      favoritoError: null,
      favoritoSample: null
    }

    if (token) {
      try {
        const { data, error } = await supabase.auth.getUser(token)
        testInfo.authUser = data?.user?.id || null
        testInfo.authError = error?.message || null
        
        if (data?.user?.id) {
          // Intentar buscar el usuario en la tabla usuario
          const { data: usuario, error: usuarioError } = await supabase
            .from('usuario')
            .select('user_id, nombre, email')
            .eq('auth_user_id', data.user.id)
            .single()
          
          testInfo.usuarioFound = !!usuario
          testInfo.usuarioError = usuarioError?.message || null
          testInfo.usuarioData = usuario ? { user_id: usuario.user_id, nombre: usuario.nombre } : null
        }
      } catch (authError: any) {
        testInfo.authError = authError.message
      }
    }

    // Intentar una consulta simple a la tabla favorito
    try {
      const { data: favoritos, error: favoritoError } = await supabase
        .from('favorito')
        .select('favorito_id, usuario_id, producto_id')
        .limit(1)
      
      testInfo.favoritoTableAccessible = !favoritoError
      testInfo.favoritoError = favoritoError?.message || null
      testInfo.favoritoSample = favoritos?.[0] || null
    } catch (favoritoError: any) {
      testInfo.favoritoTableAccessible = false
      testInfo.favoritoError = favoritoError.message
    }

    return NextResponse.json(testInfo)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      stack: e?.stack 
    }, { status: 500 })
  }
}
