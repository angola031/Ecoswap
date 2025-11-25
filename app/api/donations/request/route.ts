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
    .select('user_id, email, nombre, apellido')
    .eq('email', data.user.email)
    .single()

  return userData || null
}

// POST - Crear solicitud de donación
export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { producto_id, mensaje, owner_id } = body

    if (!producto_id || !mensaje || !owner_id) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: producto_id, mensaje, owner_id' 
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Verificar que el producto existe y es tipo donación
    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('producto_id, titulo, tipo_transaccion, user_id')
      .eq('producto_id', producto_id)
      .single()

    if (productoError || !producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (producto.tipo_transaccion !== 'donacion') {
      return NextResponse.json({ error: 'Este producto no es una donación' }, { status: 400 })
    }

    if (producto.user_id === user.user_id) {
      return NextResponse.json({ error: 'No puedes solicitar tu propia donación' }, { status: 400 })
    }

    // Verificar o crear chat entre usuarios
    let chatId = null
    
    // Buscar intercambio existente para este producto
    const { data: existingIntercambio } = await supabase
      .from('intercambio')
      .select('intercambio_id, chat(chat_id)')
      .eq('producto_solicitado_id', producto_id)
      .eq('usuario_propone_id', user.user_id)
      .eq('usuario_recibe_id', owner_id)
      .single()

    if (existingIntercambio && existingIntercambio.chat) {
      chatId = existingIntercambio.chat[0]?.chat_id
    }

    // Si no existe chat, crear intercambio y chat
    if (!chatId) {
      // Crear intercambio
      const { data: nuevoIntercambio, error: intercambioError } = await supabase
        .from('intercambio')
        .insert({
          producto_solicitado_id: producto_id,
          usuario_propone_id: user.user_id,
          usuario_recibe_id: owner_id,
          mensaje_propuesta: mensaje,
          estado: 'pendiente'
        })
        .select()
        .single()

      if (intercambioError) {
        console.error('Error creando intercambio:', intercambioError)
        return NextResponse.json({ error: intercambioError.message }, { status: 400 })
      }

      // Crear chat
      const { data: nuevoChat, error: chatError } = await supabase
        .from('chat')
        .insert({
          intercambio_id: nuevoIntercambio.intercambio_id
        })
        .select()
        .single()

      if (chatError) {
        console.error('Error creando chat:', chatError)
        return NextResponse.json({ error: chatError.message }, { status: 400 })
      }

      chatId = nuevoChat.chat_id
    }

    // Crear la solicitud de donación como una propuesta
    const { data: solicitud, error: solicitudError } = await supabase
      .from('propuesta')
      .insert({
        chat_id: chatId,
        usuario_propone_id: user.user_id,
        usuario_recibe_id: owner_id,
        tipo_propuesta: 'otro',
        descripcion: `Solicitud de donación: ${mensaje}`,
        estado: 'pendiente'
      })
      .select(`
        propuesta_id,
        tipo_propuesta,
        descripcion,
        estado,
        fecha_creacion,
        usuario_propone:usuario_propone_id(user_id, nombre, apellido, email, foto_perfil),
        usuario_recibe:usuario_recibe_id(user_id, nombre, apellido, email, foto_perfil)
      `)
      .single()

    if (solicitudError) {
      console.error('Error creando solicitud:', solicitudError)
      return NextResponse.json({ error: solicitudError.message }, { status: 400 })
    }

    // Crear notificación para el dueño del producto
    try {
      await supabase
        .from('notificacion')
        .insert({
          usuario_id: owner_id,
          tipo: 'solicitud_donacion',
          titulo: '🎁 Nueva solicitud de donación',
          mensaje: `${user.nombre} ${user.apellido} ha solicitado tu donación: ${producto.titulo}`,
          metadata: {
            propuesta_id: solicitud.propuesta_id,
            producto_id: producto_id,
            chat_id: chatId,
            solicitante_id: user.user_id,
            solicitante_nombre: `${user.nombre} ${user.apellido}`
          },
          leida: false
        })
    } catch (notifError) {
      console.error('Error creando notificación:', notifError)
      // No fallar si la notificación falla
    }

    console.log('✅ Solicitud de donación creada:', {
      propuesta_id: solicitud.propuesta_id,
      chat_id: chatId,
      producto_id
    })

    return NextResponse.json({ 
      success: true, 
      solicitud,
      chat_id: chatId 
    })

  } catch (error: any) {
    console.error('Error en POST solicitud donación:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// GET - Obtener solicitudes de donación recibidas
export async function GET(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productoId = searchParams.get('producto_id')

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    let query = supabase
      .from('propuesta')
      .select(`
        propuesta_id,
        tipo_propuesta,
        descripcion,
        estado,
        fecha_creacion,
        fecha_respuesta,
        respuesta,
        chat_id,
        usuario_propone:usuario_propone_id(
          user_id,
          nombre,
          apellido,
          email,
          foto_perfil,
          calificacion_promedio,
          total_intercambios
        ),
        chat:chat_id(
          intercambio:intercambio_id(
            producto_solicitado:producto_solicitado_id(
              producto_id,
              titulo,
              descripcion,
              imagen_producto(url_imagen, es_principal)
            )
          )
        )
      `)
      .eq('usuario_recibe_id', user.user_id)
      .like('descripcion', 'Solicitud de donación:%')
      .order('fecha_creacion', { ascending: false })

    if (productoId) {
      // Filtrar por producto específico
      query = query.eq('chat.intercambio.producto_solicitado_id', productoId)
    }

    const { data: solicitudes, error } = await query

    if (error) {
      console.error('Error obteniendo solicitudes:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ solicitudes: solicitudes || [] })

  } catch (error: any) {
    console.error('Error en GET solicitudes donación:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

