import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

const supabase = getSupabaseClient()

async function getAuthUserId(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null

    // Intentar por auth_user_id
    const { data: usuarioByAuth } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioByAuth?.user_id) return usuarioByAuth.user_id

    // Fallback por email (comportamiento consistente con mensajes)
    if (user.email) {
      const { data: usuarioByEmail } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', user.email)
        .single()
      if (usuarioByEmail?.user_id) return usuarioByEmail.user_id
    }

    return null
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = parseInt(params.chatId)
    
    if (isNaN(chatId)) {
      console.error('❌ [API Proposals] ID de chat inválido:', params.chatId)
      return NextResponse.json({ error: 'ID de chat inválido' }, { status: 400 })
    }

    const userId = await getAuthUserId(request)
    
    if (!userId) {
      console.error('❌ [API Proposals] Usuario no autenticado')
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Verificar que el usuario tenga acceso al chat
    const { data: chat, error: chatError } = await supabase
      .from('chat')
      .select(`
        chat_id,
        intercambio (
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

    const intercambio = chat.intercambio as any
    if (!intercambio || (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId)) {
      return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
    }

    // Obtener propuestas del chat
    
    const { data: propuestas, error: propuestasError } = await supabase
      .from('propuesta')
      .select(`
        propuesta_id,
        tipo_propuesta,
        descripcion,
        precio_propuesto,
        condiciones,
        estado,
        respuesta,
        fecha_creacion,
        fecha_respuesta,
        fecha_encuentro,
        lugar_encuentro,
        archivo_url,
        usuario_propone_id,
        usuario_recibe_id,
        usuario_propone:usuario!propuesta_usuario_propone_id_fkey (
          user_id,
          nombre,
          apellido,
          foto_perfil
        ),
        usuario_recibe:usuario!propuesta_usuario_recibe_id_fkey (
          user_id,
          nombre,
          apellido,
          foto_perfil
        )
      `)
      .eq('chat_id', chatId)
      .order('fecha_creacion', { ascending: false })


    if (propuestasError) {
      console.error('❌ [API Proposals] Error obteniendo propuestas:', propuestasError)
      return NextResponse.json({ error: 'Error obteniendo propuestas' }, { status: 500 })
    }

    // Obtener validaciones de usuarios para este intercambio
    const { data: userValidations, error: validationsError } = await supabase
      .from('validacion_intercambio')
      .select('usuario_id, es_exitoso, fecha_validacion')
      .eq('intercambio_id', intercambio.intercambio_id)

    // Transformar datos
    const transformedProposals = (propuestas || []).map((prop: any) => ({
      id: prop.propuesta_id,
      intercambioId: intercambio.intercambio_id,
      type: prop.tipo_propuesta,
      description: prop.descripcion,
      proposedPrice: prop.precio_propuesto,
      conditions: prop.condiciones,
      status: prop.estado,
      createdAt: prop.fecha_creacion,
      respondedAt: prop.fecha_respuesta,
      response: prop.respuesta,
      meetingDate: prop.fecha_encuentro,
      meetingPlace: prop.lugar_encuentro,
      archivo_url: prop.archivo_url,
      proposer: {
        id: prop.usuario_propone.user_id,
        name: prop.usuario_propone.nombre,
        lastName: prop.usuario_propone.apellido,
        avatar: prop.usuario_propone.foto_perfil
      },
      receiver: {
        id: prop.usuario_recibe.user_id,
        name: prop.usuario_recibe.nombre,
        lastName: prop.usuario_recibe.apellido,
        avatar: prop.usuario_recibe.foto_perfil
      }
    }))


    return NextResponse.json({ 
      data: transformedProposals,
      userValidations: userValidations || []
    })
  } catch (error) {
    console.error('Error en API de propuestas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = parseInt(params.chatId)
    if (isNaN(chatId)) {
      return NextResponse.json({ error: 'ID de chat inválido' }, { status: 400 })
    }

    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { type, description, proposedPrice, conditions, meetingDate, meetingPlace, archivo_url } = body

    if (!type || !description) {
      return NextResponse.json({ error: 'Tipo y descripción son requeridos' }, { status: 400 })
    }

    // Verificar que el usuario tenga acceso al chat
    const { data: chat, error: chatError } = await supabase
      .from('chat')
      .select(`
        chat_id,
        intercambio (
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

    const intercambio = chat.intercambio as any
    if (!intercambio || (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId)) {
      return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
    }

    // Determinar el usuario receptor (el otro usuario en el chat)
    const usuarioRecibeId = intercambio.usuario_propone_id === userId 
      ? intercambio.usuario_recibe_id 
      : intercambio.usuario_propone_id

    // Crear nueva propuesta
    const { data: nuevaPropuesta, error: createError } = await supabase
      .from('propuesta')
      .insert({
        chat_id: chatId,
        usuario_propone_id: userId,
        usuario_recibe_id: usuarioRecibeId,
        tipo_propuesta: type,
        descripcion: description,
        precio_propuesto: proposedPrice || null,
        condiciones: conditions || null,
        fecha_encuentro: meetingDate || null,
        lugar_encuentro: meetingPlace || null,
        archivo_url: archivo_url || null,
        estado: 'pendiente'
      })
      .select(`
        propuesta_id,
        tipo_propuesta,
        descripcion,
        precio_propuesto,
        condiciones,
        estado,
        fecha_creacion,
        fecha_encuentro,
        lugar_encuentro,
        archivo_url,
        usuario_propone_id
      `)
      .single()

    if (createError) {
      console.error('Error creando propuesta:', createError)
      return NextResponse.json({ error: 'Error creando propuesta' }, { status: 500 })
    }

    // Insertar mensaje del sistema en el chat para que llegue a ambos usuarios via realtime
    try {
      const proposalTypeText = `Nueva ${nuevaPropuesta.tipo_propuesta}`
      const systemContent = `[system_proposal] ${proposalTypeText}`

      const { error: messageError } = await supabase
        .from('mensaje')
        .insert({
          chat_id: chatId,
          usuario_id: userId,
          contenido: systemContent,
          tipo: 'texto'
        })

      if (messageError) {
        console.error('⚠️ Error insertando mensaje de sistema para propuesta:', messageError)
      }
    } catch (e) {
      console.error('⚠️ Excepción insertando mensaje de sistema para propuesta:', e)
    }

    return NextResponse.json({ 
      data: {
        id: nuevaPropuesta.propuesta_id,
        type: nuevaPropuesta.tipo_propuesta,
        description: nuevaPropuesta.descripcion,
        proposedPrice: nuevaPropuesta.precio_propuesto,
        conditions: nuevaPropuesta.condiciones,
        status: nuevaPropuesta.estado,
        createdAt: nuevaPropuesta.fecha_creacion,
        meetingDate: nuevaPropuesta.fecha_encuentro,
        meetingPlace: nuevaPropuesta.lugar_encuentro,
        archivo_url: nuevaPropuesta.archivo_url,
        proposer: {
          id: nuevaPropuesta.usuario_propone_id
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creando propuesta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}