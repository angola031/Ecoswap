import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const intercambioId = params.id
    const body = await request.json()
    const { userId, rating, comment, aspects } = body

    console.log('🔍 DEBUG API: Calificación recibida:', {
      intercambioId,
      userId,
      rating,
      comment: comment ? 'presente' : 'ausente',
      aspects: aspects ? 'presente' : 'ausente'
    })

    // Validaciones básicas
    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'userId y rating (1-5) son requeridos' },
        { status: 400 }
      )
    }

    const numericIntercambioId = parseInt(intercambioId)
    const numericUserId = parseInt(userId)

    // Verificar que el intercambio existe y el usuario puede calificar
    const { data: intercambio, error: intercambioError } = await supabaseAdmin
      .from('intercambio')
      .select(`
        intercambio_id,
        usuario_propone_id,
        usuario_recibe_id,
        estado
      `)
      .eq('intercambio_id', numericIntercambioId)
      .single()

    if (intercambioError) {
      console.log('❌ ERROR API: Error consultando intercambio:', intercambioError)
      return NextResponse.json(
        { 
          error: 'Intercambio no encontrado', 
          details: intercambioError.message
        },
        { status: 404 }
      )
    }

    if (!intercambio) {
      return NextResponse.json(
        { error: 'Intercambio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario puede calificar este intercambio
    const canRate = intercambio.usuario_propone_id === numericUserId || 
                   intercambio.usuario_recibe_id === numericUserId

    if (!canRate) {
      return NextResponse.json(
        { 
          error: 'No tienes permisos para calificar este intercambio'
        },
        { status: 403 }
      )
    }

    // Determinar quién está siendo calificado
    const calificadoId = intercambio.usuario_propone_id === numericUserId 
      ? intercambio.usuario_recibe_id 
      : intercambio.usuario_propone_id

    // Verificar si ya existe una calificación de este usuario para este intercambio
    const { data: existingRating } = await supabaseAdmin
      .from('calificacion')
      .select('calificacion_id')
      .eq('intercambio_id', numericIntercambioId)
      .eq('calificador_id', numericUserId)
      .single()

    if (existingRating) {
      return NextResponse.json(
        { error: 'Ya has calificado este intercambio' },
        { status: 400 }
      )
    }

    // Insertar la calificación
    const { data: ratingData, error: ratingError } = await supabaseAdmin
      .from('calificacion')
      .insert({
        intercambio_id: numericIntercambioId,
        calificador_id: numericUserId,
        calificado_id: calificadoId,
        puntuacion: rating,
        comentario: comment || null,
        aspectos_destacados: aspects || null,
        recomendaria: rating >= 4,
        es_publica: true,
        fecha_calificacion: new Date().toISOString()
      })
      .select()
      .single()

    if (ratingError) {
      console.log('❌ ERROR API: Error insertando calificación:', ratingError)
      throw new Error(`Error insertando calificación: ${ratingError.message}`)
    }

    // Actualizar estadísticas del usuario calificado
    const { data: calificaciones } = await supabaseAdmin
      .from('calificacion')
      .select('puntuacion')
      .eq('calificado_id', calificadoId)

    if (calificaciones && calificaciones.length > 0) {
      const promedio = calificaciones.reduce((sum, cal) => sum + cal.puntuacion, 0) / calificaciones.length
      
      // Actualizar calificación promedio del usuario
      await supabaseAdmin
        .from('usuario')
        .update({ calificacion_promedio: promedio })
        .eq('user_id', calificadoId)
    }

    // Actualizar el estado del intercambio si ambos usuarios han calificado
    const { data: allRatings } = await supabaseAdmin
      .from('calificacion')
      .select('calificador_id')
      .eq('intercambio_id', numericIntercambioId)

    const bothRated = allRatings && allRatings.length === 2

    if (bothRated) {
      // Marcar el intercambio como completado
      await supabaseAdmin
        .from('intercambio')
        .update({ 
          estado: 'completado',
          fecha_completado: new Date().toISOString()
        })
        .eq('intercambio_id', numericIntercambioId)

      // Actualizar estadísticas de intercambios completados para ambos usuarios
      await supabaseAdmin
        .from('usuario')
        .update({ 
          total_intercambios: supabaseAdmin.sql`total_intercambios + 1`,
          eco_puntos: supabaseAdmin.sql`eco_puntos + 10`
        })
        .in('user_id', [numericUserId, calificadoId])
    }

    console.log('✅ API: Calificación guardada exitosamente:', {
      calificacion_id: ratingData.calificacion_id,
      intercambio_id: numericIntercambioId,
      calificador_id: numericUserId,
      calificado_id: calificadoId,
      puntuacion: rating
    })

    return NextResponse.json({
      success: true,
      message: 'Calificación guardada exitosamente',
      data: ratingData
    })

  } catch (error) {
    console.error('❌ ERROR API: Error en endpoint de calificación:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
