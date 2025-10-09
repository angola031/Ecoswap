import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const intercambioId = params.id
    const body = await request.json()
    const { userId, isValid, rating, comment, aspects } = body

    console.log('🔍 DEBUG API: Validación recibida:', {
      intercambioId,
      userId,
      isValid,
      rating,
      comment: comment ? 'presente' : 'ausente',
      aspects: aspects ? 'presente' : 'ausente'
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
    const { data: intercambio, error: intercambioError } = await supabaseAdmin
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
      .eq('intercambio_id', intercambioId)
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
    const { data: oldValidations } = await supabaseAdmin
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
      await supabaseAdmin
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
        .onConflict('intercambio_id,usuario_id')
        .ignore()
    }

    // Crear o actualizar la validación del usuario usando UPSERT
    const { data: validationData, error: validationError } = await supabaseAdmin
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
    const { data: allValidations, error: allValidationsError } = await supabaseAdmin
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
          await supabaseAdmin
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
          const { data: calificaciones } = await supabaseAdmin
            .from('calificacion')
            .select('puntuacion')
            .eq('calificado_id', otherUserId)

          if (calificaciones && calificaciones.length > 0) {
            const promedio = calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0) / calificaciones.length
            
            // Actualizar calificación promedio del usuario
            await supabaseAdmin
              .from('usuario')
              .update({ calificacion_promedio: promedio })
              .eq('user_id', otherUserId)
          }

        }

        // Actualizar estadísticas de ambos usuarios (intercambios completados)
        // Usuario que propone
        const { data: usuarioPropone } = await supabaseAdmin
          .from('usuario')
          .select('total_intercambios')
          .eq('user_id', intercambio.usuario_propone_id)
          .single()

        if (usuarioPropone) {
          await supabaseAdmin
            .from('usuario')
            .update({ total_intercambios: (usuarioPropone.total_intercambios || 0) + 1 })
            .eq('user_id', intercambio.usuario_propone_id)
        }

        // Usuario que recibe
        const { data: usuarioRecibe } = await supabaseAdmin
          .from('usuario')
          .select('total_intercambios')
          .eq('user_id', intercambio.usuario_recibe_id)
          .single()

        if (usuarioRecibe) {
          await supabaseAdmin
            .from('usuario')
            .update({ total_intercambios: (usuarioRecibe.total_intercambios || 0) + 1 })
            .eq('user_id', intercambio.usuario_recibe_id)
        }

        // Marcar productos como intercambiados
        if (intercambio.producto_ofrecido_id) {
          await supabaseAdmin
            .from('producto')
            .update({ estado_publicacion: 'intercambiado' })
            .eq('producto_id', intercambio.producto_ofrecido_id)
        }
        
        if (intercambio.producto_solicitado_id) {
          await supabaseAdmin
            .from('producto')
            .update({ estado_publicacion: 'intercambiado' })
            .eq('producto_id', intercambio.producto_solicitado_id)
        }

        // Dar eco-puntos por completar intercambio exitosamente
        const ecoPointsEarned = 50 // Puntos por intercambio completado
        
        await supabaseAdmin
          .from('usuario')
          .update({ 
            eco_puntos: supabaseAdmin.sql`eco_puntos + ${ecoPointsEarned}` 
          })
          .in('user_id', [intercambio.usuario_propone_id, intercambio.usuario_recibe_id])

        // Crear notificaciones para ambos usuarios
        await supabaseAdmin
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
          await supabaseAdmin
            .from('producto')
            .update({ estado_publicacion: 'activo' })
            .eq('producto_id', intercambio.producto_ofrecido_id)
        }
        
        if (intercambio.producto_solicitado_id) {
          await supabaseAdmin
            .from('producto')
            .update({ estado_publicacion: 'activo' })
            .eq('producto_id', intercambio.producto_solicitado_id)
        }

        // Crear notificaciones para ambos usuarios sobre el fallo
        await supabaseAdmin
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

      await supabaseAdmin
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
    const { data: updatedIntercambio, error: updateError } = await supabaseAdmin
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


