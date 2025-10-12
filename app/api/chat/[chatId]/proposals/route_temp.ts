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

    // Buscar el usuario en la tabla usuario por auth_user_id
    const { data: usuario } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    return usuario?.user_id || null
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
          usuario_propone_id,
          usuario_recibe_id
        )
      `)
      .eq('chat_id', chatId)
      .single()


    if (chatError || !chat) {
      console.error('❌ [API Proposals] Chat no encontrado:', { chatError, chatId })
      return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
    }

    const intercambio = chat.intercambio as any
    
    if (!intercambio || (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId)) {
      console.error('❌ [API Proposals] Usuario sin acceso al chat')
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

    // Transformar datos
    const transformedProposals = (propuestas || []).map((prop: any) => ({
      id: prop.propuesta_id,
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

    return NextResponse.json({ data: transformedProposals })
  } catch (error) {
    console.error('❌ [API Proposals] Error interno:', error)
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
    const { type, description, proposedPrice, conditions, meetingDate, meetingPlace } = body

    if (!type || !description) {
      return NextResponse.json({ error: 'Tipo y descripción son requeridos' }, { status: 400 })
    }

    // Verificar que el usuario tenga acceso al chat
    const { data: chat, error: chatError } = await supabase
      .from('chat')
      .select(`
        chat_id,
        intercambio (
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
        usuario_propone_id
      `)
      .single()

    if (createError) {
      console.error('Error creando propuesta:', createError)
      return NextResponse.json({ error: 'Error creando propuesta' }, { status: 500 })
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
