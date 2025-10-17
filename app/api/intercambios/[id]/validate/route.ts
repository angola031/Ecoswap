import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

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

    const intercambioId = Number(params.id)
    if (!intercambioId || Number.isNaN(intercambioId)) {
      return NextResponse.json({ error: 'Intercambio inválido' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { isValid, rating, comment, aspects } = body || {}

    if (typeof isValid !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos: isValid requerido' }, { status: 400 })
    }

    // Usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener user_id interno
    const { data: dbUser, error: userErr } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userErr || !dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const usuarioId = dbUser.user_id

    // Registrar/actualizar validación del intercambio por este usuario
    // Primero verificar si ya existe una validación de este usuario
    const { data: existingVal, error: checkErr } = await supabase
      .from('validacion_intercambio')
      .select('validacion_id')
      .eq('intercambio_id', intercambioId)
      .eq('usuario_id', usuarioId)
      .single()

    let upsertVal: any = null
    let upsertErr: any = null

    if (existingVal) {
      // Actualizar validación existente
      const { data, error } = await supabase
        .from('validacion_intercambio')
        .update({
          es_exitoso: isValid,
          calificacion: typeof rating === 'number' ? rating : null,
          comentario: typeof comment === 'string' ? comment : null,
          aspectos: typeof aspects === 'string' ? aspects : null,
          fecha_validacion: new Date().toISOString()
        })
        .eq('validacion_id', existingVal.validacion_id)
        .select()
        .single()
      
      upsertVal = data
      upsertErr = error
    } else {
      // Crear nueva validación
      const { data, error } = await supabase
        .from('validacion_intercambio')
        .insert({
          intercambio_id: intercambioId,
          usuario_id: usuarioId,
          es_exitoso: isValid,
          calificacion: typeof rating === 'number' ? rating : null,
          comentario: typeof comment === 'string' ? comment : null,
          aspectos: typeof aspects === 'string' ? aspects : null,
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

    // Obtener ambas validaciones (si existen)
    const { data: bothVals, error: valsErr } = await supabase
      .from('validacion_intercambio')
      .select('usuario_id, es_exitoso')
      .eq('intercambio_id', intercambioId)

    if (valsErr) {
      return NextResponse.json({ error: 'No se pudo consultar validaciones' }, { status: 500 })
    }

    let adminReview = false
    let newEstado: string | null = null

    if (bothVals && bothVals.length >= 2) {
      const a = bothVals[0]?.es_exitoso === true
      const b = bothVals[1]?.es_exitoso === true

      if (a && b) {
        newEstado = 'completado'
      } else if (a !== b) {
        newEstado = 'pendiente_revision'
        adminReview = true
      } else {
        newEstado = 'fallido'
      }
    }

    // Actualizar estado del intercambio si corresponde
    if (newEstado) {
      const { error: updErr } = await supabase
        .from('intercambio')
        .update({ estado: newEstado, fecha_actualizacion: new Date().toISOString() })
        .eq('intercambio_id', intercambioId)

      if (updErr) {
        // No bloquear la respuesta por este error, pero informarlo
        console.warn('No se pudo actualizar estado del intercambio:', updErr)
      }
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

        const { data: ticket, error: ticketErr } = await supabase
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
          await supabase.from('mensaje_soporte').insert({
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

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient()
    const intercambioId = params.id
    const body = await request.json()
    const { userId, isValid, rating, comment, aspects } = body

    console.log('🔍 DEBUG API: Validación recibida:', {
      intercambioId,
      intercambioIdType: typeof intercambioId,
      userId,
      userIdType: typeof userId,
      isValid,
      rating,
      comment: comment ? 'presente' : 'ausente',
      aspects: aspects ? 'presente' : 'ausente'
    })

    // Convertir intercambioId a número para la consulta
    const numericIntercambioId = parseInt(intercambioId)
    console.log('🔍 DEBUG API: Conversión de ID:', {
      original: intercambioId,
      numeric: numericIntercambioId,
      isNaN: isNaN(numericIntercambioId)
    })

    if (!userId || typeof isValid !== 'boolean') {
      return NextResponse.json(
        { error: 'userId e isValid son requeridos' },
        { status: 400 }
      )
    }

    // Validación adicional de campos requeridos
    if (isValid && (!rating || rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Si el intercambio fue exitoso, se requiere una calificación válida (1-5 estrellas)' },
        { status: 400 }
      )
    }

    if (!isValid && (!comment || comment.trim().length < 10)) {
      return NextResponse.json(
        { error: 'Si el intercambio falló, se requiere una descripción del problema de al menos 10 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que el intercambio existe y el usuario puede validarlo
    const { data: intercambio, error: intercambioError } = await supabase
      .from('intercambio')
      .select(`
        intercambio_id,
        usuario_propone_id,
        usuario_recibe_id,
        estado,
        producto_ofrecido_id,
        producto_solicitado_id,
        fecha_propuesta,
        fecha_completado
      `)
      .eq('intercambio_id', numericIntercambioId)
      .single()

    if (intercambioError) {
      console.log('❌ ERROR API: Detalles del error:', {
        code: intercambioError.code,
        message: intercambioError.message,
        details: intercambioError.details,
        hint: intercambioError.hint
      })
      
      // Si el intercambio no existe, devolver 404
      if (intercambioError.code === 'PGRST116') {
        return NextResponse.json(
          { 
            error: 'Intercambio no encontrado', 
            details: `No existe un intercambio con ID ${intercambioId}`,
            intercambioId,
            userId 
          },
          { status: 404 }
        )
      }
      
      // Para otros errores de base de datos
      return NextResponse.json(
        { 
          error: 'Error consultando intercambio', 
          details: intercambioError.message,
          intercambioId,
          userId,
          errorCode: intercambioError.code
        },
        { status: 500 }
      )
    }

    if (!intercambio) {
      return NextResponse.json(
        { 
          error: 'Intercambio no encontrado', 
          intercambioId 
        },
        { status: 404 }
      )
    }

    console.log('✅ API: Intercambio encontrado:', {
      intercambio_id: intercambio.intercambio_id,
      estado: intercambio.estado,
      usuario_propone_id: intercambio.usuario_propone_id,
      usuario_recibe_id: intercambio.usuario_recibe_id,
      fecha_propuesta: intercambio.fecha_propuesta
    })

    // Verificar que el usuario puede validar este intercambio
    const canValidate = intercambio.usuario_propone_id === parseInt(userId) || 
                       intercambio.usuario_recibe_id === parseInt(userId)

    console.log('🔍 API: Verificación de permisos:', {
      userId: parseInt(userId),
      usuario_propone_id: intercambio.usuario_propone_id,
      usuario_recibe_id: intercambio.usuario_recibe_id,
      canValidate
    })

    if (!canValidate) {
      console.log('❌ ERROR API: Usuario sin permisos para validar intercambio:', {
        userId: parseInt(userId),
        intercambio_id: intercambio.intercambio_id,
        usuario_propone_id: intercambio.usuario_propone_id,
        usuario_recibe_id: intercambio.usuario_recibe_id
      })
      return NextResponse.json(
        { 
          error: 'No tienes permisos para validar este intercambio',
          details: `Usuario ${userId} no es parte del intercambio ${intercambioId}`
        },
        { status: 403 }
      )
    }

    // Verificar que el intercambio está en estado válido para validación
    const validStates = ['aceptado', 'en_progreso', 'pendiente_validacion']
    if (!validStates.includes(intercambio.estado)) {
      console.log('❌ ERROR API: Estado de intercambio inválido para validación:', {
        intercambio_id: intercambio.intercambio_id,
        estado_actual: intercambio.estado,
        estados_validos: validStates
      })
      return NextResponse.json(
        { 
          error: 'El intercambio no está en un estado válido para validación',
          details: `Estado actual: ${intercambio.estado}. Estados válidos: ${validStates.join(', ')}`,
          estado_actual: intercambio.estado,
          estados_validos: validStates
        },
        { status: 400 }
      )
    }

    // Verificar si hay validaciones pendientes por más de 7 días (auto-completar)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: oldValidations } = await supabase
      .from('validacion_intercambio')
      .select('*')
      .eq('intercambio_id', intercambioId)
      .lt('fecha_creacion', sevenDaysAgo)

    if (oldValidations && oldValidations.length > 0) {
      // Si hay validaciones muy antiguas, marcar como exitoso automáticamente
      const otherUserId = intercambio.usuario_propone_id === parseInt(userId) 
        ? intercambio.usuario_recibe_id 
        : intercambio.usuario_propone_id

        // Crear validación automática para el usuario que no ha validado
        await supabase
          .from('validacion_intercambio')
          .insert({
            intercambio_id: parseInt(intercambioId),
            usuario_id: otherUserId,
            es_exitoso: true,
            calificacion: 4, // Calificación neutral-alta
            comentario: 'Validación automática por timeout (7 días)',
            aspectos_destacados: 'Intercambio completado automáticamente',
            fecha_validacion: new Date().toISOString()
          })
    }

    // Crear o actualizar la validación del usuario usando UPSERT
    const { data: validationData, error: validationError } = await supabase
      .from('validacion_intercambio')
      .upsert({
        intercambio_id: parseInt(intercambioId),
        usuario_id: parseInt(userId),
        es_exitoso: isValid,
        calificacion: rating || null,
        comentario: comment || null,
        aspectos_destacados: aspects || null,
        fecha_validacion: new Date().toISOString()
      }, {
        onConflict: 'intercambio_id,usuario_id'
      })
      .select()
      .single()

    if (validationError) {
      throw new Error(`Error procesando validación: ${validationError.message}`)
    }

    // Verificar si ambos usuarios han validado
    const { data: allValidations, error: allValidationsError } = await supabase
      .from('validacion_intercambio')
      .select('*')
      .eq('intercambio_id', intercambioId)

    if (allValidationsError) throw allValidationsError

    const bothValidated = allValidations.length === 2
    const bothSuccessful = allValidations.every(v => v.es_exitoso === true)
    const anyFailed = allValidations.some(v => v.es_exitoso === false)

    let newEstado = intercambio.estado

    if (bothValidated) {
      if (bothSuccessful) {
        newEstado = 'completado'
        
        // Crear calificaciones mutuas si se proporcionaron
        if (rating && rating > 0) {
          const otherUserId = intercambio.usuario_propone_id === parseInt(userId) 
            ? intercambio.usuario_recibe_id 
            : intercambio.usuario_propone_id

          // Crear calificación
          await supabase
            .from('calificacion')
            .insert({
              intercambio_id: parseInt(intercambioId),
              calificador_id: parseInt(userId),
              calificado_id: otherUserId,
              puntuacion: rating,
              comentario: comment,
              aspectos_destacados: aspects,
              recomendaria: rating >= 4,
              es_publica: true
            })

          // Actualizar estadísticas del usuario calificado
          // Calcular nueva calificación promedio
          const { data: calificaciones } = await supabase
            .from('calificacion')
            .select('puntuacion')
            .eq('calificado_id', otherUserId)

          if (calificaciones && calificaciones.length > 0) {
            const promedio = calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0) / calificaciones.length
            
            // Actualizar calificación promedio del usuario
            await supabase
              .from('usuario')
              .update({ calificacion_promedio: promedio })
              .eq('user_id', otherUserId)
          }

        }

        // Recalcular estadísticas de intercambios para ambos usuarios
        // Esto evita duplicación ya que cuenta intercambios únicos, no participantes
        const userIds = [intercambio.usuario_propone_id, intercambio.usuario_recibe_id]
        
        for (const userId of userIds) {
          // Contar intercambios únicos donde el usuario participa
          const { data: intercambiosUsuario } = await supabase
            .from('intercambio')
            .select('intercambio_id')
            .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
            .eq('estado', 'completado')

          // Eliminar duplicados usando un Set
          const intercambiosUnicos = new Set(intercambiosUsuario?.map(i => i.intercambio_id) || [])
          const totalIntercambios = intercambiosUnicos.size

          // Actualizar el contador del usuario
          await supabase
            .from('usuario')
            .update({ total_intercambios: totalIntercambios })
            .eq('user_id', userId)
        }

        // Marcar productos como intercambiados
        if (intercambio.producto_ofrecido_id) {
          await supabase
            .from('producto')
            .update({ estado_publicacion: 'intercambiado' })
            .eq('producto_id', intercambio.producto_ofrecido_id)
        }
        
        if (intercambio.producto_solicitado_id) {
          await supabase
            .from('producto')
            .update({ estado_publicacion: 'intercambiado' })
            .eq('producto_id', intercambio.producto_solicitado_id)
        }

        // Dar eco-puntos por completar intercambio exitosamente
        const ecoPointsEarned = 50 // Puntos por intercambio completado
        
        // Actualizar eco-puntos para ambos usuarios
        for (const userId of [intercambio.usuario_propone_id, intercambio.usuario_recibe_id]) {
          const { data: userData } = await supabase
            .from('usuario')
            .select('eco_puntos')
            .eq('user_id', userId)
            .single()
          
          if (userData) {
            await supabase
              .from('usuario')
              .update({ eco_puntos: (userData.eco_puntos || 0) + ecoPointsEarned })
              .eq('user_id', userId)
          }
        }

        // Crear notificaciones para ambos usuarios
        await supabase
          .from('notificacion')
          .insert([
            {
              usuario_id: intercambio.usuario_propone_id,
              tipo: 'intercambio_completado',
              titulo: 'Intercambio Completado',
              mensaje: `¡Tu intercambio se ha completado exitosamente! Has ganado ${ecoPointsEarned} eco-puntos.`,
              datos_adicionales: {
                intercambio_id: parseInt(intercambioId),
                tipo: 'exitoso',
                eco_puntos: ecoPointsEarned
              },
              es_push: true,
              es_email: false
            },
            {
              usuario_id: intercambio.usuario_recibe_id,
              tipo: 'intercambio_completado',
              titulo: 'Intercambio Completado',
              mensaje: `¡Tu intercambio se ha completado exitosamente! Has ganado ${ecoPointsEarned} eco-puntos.`,
              datos_adicionales: {
                intercambio_id: parseInt(intercambioId),
                tipo: 'exitoso',
                eco_puntos: ecoPointsEarned
              },
              es_push: true,
              es_email: false
            }
          ])
      } else if (anyFailed) {
        newEstado = 'fallido'
        
        // Marcar productos como disponibles nuevamente
        if (intercambio.producto_ofrecido_id) {
          await supabase
            .from('producto')
            .update({ estado_publicacion: 'activo' })
            .eq('producto_id', intercambio.producto_ofrecido_id)
        }
        
        if (intercambio.producto_solicitado_id) {
          await supabase
            .from('producto')
            .update({ estado_publicacion: 'activo' })
            .eq('producto_id', intercambio.producto_solicitado_id)
        }

        // Crear notificaciones para ambos usuarios sobre el fallo
        await supabase
          .from('notificacion')
          .insert([
            {
              usuario_id: intercambio.usuario_propone_id,
              tipo: 'intercambio_fallido',
              titulo: 'Intercambio Fallido',
              mensaje: 'El intercambio no pudo completarse. Los productos han vuelto a estar disponibles.',
              datos_adicionales: {
                intercambio_id: parseInt(intercambioId),
                tipo: 'fallido'
              },
              es_push: true,
              es_email: false
            },
            {
              usuario_id: intercambio.usuario_recibe_id,
              tipo: 'intercambio_fallido',
              titulo: 'Intercambio Fallido',
              mensaje: 'El intercambio no pudo completarse. Los productos han vuelto a estar disponibles.',
              datos_adicionales: {
                intercambio_id: parseInt(intercambioId),
                tipo: 'fallido'
              },
              es_push: true,
              es_email: false
            }
          ])
      }
    } else {
      newEstado = 'pendiente_validacion'
      
      // Notificar al otro usuario que hay una validación pendiente
      const otherUserId = intercambio.usuario_propone_id === parseInt(userId) 
        ? intercambio.usuario_recibe_id 
        : intercambio.usuario_propone_id

      await supabase
        .from('notificacion')
        .insert({
          usuario_id: otherUserId,
          tipo: 'validacion_pendiente',
          titulo: 'Validación Pendiente',
          mensaje: 'El otro usuario ha validado el intercambio. Esperando tu confirmación.',
          datos_adicionales: {
            intercambio_id: parseInt(intercambioId),
            tipo: 'pendiente'
          },
          es_push: true,
          es_email: false
        })
    }

    // Actualizar estado del intercambio
    const { data: updatedIntercambio, error: updateError } = await supabase
      .from('intercambio')
      .update({ 
        estado: newEstado,
        fecha_completado: newEstado === 'completado' ? new Date().toISOString() : null
      })
      .eq('intercambio_id', intercambioId)
      .select()
      .single()

    if (updateError) throw updateError

    const response = {
      success: true,
      data: {
        validation: validationData,
        intercambio: updatedIntercambio,
        bothValidated,
        newEstado
      }
    }

    
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ ERROR API: Error validando intercambio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


