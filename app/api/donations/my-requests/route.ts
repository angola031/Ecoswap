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

  const { data: userData } = await supabase
    .from('usuario')
    .select('user_id, email, nombre, apellido')
    .eq('email', data.user.email)
    .single()

  return userData || null
}

// GET - Obtener mis solicitudes de donación
export async function GET(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    const { data: requests, error } = await supabase
      .from('propuesta')
      .select(`
        propuesta_id,
        descripcion,
        estado,
        fecha_creacion,
        fecha_respuesta,
        respuesta,
        chat:chat_id(
          intercambio:intercambio_id(
            producto_solicitado:producto_solicitado_id(
              producto_id,
              titulo,
              descripcion,
              precio,
              imagen_producto(url_imagen, es_principal)
            )
          )
        ),
        usuario_recibe:usuario_recibe_id(nombre, apellido, foto_perfil)
      `)
      .eq('usuario_propone_id', user.user_id)
      .like('descripcion', 'Solicitud de donación:%')
      .order('fecha_creacion', { ascending: false })

    if (error) {
      console.error('Error obteniendo solicitudes:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Formatear respuesta
    const formattedRequests = (requests || []).map(req => ({
      propuesta_id: req.propuesta_id,
      descripcion: req.descripcion,
      estado: req.estado,
      fecha_creacion: req.fecha_creacion,
      fecha_respuesta: req.fecha_respuesta,
      respuesta: req.respuesta,
      producto: req.chat?.[0]?.intercambio?.[0]?.producto_solicitado?.[0] || null,
      donador: req.usuario_recibe?.[0] || null
    }))

    return NextResponse.json({ requests: formattedRequests })

  } catch (error: any) {
    console.error('Error en GET my-requests:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

