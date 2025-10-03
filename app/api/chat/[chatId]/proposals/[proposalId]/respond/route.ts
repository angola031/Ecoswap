import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getAuthUserId(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) return null

    // Intentar por auth_user_id
    const { data: usuarioByAuth } = await supabaseAdmin
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioByAuth?.user_id) return usuarioByAuth.user_id

    // Fallback por email
    if (user.email) {
      const { data: usuarioByEmail } = await supabaseAdmin
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
    const { response, reason } = body // response: 'aceptar' | 'rechazar' | 'contrapropuesta'

    if (!response || !['aceptar', 'rechazar', 'contrapropuesta'].includes(response)) {
      return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 })
    }

    // Verificar que la propuesta existe y el usuario puede responderla
    const { data: propuesta, error: propuestaError } = await supabaseAdmin
      .from('propuesta')
      .select(`
        propuesta_id,
        chat_id,
        usuario_propone_id,
        usuario_recibe_id,
        estado,
        chat:chat (
          intercambio (
            usuario_propone_id,
            usuario_recibe_id
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

    const { data: propuestaActualizada, error: updateError } = await supabaseAdmin
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
        }
      }
    })
  } catch (error) {
    console.error('Error respondiendo propuesta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}