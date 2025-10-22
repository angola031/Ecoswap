import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabase-client'

// Forzar runtime de Node en Vercel (evita Edge Runtime incompatibles con algunos SDKs)
export const runtime = 'nodejs'
// Evitar caching y asegurar ejecución dinámica
export const dynamic = 'force-dynamic'

// Valida el resultado de un intercambio por parte del usuario autenticado
// Estados resultantes cuando hay dos validaciones:
// - ambos es_exitoso = true  => intercambio.estado = 'completado'
// - uno true y otro false    => intercambio.estado = 'pendiente_revision' (envío a revisión de administradores)
// - ambos false               => intercambio.estado = 'fallido'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }
    // Cliente admin con SERVICE ROLE (Vercel) para operaciones con RLS
    // Si no está disponible, seguimos con el cliente normal (modo local)
    const admin = getSupabaseAdminClient() || supabase

    const intercambioId = Number(params.id)
    if (!intercambioId || Number.isNaN(intercambioId)) {
      return NextResponse.json({ error: 'Intercambio inválido' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      isValid,
      rating,
      comment,
      aspects,
      // Campos opcionales del intercambio para que los usuarios puedan completar la información
      meetingPlace,         // string | null -> lugar_encuentro
      meetingDate,          // string (ISO) | null -> fecha_encuentro
      meetingNotes,         // string | null -> notas_encuentro
      rejectionReason       // string | null -> motivo_rechazo
    } = body || {}

    if (typeof isValid !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos: isValid requerido' }, { status: 400 })
    }

    // Usuario autenticado - verificar token Bearer del header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener user_id interno
    const { data: dbUser, error: userErr } = await admin
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userErr || !dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const usuarioId = dbUser.user_id

    // Actualizar campos opcionales del intercambio si fueron proporcionados
    try {
      const updatePayload: Record<string, any> = {}
      if (typeof meetingPlace === 'string' && meetingPlace.trim().length > 0) {
        updatePayload.lugar_encuentro = meetingPlace.trim()
      }
      if (typeof meetingDate === 'string' && meetingDate.trim().length > 0) {
        // Guardar como ISO si es válido, de lo contrario dejar que la BD valide
        updatePayload.fecha_encuentro = new Date(meetingDate).toISOString()
      }
      if (typeof meetingNotes === 'string' && meetingNotes.trim().length > 0) {
        updatePayload.notas_encuentro = meetingNotes.trim()
      }
      if (typeof rejectionReason === 'string' && rejectionReason.trim().length > 0) {
        updatePayload.motivo_rechazo = rejectionReason.trim()
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: updIntercambioMetaErr } = await admin
          .from('intercambio')
          .update(updatePayload)
          .eq('intercambio_id', intercambioId)
        if (updIntercambioMetaErr) {
          console.warn('⚠️ [DEBUG] No se pudieron actualizar campos del intercambio:', updIntercambioMetaErr)
        }
      }
    } catch (metaErr) {
      console.warn('⚠️ [DEBUG] Excepción actualizando campos opcionales del intercambio:', metaErr)
    }

    // Registrar/actualizar validación del intercambio por este usuario
    // Primero verificar si ya existe una validación de este usuario
    const { data: existingVal, error: checkErr } = await admin
      .from('validacion_intercambio')
      .select('validacion_id')
      .eq('intercambio_id', intercambioId)
      .eq('usuario_id', usuarioId)
      .single()

    let upsertVal: any = null
    let upsertErr: any = null

    if (existingVal) {
      // Actualizar validación existente
      const { data, error } = await admin
        .from('validacion_intercambio')
        .update({
          es_exitoso: isValid,
          calificacion: typeof rating === 'number' ? rating : null,
          comentario: typeof comment === 'string' ? comment : null,
          aspectos_destacados: typeof aspects === 'string' ? aspects : null,
          fecha_validacion: new Date().toISOString()
        })
        .eq('validacion_id', existingVal.validacion_id)
        .select()
        .single()
      
      upsertVal = data
      upsertErr = error
    } else {
      // Crear nueva validación
      const { data, error } = await admin
        .from('validacion_intercambio')
        .insert({
          intercambio_id: intercambioId,
          usuario_id: usuarioId,
          es_exitoso: isValid,
          calificacion: typeof rating === 'number' ? rating : null,
          comentario: typeof comment === 'string' ? comment : null,
          aspectos_destacados: typeof aspects === 'string' ? aspects : null,
          fecha_validacion: new Date().toISOString()
        })
        .select()
        .single()
      
      upsertVal = data
      upsertErr = error
    }

    if (upsertErr) {
      return NextResponse.json({ error: 'No se pudo registrar la validación' }, { status: 500 })
    }

    // Si hay una calificación válida, crear registro en la tabla calificacion
    if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
      try {
        // Obtener información del intercambio para determinar quién califica a quién
        const { data: intercambioData, error: intercambioErr } = await admin
          .from('intercambio')
          .select('usuario_propone_id, usuario_recibe_id')
          .eq('intercambio_id', intercambioId)
          .single()

        if (!intercambioErr && intercambioData) {
          // Determinar quién es el calificado (el otro usuario)
          const calificadoId = intercambioData.usuario_propone_id === usuarioId 
            ? intercambioData.usuario_recibe_id 
            : intercambioData.usuario_propone_id

          // Verificar si ya existe una calificación de este usuario para este intercambio
          const { data: existingRating, error: checkRatingErr } = await admin
            .from('calificacion')
            .select('calificacion_id')
            .eq('intercambio_id', intercambioId)
            .eq('calificador_id', usuarioId)
            .single()

          if (existingRating) {
            // Actualizar calificación existente
            const { error: updateRatingErr } = await admin
              .from('calificacion')
              .update({
                puntuacion: rating,
                comentario: typeof comment === 'string' ? comment : null,
                aspectos_destacados: typeof aspects === 'string' ? aspects : null,
                fecha_calificacion: new Date().toISOString()
              })
              .eq('calificacion_id', existingRating.calificacion_id)

            if (updateRatingErr) {
              console.warn('⚠️ [DEBUG] Error actualizando calificación:', updateRatingErr)
            } else {
              console.log('✅ [DEBUG] Calificación actualizada exitosamente')
            }
          } else {
            // Crear nueva calificación
            const { error: insertRatingErr } = await admin
              .from('calificacion')
              .insert({
                intercambio_id: intercambioId,
                calificador_id: usuarioId,
                calificado_id: calificadoId,
                puntuacion: rating,
                comentario: typeof comment === 'string' ? comment : null,
                aspectos_destacados: typeof aspects === 'string' ? aspects : null,
                fecha_calificacion: new Date().toISOString(),
                es_publica: true
              })

            if (insertRatingErr) {
              console.warn('⚠️ [DEBUG] Error creando calificación:', insertRatingErr)
            } else {
              console.log('✅ [DEBUG] Calificación creada exitosamente')
            }
          }
        }
      } catch (ratingErr) {
        console.warn('⚠️ [DEBUG] Excepción manejando calificación:', ratingErr)
      }
    }

    // Obtener ambas validaciones (si existen)
    const { data: bothVals, error: valsErr } = await admin
      .from('validacion_intercambio')
      .select('usuario_id, es_exitoso')
      .eq('intercambio_id', intercambioId)

    if (valsErr) {
      return NextResponse.json({ error: 'No se pudo consultar validaciones' }, { status: 500 })
    }

    // Obtener estado actual del intercambio para debug
    const { data: currentIntercambio, error: intercambioErr } = await admin
      .from('intercambio')
      .select('estado, intercambio_id')
      .eq('intercambio_id', intercambioId)
      .single()

    console.log('🔍 [DEBUG] Estado actual del intercambio:', currentIntercambio?.estado)
    console.log('🔍 [DEBUG] Validaciones encontradas:', bothVals?.length || 0)
    console.log('🔍 [DEBUG] Detalles de validaciones:', bothVals)

    let adminReview = false
    let newEstado: string | null = null

    if (bothVals && bothVals.length >= 2) {
      const a = bothVals[0]?.es_exitoso === true
      const b = bothVals[1]?.es_exitoso === true

      console.log('🔍 [DEBUG] Validación 1 (es_exitoso):', a)
      console.log('🔍 [DEBUG] Validación 2 (es_exitoso):', b)

      if (a && b) {
        newEstado = 'completado'
        console.log('✅ [DEBUG] Ambas validaciones exitosas -> completado')
      } else if (a !== b) {
        newEstado = 'pendiente_revision'
        adminReview = true
        console.log('⚠️ [DEBUG] Discrepancia en validaciones -> pendiente_revision')
      } else {
        newEstado = 'fallido'
        console.log('❌ [DEBUG] Ambas validaciones fallidas -> fallido')
      }
    } else {
      console.log('ℹ️ [DEBUG] No hay suficientes validaciones aún:', bothVals?.length || 0)
    }

    // Actualizar estado del intercambio si corresponde
    if (newEstado) {
      console.log('🔄 [DEBUG] Actualizando estado del intercambio de', currentIntercambio?.estado, 'a', newEstado)
      
      const { error: updErr } = await admin
        .from('intercambio')
        .update({ 
          estado: newEstado, 
          fecha_completado: newEstado === 'completado' ? new Date().toISOString() : null
        })
        .eq('intercambio_id', intercambioId)

      if (updErr) {
        // No bloquear la respuesta por este error, pero informarlo
        console.error('❌ [DEBUG] Error actualizando estado del intercambio:', updErr)
        console.error('❌ [DEBUG] Detalles del error:', {
          intercambioId,
          newEstado,
          currentEstado: currentIntercambio?.estado,
          error: updErr
        })
      } else {
        console.log('✅ [DEBUG] Estado del intercambio actualizado exitosamente')
        
        // Si el intercambio se completó exitosamente, marcar el producto como intercambiado
        if (newEstado === 'completado') {
          try {
            // Obtener información del intercambio para identificar el producto
            const { data: intercambioInfo, error: intercambioInfoErr } = await admin
              .from('intercambio')
              .select('producto_ofrecido_id, producto_solicitado_id')
              .eq('intercambio_id', intercambioId)
              .single()

            if (!intercambioInfoErr && intercambioInfo) {
              // Actualizar el producto ofrecido como intercambiado
              if (intercambioInfo.producto_ofrecido_id) {
                const { error: updateProductErr } = await admin
                  .from('producto')
                  .update({ 
                    estado_publicacion: 'intercambiado',
                    fecha_actualizacion: new Date().toISOString()
                  })
                  .eq('producto_id', intercambioInfo.producto_ofrecido_id)

                if (updateProductErr) {
                  console.warn('⚠️ [DEBUG] Error actualizando producto ofrecido:', updateProductErr)
                } else {
                  console.log('✅ [DEBUG] Producto ofrecido marcado como intercambiado')
                }
              }

              // Si hay producto solicitado, también marcarlo como intercambiado
              if (intercambioInfo.producto_solicitado_id) {
                const { error: updateRequestedProductErr } = await admin
                  .from('producto')
                  .update({ 
                    estado_publicacion: 'intercambiado',
                    fecha_actualizacion: new Date().toISOString()
                  })
                  .eq('producto_id', intercambioInfo.producto_solicitado_id)

                if (updateRequestedProductErr) {
                  console.warn('⚠️ [DEBUG] Error actualizando producto solicitado:', updateRequestedProductErr)
                } else {
                  console.log('✅ [DEBUG] Producto solicitado marcado como intercambiado')
                }
              }
            }
          } catch (productUpdateErr) {
            console.warn('⚠️ [DEBUG] Excepción actualizando productos:', productUpdateErr)
          }
        }
      }
    } else {
      console.log('ℹ️ [DEBUG] No se actualiza el estado del intercambio (newEstado es null)')
    }

    // Crear ticket de soporte cuando hay discrepancia (pendiente_revision)
    let createdTicket: any = null
    if (adminReview) {
      try {
        // Construir una descripción con trazabilidad básica
        const detalle = {
          motivo: 'Discrepancia en validación de intercambio',
          intercambio_id: intercambioId,
          validaciones: bothVals || [],
        }

        const { data: ticket, error: ticketErr } = await admin
          .from('ticket_soporte')
          .insert({
            usuario_id: usuarioId, // quien reporta la discrepancia (validador actual)
            admin_asignado_id: null,
            asunto: `Discrepancia de validación en intercambio #${intercambioId}`,
            categoria: 'problema_intercambio',
            prioridad: 'alta',
            estado: 'abierto',
            descripcion: `Uno de los usuarios marcó exitoso y el otro no. Intercambio #${intercambioId}.`,
            intercambio_relacionado_id: intercambioId,
            archivos_adjuntos: null,
            producto_relacionado_id: null,
            tags: null
          })
          .select()
          .single()

        if (!ticketErr && ticket) {
          createdTicket = ticket
          // Registrar mensaje interno con el detalle estructurado si se desea
          await admin.from('mensaje_soporte').insert({
            ticket_id: ticket.ticket_id,
            remitente_id: usuarioId,
            tipo_remitente: 'usuario',
            contenido: JSON.stringify(detalle),
            es_interno: true
          })
        }
      } catch (e) {
        console.warn('No se pudo crear ticket de soporte para discrepancia:', e)
      }
    }

    return NextResponse.json({
      ok: true,
      data: upsertVal,
      adminReview,
      intercambioEstado: newEstado,
      ticket: createdTicket
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
