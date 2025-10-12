import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Endpoint GET para probar la conexión
export async function GET() {
  try {
    // Probar una consulta simple
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase no está configurado' }, { status: 500 })
    }
    
    const { data, error } = await supabase
      .from('usuario')
      .select('user_id, telefono')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a BD exitosa',
      sampleData: data
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Teléfono es requerido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Limpiar el teléfono (remover espacios, guiones, paréntesis)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

    // Verificar si el teléfono ya existe en la base de datos
    const { data: existingUsers, error } = await supabase
      .from('usuario')
      .select('user_id, telefono, activo')
      .eq('telefono', cleanPhone)

    if (error) {
      console.error('Error checking phone:', error)
      return NextResponse.json(
        { error: 'Error al verificar teléfono' },
        { status: 500 }
      )
    }

    // Si existen usuarios con ese teléfono
    if (existingUsers && existingUsers.length > 0) {
      // Verificar si hay al menos un usuario activo
      const activeUser = existingUsers.find(user => user.activo)
      
      if (activeUser) {
        return NextResponse.json({
          exists: true,
          active: true,
          message: 'Este número de teléfono ya está registrado.'
        })
      } else {
        return NextResponse.json({
          exists: true,
          active: false,
          message: 'Este número de teléfono está asociado a una cuenta desactivada.'
        })
      }
    }

    // El teléfono no existe
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
