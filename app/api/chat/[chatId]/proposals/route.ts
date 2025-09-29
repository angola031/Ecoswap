import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuario de la base de datos
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const userId = usuario.user_id

    // Obtener datos del body
    const body = await req.json()
    const { 
      tipo_propuesta, 
      descripcion, 
      precio_propuesto, 
      condiciones, 
      fecha_encuentro, 
      lugar_encuentro,
      archivos_adjuntos 
    } = body

    // Validar datos requeridos
    if (!tipo_propuesta || !descripcion) {
      return NextResponse.json({ error: 'Tipo de propuesta y descripción son requeridos' }, { status: 400 })
    }

    // Verificar que el usuario tiene acceso al chat
    const { data: chat, error: chatError } = await supabase
      .from('chat')
      .select(`
        chat_id,
        intercambio:intercambio_id (
          intercambio_id,
          usuario_propone_id,
          usuario_recibe_id
        )
      `)
      .eq('chat_id', chatId)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
    }

    const intercambio = chat.intercambio
    if (!intercambio) {
      return NextResponse.json({ error: 'Intercambio no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario es parte del intercambio
    if (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId) {
      return NextResponse.json({ error: 'No autorizado para este chat' }, { status: 403 })
    }

    // Crear propuesta
    const { data: propuesta, error: propuestaError } = await supabase
      .from('propuesta_intercambio')
      .insert({
        intercambio_id: intercambio.intercambio_id,
        propuesta_por_id: userId,
        tipo_propuesta,
        descripcion,
        precio_propuesto: precio_propuesto || null,
        condiciones: condiciones || null,
        fecha_encuentro: fecha_encuentro ? new Date(fecha_encuentro).toISOString() : null,
        lugar_encuentro: lugar_encuentro || null,
        archivos_adjuntos: archivos_adjuntos || null,
        estado: 'pendiente'
      })
      .select()
      .single()

    if (propuestaError) {
      console.error('Error creando propuesta:', propuestaError)
      return NextResponse.json({ error: 'Error creando propuesta' }, { status: 500 })
    }

    // Crear mensaje automático en el chat
    const mensajeContenido = `📋 Nueva propuesta: ${tipo_propuesta}\n\n${descripcion}${
      precio_propuesto ? `\n💰 Precio propuesto: $${precio_propuesto.toLocaleString()}` : ''
    }${condiciones ? `\n📝 Condiciones: ${condiciones}` : ''}${
      fecha_encuentro ? `\n📅 Fecha encuentro: ${new Date(fecha_encuentro).toLocaleDateString('es-CO')}` : ''
    }${lugar_encuentro ? `\n📍 Lugar: ${lugar_encuentro}` : ''}`

    const { error: mensajeError } = await supabase
      .from('mensaje')
      .insert({
        chat_id: parseInt(chatId),
        usuario_id: userId,
        contenido: mensajeContenido,
        tipo: 'propuesta',
        metadata: {
          propuesta_id: propuesta.propuesta_id,
          tipo_propuesta,
          estado: 'pendiente'
        }
      })

    if (mensajeError) {
      console.error('Error creando mensaje de propuesta:', mensajeError)
    }

    // Crear notificación para el otro usuario
    const otroUsuarioId = intercambio.usuario_propone_id === userId 
      ? intercambio.usuario_recibe_id 
      : intercambio.usuario_propone_id

    await supabase
      .from('notificacion')
      .insert({
        usuario_id: otroUsuarioId,
        tipo: 'nueva_propuesta',
        titulo: 'Nueva Propuesta Recibida',
        mensaje: `Has recibido una nueva propuesta de ${tipo_propuesta}`,
        datos_adicionales: {
          propuesta_id: propuesta.propuesta_id,
          chat_id: chatId,
          intercambio_id: intercambio.intercambio_id
        }
      })

    return NextResponse.json({
      success: true,
      propuesta,
      message: 'Propuesta creada exitosamente'
    })

  } catch (error) {
    console.error('Error en API de propuestas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = params.chatId
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuario de la base de datos
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener propuestas del chat
    const { data: propuestas, error } = await supabase
      .from('propuesta_intercambio')
      .select(`
        propuesta_id,
        intercambio_id,
        propuesta_por_id,
        tipo_propuesta,
        descripcion,
        precio_propuesto,
        condiciones,
        fecha_encuentro,
        lugar_encuentro,
        archivos_adjuntos,
        estado,
        fecha_creacion,
        fecha_respuesta,
        respuesta_usuario_id,
        respuesta_comentario,
        intercambio:intercambio_id (
          chat:chat_id
        ),
        propuesta_por:propuesta_por_id (
          user_id,
          nombre,
          apellido,
          foto_perfil
        ),
        respuesta_usuario:respuesta_usuario_id (
          user_id,
          nombre,
          apellido,
          foto_perfil
        )
      `)
      .eq('intercambio.chat_id', chatId)
      .order('fecha_creacion', { ascending: false })

    if (error) {
      console.error('Error obteniendo propuestas:', error)
      return NextResponse.json({ error: 'Error obteniendo propuestas' }, { status: 500 })
    }

    return NextResponse.json({ propuestas: propuestas || [] })

  } catch (error) {
    console.error('Error en API de propuestas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
