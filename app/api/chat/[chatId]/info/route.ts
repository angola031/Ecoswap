import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'




const supabase = getSupabaseClient()

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  
  
  if (!token) {
    return null
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token)
    
    if (error) {
      console.error('❌ [API Info] Error de autenticación:', error)
      return null
    }
    
    const authUserId = data?.user?.id
    
    if (!authUserId) {
      return null
    }
    
    // Primero intentar con auth_user_id
    let { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    
    // Si no se encuentra con auth_user_id, intentar con el email
    if (usuarioError && data?.user?.email) {
      
      const { data: usuarioByEmail, error: emailError } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', data.user.email)
        .single()
      
      
      if (!emailError && usuarioByEmail) {
        usuario = usuarioByEmail
        usuarioError = null
      }
    }
    
    if (usuarioError || !usuario) {
      console.error('❌ [API Info] Error obteniendo usuario:', usuarioError)
      return null
    }
    
    return usuario?.user_id ?? null
  } catch (error) {
    console.error('❌ [API Info] Error obteniendo user_id:', error)
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const chatId = Number(params.chatId)
    
    if (!chatId) {
      return NextResponse.json({ error: 'ID de chat inválido' }, { status: 400 })
    }

    const userId = await getAuthUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Obtener información del chat con datos del intercambio y usuarios
    const { data: chat, error: chatError } = await supabase
      .from('chat')
      .select(`
        chat_id,
        intercambio_id,
        fecha_creacion,
        intercambio (
          usuario_propone_id,
          usuario_recibe_id,
          estado,
          fecha_respuesta,
          fecha_completado,
          producto_ofrecido_id,
          producto_solicitado_id,
          producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey (
            producto_id,
            user_id,
            titulo,
            descripcion,
            precio,
            tipo_transaccion,
            condiciones_intercambio,
            que_busco_cambio,
            precio_negociable,
            estado,
            estado_publicacion,
            visualizaciones,
            ciudad_snapshot,
            departamento_snapshot,
            categoria:categoria (
              nombre
            )
          ),
          producto_solicitado:producto!intercambio_producto_solicitado_id_fkey (
            producto_id,
            user_id,
            titulo,
            descripcion,
            precio,
            tipo_transaccion,
            condiciones_intercambio,
            que_busco_cambio,
            precio_negociable,
            estado,
            estado_publicacion,
            visualizaciones,
            ciudad_snapshot,
            departamento_snapshot,
            categoria:categoria (
              nombre
            )
          ),
          usuario_propone:usuario!intercambio_usuario_propone_id_fkey (
            user_id,
            nombre,
            apellido,
            foto_perfil,
            calificacion_promedio,
            total_intercambios,
            fecha_registro
          ),
          usuario_recibe:usuario!intercambio_usuario_recibe_id_fkey (
            user_id,
            nombre,
            apellido,
            foto_perfil,
            calificacion_promedio,
            total_intercambios,
            fecha_registro
          )
        )
      `)
      .eq('chat_id', chatId)
      .eq('activo', true)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
    }

    const intercambioData = Array.isArray(chat.intercambio) ? chat.intercambio[0] : chat.intercambio

    // Si no hay intercambio, construir respuesta mínima basada en últimos mensajes
    if (!intercambioData) {
      // Determinar otra parte a partir de mensajes recientes
      const { data: lastMessages } = await supabase
        .from('mensaje')
        .select('usuario_id, contenido')
        .eq('chat_id', chatId)
        .order('mensaje_id', { ascending: false })
        .limit(20)

      const participants = new Set<number>()
      let productIdFromTag: string | null = null
      for (const m of (lastMessages || [])) {
        if (typeof m?.usuario_id === 'number') participants.add(m.usuario_id)
        if (typeof m?.contenido === 'string' && m.contenido.startsWith('[product:') && m.contenido.endsWith(']')) {
          productIdFromTag = m.contenido.slice(9, -1)
        }
      }

      if (!participants.has(userId)) {
        return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
      }

      // Resolver otro participante (vendedor) distinto al usuario actual
      let otherUserId: number | null = null
      for (const pid of Array.from(participants)) {
        if (pid !== userId) { otherUserId = pid; break }
      }

      let sellerPayload: any = null
      if (otherUserId) {
        const { data: sellerRow } = await supabase
          .from('usuario')
          .select('user_id, nombre, apellido, foto_perfil, calificacion_promedio, total_intercambios, fecha_registro')
          .eq('user_id', otherUserId)
          .single()

        let sellerLocation: string | null = null
        if (sellerRow) {
          const { data: location } = await supabase
            .from('ubicacion')
            .select('ciudad, departamento')
            .eq('user_id', sellerRow.user_id)
            .eq('es_principal', true)
            .single()
          if (location) sellerLocation = `${location.ciudad}, ${location.departamento}`

          sellerPayload = {
            id: sellerRow.user_id,
            name: sellerRow.nombre,
            lastName: sellerRow.apellido,
            avatar: sellerRow.foto_perfil,
            location: sellerLocation,
            rating: sellerRow.calificacion_promedio || 0,
            totalExchanges: sellerRow.total_intercambios || 0,
            memberSince: sellerRow.fecha_registro ? new Date(sellerRow.fecha_registro).getFullYear().toString() : null
          }
        }
      }

      // Respuesta con datos del vendedor y producto si se pudo resolver
      return NextResponse.json({
        data: {
          chatId,
          seller: sellerPayload,
          exchangeInfo: null,
          offeredProduct: productIdFromTag ? { id: Number(productIdFromTag) } : null,
          requestedProduct: null,
          createdAt: undefined
        }
      })
    }

    // Obtener imagen principal del producto ofrecido
    let productImageUrl = null
    if (intercambioData?.producto_ofrecido_id) {
      const { data: productImage } = await supabase
        .from('imagen_producto')
        .select('url_imagen')
        .eq('producto_id', intercambioData.producto_ofrecido_id)
        .eq('es_principal', true)
        .single()
      
      productImageUrl = productImage?.url_imagen || null
    }

    // Obtener imagen principal del producto solicitado
    let requestedProductImageUrl = null
    if (intercambioData?.producto_solicitado_id) {
      const { data: requestedProductImage } = await supabase
        .from('imagen_producto')
        .select('url_imagen')
        .eq('producto_id', intercambioData.producto_solicitado_id)
        .eq('es_principal', true)
        .single()
      
      requestedProductImageUrl = requestedProductImage?.url_imagen || null
    }
    
    if (!intercambioData || (intercambioData.usuario_propone_id !== userId && intercambioData.usuario_recibe_id !== userId)) {
      return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
    }

    // Determinar quién es el otro usuario (no el actual)
    const otherUser = intercambioData.usuario_propone_id === userId 
      ? intercambioData.usuario_recibe 
      : intercambioData.usuario_propone

    const otherUserData = otherUser ? (Array.isArray(otherUser) ? otherUser[0] : otherUser) : null

    // Obtener ubicación del otro usuario
    let otherUserLocation = null
    if (otherUserData) {
      const { data: location } = await supabase
        .from('ubicacion')
        .select('ciudad, departamento')
        .eq('user_id', otherUserData.user_id)
        .eq('es_principal', true)
        .single()
      
      if (location) {
        otherUserLocation = `${location.ciudad}, ${location.departamento}`
      }
    }

    // Extraer productos de manera segura
    const productoOfrecido = Array.isArray(intercambioData.producto_ofrecido) ? intercambioData.producto_ofrecido[0] : intercambioData.producto_ofrecido
    const productoSolicitado = Array.isArray(intercambioData.producto_solicitado) ? intercambioData.producto_solicitado[0] : intercambioData.producto_solicitado

    const responseData = {
      data: {
        chatId: chat.chat_id,
        seller: {
          id: otherUserData.user_id,
          name: otherUserData.nombre,
          lastName: otherUserData.apellido,
          avatar: otherUserData.foto_perfil,
          location: otherUserLocation,
          rating: otherUserData.calificacion_promedio || 0,
          totalExchanges: otherUserData.total_intercambios || 0,
          memberSince: otherUserData.fecha_registro ? new Date(otherUserData.fecha_registro).getFullYear().toString() : null
        },
        exchangeInfo: {
          usuarioProponeId: intercambioData.usuario_propone_id,
          usuarioRecibeId: intercambioData.usuario_recibe_id,
          status: intercambioData.estado || null,
          acceptedAt: intercambioData.fecha_respuesta || null,
          completedAt: intercambioData.fecha_completado || null
        },
        offeredProduct: {
          id: productoOfrecido.producto_id,
          producto_id: productoOfrecido.producto_id,
          user_id: productoOfrecido.user_id,
          title: productoOfrecido.titulo,
          titulo: productoOfrecido.titulo,
          descripcion: productoOfrecido.descripcion,
          price: productoOfrecido.precio,
          precio: productoOfrecido.precio,
          type: productoOfrecido.tipo_transaccion,
          tipo_transaccion: productoOfrecido.tipo_transaccion,
          category: (productoOfrecido?.categoria as any)?.nombre,
          mainImage: productImageUrl,
          imageUrl: productImageUrl,
          condiciones_intercambio: productoOfrecido.condiciones_intercambio,
          que_busco_cambio: productoOfrecido.que_busco_cambio,
          precio_negociable: productoOfrecido.precio_negociable,
          estado: productoOfrecido.estado,
          estado_publicacion: productoOfrecido.estado_publicacion,
          visualizaciones: productoOfrecido.visualizaciones,
          ciudad_snapshot: productoOfrecido.ciudad_snapshot,
          departamento_snapshot: productoOfrecido.departamento_snapshot
        },
        requestedProduct: productoSolicitado ? {
          id: productoSolicitado.producto_id,
          producto_id: productoSolicitado.producto_id,
          user_id: productoSolicitado.user_id,
          title: productoSolicitado.titulo,
          titulo: productoSolicitado.titulo,
          descripcion: productoSolicitado.descripcion,
          price: productoSolicitado.precio,
          precio: productoSolicitado.precio,
          type: productoSolicitado.tipo_transaccion,
          tipo_transaccion: productoSolicitado.tipo_transaccion,
          category: (productoSolicitado?.categoria as any)?.nombre,
          mainImage: requestedProductImageUrl,
          imageUrl: requestedProductImageUrl,
          condiciones_intercambio: productoSolicitado.condiciones_intercambio,
          que_busco_cambio: productoSolicitado.que_busco_cambio,
          precio_negociable: productoSolicitado.precio_negociable,
          estado: productoSolicitado.estado,
          estado_publicacion: productoSolicitado.estado_publicacion,
          visualizaciones: productoSolicitado.visualizaciones,
          ciudad_snapshot: productoSolicitado.ciudad_snapshot,
          departamento_snapshot: productoSolicitado.departamento_snapshot
        } : null,
        createdAt: chat.fecha_creacion
      }
    }


    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('Error en API de información del chat:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
