import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Endpoint GET para probar la conexión
export async function GET() {
  try {
    console.log('🧪 Probando conexión a BD...')
    
    // Probar una consulta simple
    const { data, error } = await supabase
      .from('usuario')
      .select('user_id, telefono')
      .limit(1)
    
    if (error) {
      console.error('❌ Error en conexión BD:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      })
    }
    
    console.log('✅ Conexión BD exitosa:', data)
    return NextResponse.json({
      success: true,
      message: 'Conexión a BD exitosa',
      sampleData: data
    })
    
  } catch (error) {
    console.error('❌ Error en GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    console.log('📞 API check-phone recibió:', phone)

    if (!phone) {
      console.log('❌ No se proporcionó teléfono')
      return NextResponse.json(
        { error: 'Teléfono es requerido' },
        { status: 400 }
      )
    }

    // Limpiar el teléfono (remover espacios, guiones, paréntesis)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    console.log('📞 Teléfono limpio:', cleanPhone)

    // Verificar si el teléfono ya existe en la base de datos
    console.log('📞 Consultando BD...')
    console.log('📞 Tabla: usuario, Campo: telefono, Valor:', cleanPhone)
    
    const { data: existingUser, error } = await supabase
      .from('usuario')
      .select('user_id, telefono, activo')
      .eq('telefono', cleanPhone)
      .maybeSingle()
    
    console.log('📞 Resultado de BD:', { 
      existingUser, 
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details
      } : null
    })

    if (error) {
      console.error('Error checking phone:', error)
      return NextResponse.json(
        { error: 'Error al verificar teléfono' },
        { status: 500 }
      )
    }

    // Si existe un usuario con ese teléfono
    if (existingUser) {
      console.log('📞 Teléfono encontrado:', existingUser)
      return NextResponse.json({
        exists: true,
        active: existingUser.activo,
        message: existingUser.activo 
          ? 'Este número de teléfono ya está registrado.'
          : 'Este número de teléfono está asociado a una cuenta desactivada.'
      })
    }

    // El teléfono no existe
    console.log('📞 Teléfono no encontrado, disponible')
    return NextResponse.json({
      exists: false,
      message: ''
    })

  } catch (error) {
    console.error('Error in check-phone API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
