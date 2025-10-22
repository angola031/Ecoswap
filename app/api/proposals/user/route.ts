import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [API] /api/proposals/user - Iniciando request')
    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      console.error('❌ [API] Supabase no configurado')
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
    }

    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization')
    console.log('🔍 [API] Auth header:', authHeader ? 'Presente' : 'Ausente')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [API] Token de autorización requerido')
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('🔍 [API] Token extraído:', token ? 'Presente' : 'Ausente')
    
    // Verificar el usuario desde el token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      console.error('❌ [API] Error verificando usuario:', userError)
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }
    console.log('✅ [API] Usuario verificado:', user.email)

    // Obtener el ID del usuario de la tabla usuario
    const { data: userData, error: userDataError } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('email', user.email)
      .single()

    if (userDataError || !userData) {
      console.error('❌ [API] Error obteniendo usuario de BD:', userDataError)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const userId = userData.user_id
    console.log('✅ [API] User ID obtenido:', userId)

    // Obtener todas las propuestas donde el usuario es el que propone o el que recibe
    const { data: proposals, error: proposalsError } = await supabase
      .from('propuesta')
      .select(`
        propuesta_id,
        chat_id,
        usuario_propone_id,
        usuario_recibe_id,
        tipo_propuesta,
        descripcion,
        precio_propuesto,
        condiciones,
        estado,
        fecha_creacion,
        fecha_actualizacion,
        fecha_encuentro,
        lugar_encuentro,
        archivo_url,
        nota_intercambio,
        chat!inner(
          chat_id,
          intercambio_id,
          intercambio!inner(
            intercambio_id,
            producto_ofrecido_id,
            producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey(
              producto_id,
              titulo,
              precio,
              tipo_transaccion,
              precio_negociable,
              condiciones_intercambio,
              que_busco_cambio,
              usuario!inner(
                user_id,
                nombre,
                apellido,
                foto_perfil
              )
            )
          )
        )
      `)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .order('fecha_creacion', { ascending: false })

    if (proposalsError) {
      console.error('❌ [API] Error obteniendo propuestas:', proposalsError)
      return NextResponse.json({ error: 'Error obteniendo propuestas' }, { status: 500 })
    }
    console.log('✅ [API] Propuestas obtenidas:', proposals?.length || 0)
    if (proposals && proposals.length > 0) {
      console.log('🔍 [API] Estructura de la primera propuesta:', JSON.stringify(proposals[0], null, 2))
    }

    // Transformar los datos para que coincidan con la interfaz del frontend
    const transformedProposals = proposals?.map(proposal => {
      const isProposer = proposal.usuario_propone_id === userId
      const otherUser = isProposer 
        ? { id: proposal.usuario_recibe_id, name: 'Usuario', lastName: 'Destinatario', avatar: null }
        : { id: proposal.usuario_propone_id, name: 'Usuario', lastName: 'Proponente', avatar: null }

      // Obtener información del producto desde la estructura correcta
      const product = proposal.chat?.intercambio?.producto_ofrecido

      return {
        id: proposal.propuesta_id,
        type: proposal.tipo_propuesta,
        description: proposal.descripcion,
        proposedPrice: proposal.precio_propuesto,
        conditions: proposal.condiciones,
        status: proposal.estado,
        createdAt: proposal.fecha_creacion,
        meetingDate: proposal.fecha_encuentro,
        meetingPlace: proposal.lugar_encuentro,
        nota_intercambio: proposal.nota_intercambio,
        proposer: isProposer 
          ? { id: userId, name: 'Tú', lastName: '', avatar: null }
          : otherUser,
        receiver: isProposer 
          ? otherUser
          : { id: userId, name: 'Tú', lastName: '', avatar: null },
        product: product ? {
          id: product.producto_id,
          title: product.titulo,
          price: product.precio,
          type: product.tipo_transaccion,
          negotiable: product.precio_negociable,
          exchangeConditions: product.condiciones_intercambio,
          exchangeSeeking: product.que_busco_cambio,
          owner: {
            id: product.usuario.user_id,
            name: product.usuario.nombre,
            lastName: product.usuario.apellido,
            avatar: product.usuario.foto_perfil
          }
        } : null,
        chatId: proposal.chat_id
      }
    }) || []

    console.log('✅ [API] Propuestas transformadas:', transformedProposals.length)
    return NextResponse.json({
      success: true,
      proposals: transformedProposals
    })

  } catch (error) {
    console.error('Error en /api/proposals/user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
