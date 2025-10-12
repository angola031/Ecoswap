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

    // Fallback por email
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { chatId: string, proposalId: string } }
) {
  try {
    const chatId = parseInt(params.chatId)
    const proposalId = parseInt(params.proposalId)
    
    if (isNaN(chatId) || isNaN(proposalId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { response, reason, meetingDetails } = body // response: 'aceptar' | 'rechazar' | 'contrapropuesta'

    if (!response || !['aceptar', 'rechazar', 'contrapropuesta'].includes(response)) {
      return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 })
    }

    // Verificar que la propuesta existe y el usuario puede responderla
    const { data: propuesta, error: propuestaError } = await supabase
      .from('propuesta')
      .select(`
        propuesta_id,
        chat_id,
        usuario_propone_id,
        usuario_recibe_id,
        estado,
        tipo_propuesta,
        descripcion,
        precio_propuesto,
        condiciones,
        chat:chat (
          intercambio (
            intercambio_id,
            usuario_propone_id,
            usuario_recibe_id,
            producto_ofrecido_id,
            producto_solicitado_id
          )
        )
      `)
      .eq('propuesta_id', proposalId)
      .eq('chat_id', chatId)
      .single()

    if (propuestaError || !propuesta) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
    }

    // Verificar que el usuario puede responder (debe ser el usuario receptor)
    if (propuesta.usuario_recibe_id !== userId) {
      return NextResponse.json({ error: 'No puedes responder esta propuesta' }, { status: 403 })
    }

    // Verificar acceso al chat
    const chat = propuesta.chat as any
    const intercambio = chat.intercambio
    if (!intercambio || (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId)) {
      return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
    }

    // Verificar que la propuesta está pendiente
    if (propuesta.estado !== 'pendiente') {
      return NextResponse.json({ error: 'Esta propuesta ya ha sido respondida' }, { status: 400 })
    }

    // Actualizar estado de la propuesta
    const updateData: any = {
      estado: response === 'aceptar' ? 'aceptada' : response === 'rechazar' ? 'rechazada' : 'contrapropuesta',
      fecha_respuesta: new Date().toISOString()
    }

    if (response === 'rechazar' && reason) {
      updateData.respuesta = reason
    } else if (response === 'aceptar') {
      updateData.respuesta = 'Propuesta aceptada'
    }

    const { data: propuestaActualizada, error: updateError } = await supabase
      .from('propuesta')
      .update(updateData)
      .eq('propuesta_id', proposalId)
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
        usuario_propone_id
      `)
      .single()

    if (updateError) {
      console.error('Error actualizando propuesta:', updateError)
      return NextResponse.json({ error: 'Error actualizando propuesta' }, { status: 500 })
    }

    // Si se acepta la propuesta, crear o actualizar el intercambio
    let intercambioId = null
    if (response === 'aceptar') {
      const chat = propuesta.chat as any
      const intercambioExistente = chat.intercambio

      if (intercambioExistente) {
        // Actualizar intercambio existente
        const intercambioUpdateData: any = {
          estado: 'en_progreso',
          fecha_respuesta: new Date().toISOString(),
          mensaje_propuesta: propuesta.descripcion
        }

        // Agregar detalles del encuentro si se proporcionan
        if (meetingDetails) {
          // Combinar fecha y hora si ambas existen
          if (meetingDetails.date && meetingDetails.time) {
            intercambioUpdateData.fecha_encuentro = `${meetingDetails.date}T${meetingDetails.time}`
          } else if (meetingDetails.date) {
            intercambioUpdateData.fecha_encuentro = meetingDetails.date
          }
          
          if (meetingDetails.place) {
            intercambioUpdateData.lugar_encuentro = meetingDetails.place
          }
          
          if (meetingDetails.notes) {
            intercambioUpdateData.notas_encuentro = meetingDetails.notes
          }
        }

        // Agregar precio si es una propuesta de precio
        if (propuesta.tipo_propuesta === 'precio' && propuesta.precio_propuesto) {
          intercambioUpdateData.monto_adicional = propuesta.precio_propuesto
        }

        const { data: intercambioActualizado, error: intercambioUpdateError } = await supabase
          .from('intercambio')
          .update(intercambioUpdateData)
          .eq('intercambio_id', intercambioExistente.intercambio_id)
          .select('intercambio_id')
          .single()

        if (intercambioUpdateError) {
          console.error('Error actualizando intercambio:', intercambioUpdateError)
          return NextResponse.json({ error: 'Error actualizando intercambio' }, { status: 500 })
        }

        intercambioId = intercambioActualizado.intercambio_id
      } else {
        // Crear nuevo intercambio
        const nuevoIntercambioData: any = {
          usuario_propone_id: propuesta.usuario_propone_id,
          usuario_recibe_id: propuesta.usuario_recibe_id,
          mensaje_propuesta: propuesta.descripcion,
          estado: 'en_progreso',
          fecha_propuesta: new Date().toISOString(),
          fecha_respuesta: new Date().toISOString()
        }

        // Agregar detalles del encuentro si se proporcionan
        if (meetingDetails) {
          // Combinar fecha y hora si ambas existen
          if (meetingDetails.date && meetingDetails.time) {
            nuevoIntercambioData.fecha_encuentro = `${meetingDetails.date}T${meetingDetails.time}`
          } else if (meetingDetails.date) {
            nuevoIntercambioData.fecha_encuentro = meetingDetails.date
          }
          
          if (meetingDetails.place) {
            nuevoIntercambioData.lugar_encuentro = meetingDetails.place
          }
          
          if (meetingDetails.notes) {
            nuevoIntercambioData.notas_encuentro = meetingDetails.notes
          }
        }

        // Agregar precio si es una propuesta de precio
        if (propuesta.tipo_propuesta === 'precio' && propuesta.precio_propuesto) {
          nuevoIntercambioData.monto_adicional = propuesta.precio_propuesto
        }

        // Agregar condiciones si existen
        if (propuesta.condiciones) {
          nuevoIntercambioData.condiciones_adicionales = propuesta.condiciones
        }

        const { data: nuevoIntercambio, error: intercambioCreateError } = await supabase
          .from('intercambio')
          .insert(nuevoIntercambioData)
          .select('intercambio_id')
          .single()

        if (intercambioCreateError) {
          console.error('Error creando intercambio:', intercambioCreateError)
          return NextResponse.json({ error: 'Error creando intercambio' }, { status: 500 })
        }

        intercambioId = nuevoIntercambio.intercambio_id

        // Actualizar el chat para que apunte al nuevo intercambio
        const { error: chatUpdateError } = await supabase
          .from('chat')
          .update({ intercambio_id: intercambioId })
          .eq('chat_id', chatId)

        if (chatUpdateError) {
          console.error('Error actualizando chat con intercambio:', chatUpdateError)
          // No retornamos error aquí porque el intercambio ya se creó
        }
      }
    }

    return NextResponse.json({ 
      data: {
        id: propuestaActualizada.propuesta_id,
        type: propuestaActualizada.tipo_propuesta,
        description: propuestaActualizada.descripcion,
        proposedPrice: propuestaActualizada.precio_propuesto,
        conditions: propuestaActualizada.condiciones,
        status: propuestaActualizada.estado,
        createdAt: propuestaActualizada.fecha_creacion,
        respondedAt: propuestaActualizada.fecha_respuesta,
        response: propuestaActualizada.respuesta,
        proposer: {
          id: propuestaActualizada.usuario_propone_id
        },
        intercambioId: intercambioId
      }
    })
  } catch (error) {
    console.error('Error respondiendo propuesta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}