import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string, proposalId: string } }
) {
  try {
    const { chatId, proposalId } = params
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
    const { respuesta, comentario } = body

    // Validar respuesta
    if (!respuesta || !['aceptada', 'rechazada', 'contrapropuesta'].includes(respuesta)) {
      return NextResponse.json({ error: 'Respuesta inválida' }, { status: 400 })
    }

    // Obtener propuesta
    const { data: propuesta, error: propuestaError } = await supabase
      .from('propuesta_intercambio')
      .select(`
        propuesta_id,
        intercambio_id,
        propuesta_por_id,
        tipo_propuesta,
        descripcion,
        estado,
        intercambio:intercambio_id (
          intercambio_id,
          usuario_propone_id,
          usuario_recibe_id
        )
      `)
      .eq('propuesta_id', proposalId)
      .single()

    if (propuestaError || !propuesta) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
    }

    // Verificar que el usuario puede responder (no es quien hizo la propuesta)
    if (propuesta.propuesta_por_id === userId) {
      return NextResponse.json({ error: 'No puedes responder tu propia propuesta' }, { status: 400 })
    }

    // Verificar que el usuario es parte del intercambio
    const intercambio = propuesta.intercambio
    if (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId) {
      return NextResponse.json({ error: 'No autorizado para responder esta propuesta' }, { status: 403 })
    }

    // Actualizar propuesta
    const { data: propuestaActualizada, error: updateError } = await supabase
      .from('propuesta_intercambio')
      .update({
        estado: respuesta,
        fecha_respuesta: new Date().toISOString(),
        respuesta_usuario_id: userId,
        respuesta_comentario: comentario || null
      })
      .eq('propuesta_id', proposalId)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando propuesta:', updateError)
      return NextResponse.json({ error: 'Error actualizando propuesta' }, { status: 500 })
    }

    // Crear mensaje automático en el chat
    const mensajeContenido = `✅ Respuesta a propuesta: ${respuesta.toUpperCase()}\n\n${tipo_propuesta}: ${descripcion}${
      comentario ? `\n\n💬 Comentario: ${comentario}` : ''
    }`

    const { error: mensajeError } = await supabase
      .from('mensaje')
      .insert({
        chat_id: parseInt(chatId),
        usuario_id: userId,
        contenido: mensajeContenido,
        tipo: 'respuesta_propuesta',
        metadata: {
          propuesta_id: propuesta.propuesta_id,
          respuesta,
          comentario
        }
      })

    if (mensajeError) {
      console.error('Error creando mensaje de respuesta:', mensajeError)
    }

    // Crear notificación para el usuario que hizo la propuesta
    await supabase
      .from('notificacion')
      .insert({
        usuario_id: propuesta.propuesta_por_id,
        tipo: 'respuesta_propuesta',
        titulo: `Propuesta ${respuesta === 'aceptada' ? 'Aceptada' : respuesta === 'rechazada' ? 'Rechazada' : 'Con Contrapropuesta'}`,
        mensaje: `Tu propuesta de ${propuesta.tipo_propuesta} ha sido ${respuesta}`,
        datos_adicionales: {
          propuesta_id: propuesta.propuesta_id,
          chat_id: chatId,
          intercambio_id: intercambio.intercambio_id,
          respuesta
        }
      })

    // Si la propuesta es aceptada, actualizar el intercambio
    if (respuesta === 'aceptada') {
      const { error: intercambioError } = await supabase
        .from('intercambio')
        .update({
          estado: 'aceptado',
          fecha_respuesta: new Date().toISOString()
        })
        .eq('intercambio_id', intercambio.intercambio_id)

      if (intercambioError) {
        console.error('Error actualizando intercambio:', intercambioError)
      }
    }

    return NextResponse.json({
      success: true,
      propuesta: propuestaActualizada,
      message: 'Respuesta enviada exitosamente'
    })

  } catch (error) {
    console.error('Error en API de respuesta a propuesta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
