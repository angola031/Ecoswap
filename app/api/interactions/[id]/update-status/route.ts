import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interactionId = params.id
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
    const { status, rejectionReason, meetingPlace, meetingDate, meetingNotes } = body

    // Validar estado
    const validStatuses = ['pendiente', 'aceptado', 'rechazado', 'completado', 'cancelado']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // Verificar que el usuario tiene permisos para actualizar esta interacción
    const { data: intercambio, error: intercambioError } = await supabase
      .from('intercambio')
      .select('usuario_propone_id, usuario_recibe_id, estado')
      .eq('intercambio_id', interactionId)
      .single()

    if (intercambioError || !intercambio) {
      return NextResponse.json({ error: 'Intercambio no encontrado' }, { status: 404 })
    }

    // Verificar permisos (solo el usuario que propone o recibe puede actualizar)
    if (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId) {
      return NextResponse.json({ error: 'No autorizado para actualizar este intercambio' }, { status: 403 })
    }

    // Validaciones de negocio
    if (status === 'rechazado' && !rejectionReason) {
      return NextResponse.json({ error: 'Motivo de rechazo requerido' }, { status: 400 })
    }

    if (status === 'aceptado' && meetingPlace && !meetingDate) {
      return NextResponse.json({ error: 'Fecha de encuentro requerida cuando se especifica lugar' }, { status: 400 })
    }

    // Preparar datos para actualización
    const updateData: any = {
      estado: status,
      fecha_respuesta: status !== 'pendiente' ? new Date().toISOString() : null,
      fecha_completado: status === 'completado' ? new Date().toISOString() : null,
      motivo_rechazo: status === 'rechazado' ? rejectionReason : null,
      lugar_encuentro: meetingPlace || null,
      fecha_encuentro: meetingDate ? new Date(meetingDate).toISOString() : null,
      notas_encuentro: meetingNotes || null
    }

    // Actualizar intercambio
    const { data: updatedIntercambio, error: updateError } = await supabase
      .from('intercambio')
      .update(updateData)
      .eq('intercambio_id', interactionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando intercambio:', updateError)
      return NextResponse.json({ error: 'Error actualizando intercambio' }, { status: 500 })
    }

    // Si se completó el intercambio, actualizar estadísticas del usuario
    if (status === 'completado') {
      // Actualizar total de intercambios del usuario que propone
      await supabase.rpc('increment_user_intercambios', {
        user_id_param: intercambio.usuario_propone_id
      })

      // Actualizar total de intercambios del usuario que recibe
      await supabase.rpc('increment_user_intercambios', {
        user_id_param: intercambio.usuario_recibe_id
      })
    }

    // Crear notificación para el otro usuario
    const otherUserId = intercambio.usuario_propone_id === userId 
      ? intercambio.usuario_recibe_id 
      : intercambio.usuario_propone_id

    let notificationTitle = ''
    let notificationMessage = ''

    switch (status) {
      case 'aceptado':
        notificationTitle = 'Intercambio Aceptado'
        notificationMessage = 'Tu propuesta de intercambio ha sido aceptada'
        break
      case 'rechazado':
        notificationTitle = 'Intercambio Rechazado'
        notificationMessage = 'Tu propuesta de intercambio ha sido rechazada'
        break
      case 'completado':
        notificationTitle = 'Intercambio Completado'
        notificationMessage = 'El intercambio ha sido marcado como completado'
        break
      case 'cancelado':
        notificationTitle = 'Intercambio Cancelado'
        notificationMessage = 'El intercambio ha sido cancelado'
        break
    }

    if (notificationTitle) {
      await supabase
        .from('notificacion')
        .insert({
          usuario_id: otherUserId,
          tipo: 'intercambio_actualizado',
          titulo: notificationTitle,
          mensaje: notificationMessage,
          datos_adicionales: {
            intercambio_id: interactionId,
            nuevo_estado: status,
            motivo_rechazo: rejectionReason
          }
        })
    }

    return NextResponse.json({
      success: true,
      intercambio: updatedIntercambio,
      message: 'Estado actualizado correctamente'
    })

  } catch (error) {
    console.error('Error en API de actualización de estado:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
