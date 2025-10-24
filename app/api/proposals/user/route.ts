import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

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

    // ⚠️ CONSULTA CORREGIDA - Sin !inner en todos los niveles
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
          intercambio(
            intercambio_id,
            producto_ofrecido_id,
            producto:producto_ofrecido_id(
              producto_id,
              titulo,
              precio,
              tipo_transaccion,
              precio_negociable,
              condiciones_intercambio,
              que_busco_cambio,
              categoria_id,
              categoria(
                categoria_id,
                nombre
              ),
              imagen_producto(
                imagen_id,
                url_imagen,
                es_principal
              )
            )
          )
        )
      `)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .order('fecha_creacion', { ascending: false })

    if (proposalsError) {
      console.error('❌ [API] Error obteniendo propuestas:', proposalsError)
      console.error('❌ [API] Detalles del error:', JSON.stringify(proposalsError, null, 2))
      return NextResponse.json({ 
        error: 'Error obteniendo propuestas', 
        details: proposalsError.message 
      }, { status: 500 })
    }
    
    console.log('✅ [API] Propuestas obtenidas:', proposals?.length || 0)
    if (proposals && proposals.length > 0) {
      console.log('🔍 [API] Estructura de la primera propuesta:', JSON.stringify(proposals[0], null, 2))
    }

    // Transformar los datos - CORREGIDO: Sin acceder a [0]
    const transformedProposals = proposals?.map(proposal => {
      const isProposer = proposal.usuario_propone_id === userId
      const otherUser = isProposer 
        ? { id: proposal.usuario_recibe_id, name: 'Usuario', lastName: 'Destinatario', avatar: null }
        : { id: proposal.usuario_propone_id, name: 'Usuario', lastName: 'Proponente', avatar: null }

      // ⚠️ ACCESO CORREGIDO - chat ahora es un objeto, no un array
      const chat = proposal.chat // Objeto directo
      const intercambio = chat?.intercambio // Objeto directo
      const product = intercambio?.producto // Objeto directo (porque usamos producto:producto_ofrecido_id)
      const categoria = product?.categoria // Objeto directo
      const imagenPrincipal = product?.imagen_producto?.find(img => img.es_principal) || product?.imagen_producto?.[0]
      
      const productInfo = product ? {
        id: product.producto_id,
        title: product.titulo,
        price: product.precio,
        type: product.tipo_transaccion,
        negotiable: product.precio_negociable,
        exchangeConditions: product.condiciones_intercambio,
        exchangeSeeking: product.que_busco_cambio,
        image: imagenPrincipal?.url_imagen || null,
        category: categoria?.nombre || null,
        owner: {
          id: 0,
          name: 'Usuario',
          lastName: 'Producto',
          avatar: null
        }
      } : {
        id: 0,
        title: 'Producto no disponible',
        price: null,
        type: 'intercambio',
        negotiable: false,
        exchangeConditions: null,
        exchangeSeeking: null,
        image: null,
        category: null,
        owner: {
          id: 0,
          name: 'Usuario',
          lastName: 'Producto',
          avatar: null
        }
      }

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
        product: productInfo,
        chatId: proposal.chat_id
      }
    }) || []

    console.log('✅ [API] Propuestas transformadas:', transformedProposals.length)
    return NextResponse.json({
      success: true,
      proposals: transformedProposals
    })

  } catch (error) {
    console.error('❌ [API] Error en /api/proposals/user:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}