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

    if (!userId || typeof isValid !== 'boolean') {
      return NextResponse.json(
        { error: 'userId e isValid son requeridos' },
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
        producto_solicitado_id
      `)
      .eq('intercambio_id', intercambioId)
      .single()

    if (intercambioError || !intercambio) {
      return NextResponse.json(
        { error: 'Intercambio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario puede validar este intercambio
    const canValidate = intercambio.usuario_propone_id === parseInt(userId) || 
                       intercambio.usuario_recibe_id === parseInt(userId)

    if (!canValidate) {
      return NextResponse.json(
        { error: 'No tienes permisos para validar este intercambio' },
        { status: 403 }
      )
    }

    // Verificar que el intercambio está en estado válido para validación
    if (!['aceptado', 'en_progreso', 'pendiente_validacion'].includes(intercambio.estado)) {
      return NextResponse.json(
        { error: 'El intercambio no está en un estado válido para validación' },
        { status: 400 }
      )
    }

    // Crear o actualizar la validación del usuario
    const { data: existingValidation, error: validationError } = await supabaseAdmin
      .from('validacion_intercambio')
      .select('*')
      .eq('intercambio_id', intercambioId)
      .eq('usuario_id', userId)
      .single()

    let validationData
    if (existingValidation) {
      // Actualizar validación existente
      const { data, error } = await supabaseAdmin
        .from('validacion_intercambio')
        .update({
          es_exitoso: isValid,
          calificacion: rating || null,
          comentario: comment || null,
          aspectos_destacados: aspects || null,
          fecha_validacion: new Date().toISOString()
        })
        .eq('intercambio_id', intercambioId)
        .eq('usuario_id', userId)
        .select()
        .single()

      if (error) throw error
      validationData = data
    } else {
      // Crear nueva validación
      const { data, error } = await supabaseAdmin
        .from('validacion_intercambio')
        .insert({
          intercambio_id: parseInt(intercambioId),
          usuario_id: parseInt(userId),
          es_exitoso: isValid,
          calificacion: rating || null,
          comentario: comment || null,
          aspectos_destacados: aspects || null,
          fecha_validacion: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      validationData = data
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
          await supabaseAdmin.rpc('update_user_rating', { user_id_param: otherUserId })
          await supabaseAdmin.rpc('increment_user_intercambios', { user_id_param: otherUserId })
        }
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
      }
    } else {
      newEstado = 'pendiente_validacion'
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

    return NextResponse.json({
      success: true,
      data: {
        validation: validationData,
        intercambio: updatedIntercambio,
        bothValidated,
        newEstado
      }
    })

  } catch (error) {
    console.error('Error validando intercambio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

