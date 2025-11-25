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

// PATCH - Responder a una solicitud de donación (aceptar/rechazar)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const propuestaId = parseInt(params.id)
    if (isNaN(propuestaId)) {
      return NextResponse.json({ error: 'ID de propuesta inválido' }, { status: 400 })
    }

    const body = await req.json()
    const { accion, fecha_encuentro, lugar_encuentro, mensaje } = body

    if (!accion || !['aceptar', 'rechazar'].includes(accion)) {
      return NextResponse.json({ 
        error: 'Acción inválida. Debe ser "aceptar" o "rechazar"' 
      }, { status: 400 })
    }

    if (accion === 'aceptar' && (!fecha_encuentro || !lugar_encuentro)) {
      return NextResponse.json({ 
        error: 'Fecha y lugar de encuentro son requeridos para aceptar' 
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Verificar que la propuesta existe y el usuario es el receptor
    const { data: propuesta, error: propuestaError } = await supabase
      .from('propuesta')
      .select(`
        propuesta_id,
        usuario_propone_id,
        usuario_recibe_id,
        estado,
        chat_id,
        usuario_propone:usuario_propone_id(
          user_id,
          nombre,
          apellido,
          email
        )
      `)
      .eq('propuesta_id', propuestaId)
      .single()

    if (propuestaError || !propuesta) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
    }

    if (propuesta.usuario_recibe_id !== user.user_id) {
      return NextResponse.json({ 
        error: 'No tienes permiso para responder a esta propuesta' 
      }, { status: 403 })
    }

    if (propuesta.estado !== 'pendiente') {
      return NextResponse.json({ 
        error: 'Esta propuesta ya ha sido respondida' 
      }, { status: 400 })
    }

    // Actualizar la propuesta
    const updateData: any = {
      estado: accion === 'aceptar' ? 'aceptada' : 'rechazada',
      fecha_respuesta: new Date().toISOString(),
      respuesta: mensaje || (accion === 'aceptar' 
        ? `Solicitud aceptada. Encuentro propuesto: ${lugar_encuentro} el ${new Date(fecha_encuentro).toLocaleDateString('es-CO')}`
        : 'Solicitud rechazada'
      )
    }

    if (accion === 'aceptar') {
      updateData.fecha_encuentro = fecha_encuentro
      updateData.lugar_encuentro = lugar_encuentro
    }

    const { data: updatedPropuesta, error: updateError } = await supabase
      .from('propuesta')
      .update(updateData)
      .eq('propuesta_id', propuestaId)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando propuesta:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Si se acepta, actualizar también el intercambio
    if (accion === 'aceptar') {
      const { data: chat } = await supabase
        .from('chat')
        .select('intercambio_id')
        .eq('chat_id', propuesta.chat_id)
        .single()

      if (chat?.intercambio_id) {
        await supabase
          .from('intercambio')
          .update({
            estado: 'aceptado',
            fecha_respuesta: new Date().toISOString(),
            fecha_encuentro: fecha_encuentro,
            lugar_encuentro: lugar_encuentro
          })
          .eq('intercambio_id', chat.intercambio_id)
      }
    }

    // Crear notificación para el solicitante
    try {
      const solicitante = propuesta.usuario_propone[0]
      
      await supabase
        .from('notificacion')
        .insert({
          usuario_id: propuesta.usuario_propone_id,
          tipo: accion === 'aceptar' ? 'donacion_aceptada' : 'donacion_rechazada',
          titulo: accion === 'aceptar' 
            ? '✅ Tu solicitud de donación fue aceptada'
            : '❌ Tu solicitud de donación fue rechazada',
          mensaje: accion === 'aceptar'
            ? `${user.nombre} ${user.apellido} aceptó tu solicitud. Encuentro: ${lugar_encuentro} el ${new Date(fecha_encuentro).toLocaleDateString('es-CO')}`
            : `${user.nombre} ${user.apellido} rechazó tu solicitud de donación`,
          metadata: {
            propuesta_id: propuestaId,
            chat_id: propuesta.chat_id,
            fecha_encuentro: accion === 'aceptar' ? fecha_encuentro : null,
            lugar_encuentro: accion === 'aceptar' ? lugar_encuentro : null,
            donador_id: user.user_id,
            donador_nombre: `${user.nombre} ${user.apellido}`
          },
          leida: false
        })

      console.log('✅ Notificación enviada al solicitante')
    } catch (notifError) {
      console.error('Error creando notificación:', notifError)
      // No fallar si la notificación falla
    }

    // Crear mensaje en el chat
    try {
      const mensajeChat = accion === 'aceptar'
        ? `✅ Solicitud de donación aceptada\n\n📍 Lugar: ${lugar_encuentro}\n📅 Fecha: ${new Date(fecha_encuentro).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n${mensaje || 'Nos vemos ahí!'}`
        : `❌ Solicitud de donación rechazada${mensaje ? '\n\nMotivo: ' + mensaje : ''}`

      await supabase
        .from('mensaje')
        .insert({
          chat_id: propuesta.chat_id,
          usuario_id: user.user_id,
          contenido: mensajeChat,
          tipo: 'texto'
        })

      console.log('✅ Mensaje agregado al chat')
    } catch (messageError) {
      console.error('Error creando mensaje en chat:', messageError)
      // No fallar si el mensaje falla
    }

    console.log(`✅ Propuesta ${propuestaId} ${accion === 'aceptar' ? 'aceptada' : 'rechazada'}`)

    return NextResponse.json({ 
      success: true, 
      propuesta: updatedPropuesta 
    })

  } catch (error: any) {
    console.error('Error respondiendo a solicitud:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

