import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Iniciando test de subida...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ [TEST] Supabase client no disponible')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    let token = null
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
      console.log('🔐 [TEST] Token encontrado en header')
    } else {
      console.error('❌ [TEST] No se encontró token de autorización')
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    // Verificar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('❌ [TEST] Error de autenticación:', authError.message)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ [TEST] Usuario no encontrado')
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }
    
    console.log('✅ [TEST] Usuario autenticado:', user.id)

    // Test simple de subida
    const testFileName = `test_${Date.now()}.txt`
    const testContent = new Uint8Array(Buffer.from('Test content'))
    
    console.log('🔄 [TEST] Intentando subir archivo de prueba...')
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Ecoswap')
      .upload(`test/${testFileName}`, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ [TEST] Error en subida:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.statusCode
      })
      return NextResponse.json({ 
        error: 'Error en subida de prueba',
        details: uploadError.message,
        code: uploadError.statusCode
      }, { status: 500 })
    }

    console.log('✅ [TEST] Subida exitosa:', uploadData)

    // Limpiar archivo de prueba
    await supabase.storage
      .from('Ecoswap')
      .remove([`test/${testFileName}`])

    return NextResponse.json({ 
      success: true,
      message: 'Test de subida exitoso',
      uploadData,
      user: {
        id: user.id,
        email: user.email
      }
    })

  } catch (error: any) {
    console.error('❌ [TEST] Error inesperado:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}