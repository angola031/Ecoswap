import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    // Obtener intercambios donde el usuario está involucrado y están en estado 'en_progreso' o 'pendiente_validacion'
    const { data: intercambios, error: intercambiosError } = await supabaseAdmin
      .from('intercambio')
      .select(`
        intercambio_id,
        usuario_propone_id,
        usuario_recibe_id,
        estado,
        fecha_propuesta,
        fecha_encuentro,
        lugar_encuentro,
        notas_encuentro,
        mensaje_propuesta,
        monto_adicional,
        condiciones_adicionales,
        producto_ofrecido:producto_ofrecido_id (
          producto_id,
          titulo,
          descripcion,
          precio,
          user_id,
          usuario:user_id (
            user_id,
            nombre,
            apellido,
            foto_perfil
          )
        ),
        producto_solicitado:producto_solicitado_id (
          producto_id,
          titulo,
          descripcion,
          precio,
          user_id,
          usuario:user_id (
            user_id,
            nombre,
            apellido,
            foto_perfil
          )
        ),
        usuario_propone:usuario_propone_id (
          user_id,
          nombre,
          apellido,
          foto_perfil
        ),
        usuario_recibe:usuario_recibe_id (
          user_id,
          nombre,
          apellido,
          foto_perfil
        ),
        validaciones:validacion_intercambio (
          validacion_id,
          usuario_id,
          es_exitoso,
          calificacion,
          comentario,
          aspectos_destacados,
          fecha_validacion
        )
      `)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .in('estado', ['en_progreso', 'pendiente_validacion'])
      .order('fecha_propuesta', { ascending: false })

    if (intercambiosError) {
      console.error('Error obteniendo intercambios:', intercambiosError)
      return NextResponse.json(
        { error: 'Error obteniendo intercambios' },
        { status: 500 }
      )
    }

    // Transformar los datos para el frontend
    const transformedIntercambios = intercambios.map(intercambio => {
      const currentUserId = parseInt(userId)
      const isProposer = intercambio.usuario_propone_id === currentUserId
      const otherUser = isProposer ? intercambio.usuario_recibe : intercambio.usuario_propone
      const userValidation = intercambio.validaciones?.find(v => v.usuario_id === currentUserId)
      const otherUserValidation = intercambio.validaciones?.find(v => v.usuario_id !== currentUserId)

      return {
        id: intercambio.intercambio_id,
        estado: intercambio.estado,
        fechaPropuesta: intercambio.fecha_propuesta,
        fechaEncuentro: intercambio.fecha_encuentro,
        lugarEncuentro: intercambio.lugar_encuentro,
        notasEncuentro: intercambio.notas_encuentro,
        mensajePropuesta: intercambio.mensaje_propuesta,
        montoAdicional: intercambio.monto_adicional,
        condicionesAdicionales: intercambio.condiciones_adicionales,
        productoOfrecido: intercambio.producto_ofrecido,
        productoSolicitado: intercambio.producto_solicitado,
        usuarioPropone: intercambio.usuario_propone,
        usuarioRecibe: intercambio.usuario_recibe,
        otherUser,
        isProposer,
        userValidation,
        otherUserValidation,
        canValidate: !userValidation, // Puede validar si no ha validado aún
        bothValidated: intercambio.validaciones?.length === 2,
        isCompleted: intercambio.estado === 'completado',
        isFailed: intercambio.estado === 'fallido'
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedIntercambios
    })

  } catch (error) {
    console.error('Error en pending-validation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

