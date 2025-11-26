import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

async function authUser(req: NextRequest) {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  
  const { data } = await supabase.auth.getUser(token)
  if (!data?.user) return null

  // Obtener usuario de la base de datos
  const { data: userData } = await supabase
    .from('usuario')
    .select('user_id, email, nombre, apellido, es_fundacion, nombre_fundacion')
    .eq('email', data.user.email)
    .single()

  return userData || null
}

// POST - Notificar a administradores que se subieron documentos
export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario es una fundación
    if (!user.es_fundacion) {
      return NextResponse.json({ 
        error: 'Solo las fundaciones pueden usar este endpoint' 
      }, { status: 403 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Obtener todos los administradores
    const { data: admins, error: adminsError } = await supabase
      .from('usuario')
      .select('user_id, nombre, apellido')
      .eq('es_admin', true)
      .eq('activo', true)

    if (adminsError) {
      console.error('Error obteniendo administradores:', adminsError)
      return NextResponse.json({ error: adminsError.message }, { status: 400 })
    }

    if (!admins || admins.length === 0) {
      console.warn('No hay administradores activos para notificar')
      return NextResponse.json({ 
        success: true, 
        message: 'No hay administradores para notificar' 
      })
    }

    // Crear notificaciones para cada administrador
    const notificaciones = admins.map(admin => ({
      usuario_id: admin.user_id,
      tipo: 'documentos_fundacion_subidos',
      titulo: '📄 Documentos de fundación pendientes',
      mensaje: `${user.nombre_fundacion || user.nombre} ha subido documentación para verificación`,
      datos_adicionales: {
        fundacion_id: user.user_id,
        fundacion_nombre: user.nombre_fundacion,
        usuario_nombre: `${user.nombre} ${user.apellido}`,
        fecha_subida: new Date().toISOString(),
        accion_requerida: 'revisar_documentos'
      },
      leida: false,
      es_push: true,
      es_email: false
    }))

    const { error: insertError } = await supabase
      .from('notificacion')
      .insert(notificaciones)

    if (insertError) {
      console.error('Error creando notificaciones:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    console.log(`✅ Notificaciones enviadas a ${admins.length} administradores`)

    return NextResponse.json({ 
      success: true, 
      message: `Notificaciones enviadas a ${admins.length} administradores`,
      admins_notificados: admins.length
    })

  } catch (error: any) {
    console.error('Error en POST foundation/notify-document:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

