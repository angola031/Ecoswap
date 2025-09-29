import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { InteractionDetail } from '@/lib/types/interactions'

export async function GET(
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

    // Obtener intercambio con todos los detalles
    const { data: intercambio, error: intercambioError } = await supabase
      .from('intercambio')
      .select(`
        intercambio_id,
        producto_ofrecido_id,
        producto_solicitado_id,
        usuario_propone_id,
        usuario_recibe_id,
        mensaje_propuesta,
        monto_adicional,
        condiciones_adicionales,
        estado,
        fecha_propuesta,
        fecha_respuesta,
        fecha_completado,
        motivo_rechazo,
        lugar_encuentro,
        fecha_encuentro,
        notas_encuentro,
        producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey (
          producto_id,
          titulo,
          descripcion,
          precio,
          estado,
          tipo_transaccion,
          condiciones_intercambio,
          que_busco_cambio,
          precio_negociable,
          fecha_publicacion,
          visualizaciones,
          veces_guardado,
          usuario:usuario!producto_user_id_fkey (
            user_id,
            nombre,
            apellido,
            email,
            telefono,
            foto_perfil,
            calificacion_promedio,
            total_intercambios,
            eco_puntos,
            ubicacion:ubicacion!ubicacion_user_id_fkey (
              ubicacion_id,
              ciudad,
              departamento,
              barrio,
              latitud,
              longitud
            )
          ),
          imagenes:imagen_producto (
            imagen_id,
            url_imagen,
            descripcion_alt,
            es_principal,
            orden
          ),
          categoria:categoria (
            categoria_id,
            nombre,
            descripcion,
            icono
          )
        ),
        producto_solicitado:producto!intercambio_producto_solicitado_id_fkey (
          producto_id,
          titulo,
          descripcion,
          precio,
          estado,
          tipo_transaccion,
          condiciones_intercambio,
          que_busco_cambio,
          precio_negociable,
          fecha_publicacion,
          visualizaciones,
          veces_guardado,
          usuario:usuario!producto_user_id_fkey (
            user_id,
            nombre,
            apellido,
            email,
            telefono,
            foto_perfil,
            calificacion_promedio,
            total_intercambios,
            eco_puntos,
            ubicacion:ubicacion!ubicacion_user_id_fkey (
              ubicacion_id,
              ciudad,
              departamento,
              barrio,
              latitud,
              longitud
            )
          ),
          imagenes:imagen_producto (
            imagen_id,
            url_imagen,
            descripcion_alt,
            es_principal,
            orden
          ),
          categoria:categoria (
            categoria_id,
            nombre,
            descripcion,
            icono
          )
        ),
        usuario_propone:usuario!intercambio_usuario_propone_id_fkey (
          user_id,
          nombre,
          apellido,
          email,
          telefono,
          foto_perfil,
          calificacion_promedio,
          total_intercambios,
          eco_puntos,
          fecha_registro,
          verificado,
          ubicacion:ubicacion!ubicacion_user_id_fkey (
            ubicacion_id,
            ciudad,
            departamento,
            barrio,
            latitud,
            longitud
          )
        ),
        usuario_recibe:usuario!intercambio_usuario_recibe_id_fkey (
          user_id,
          nombre,
          apellido,
          email,
          telefono,
          foto_perfil,
          calificacion_promedio,
          total_intercambios,
          eco_puntos,
          fecha_registro,
          verificado,
          ubicacion:ubicacion!ubicacion_user_id_fkey (
            ubicacion_id,
            ciudad,
            departamento,
            barrio,
            latitud,
            longitud
          )
        ),
        chat:chat (
          chat_id,
          fecha_creacion,
          ultimo_mensaje,
          activo,
          mensajes:mensaje (
            mensaje_id,
            usuario_id,
            contenido,
            tipo,
            archivo_url,
            leido,
            fecha_envio,
            fecha_lectura,
            usuario:usuario!mensaje_usuario_id_fkey (
              user_id,
              nombre,
              apellido,
              foto_perfil
            )
          )
        ),
        calificaciones:calificacion (
          calificacion_id,
          calificador_id,
          calificado_id,
          puntuacion,
          comentario,
          aspectos_destacados,
          recomendaria,
          fecha_calificacion,
          es_publica
        )
      `)
      .eq('intercambio_id', interactionId)
      .single()

    if (intercambioError || !intercambio) {
      return NextResponse.json({ error: 'Intercambio no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario tiene acceso a este intercambio
    if (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId) {
      return NextResponse.json({ error: 'No autorizado para ver este intercambio' }, { status: 403 })
    }

    // Determinar el otro usuario
    const otherUser = intercambio.usuario_propone_id === userId 
      ? intercambio.usuario_recibe 
      : intercambio.usuario_propone

    // Determinar el producto principal
    const mainProduct = intercambio.producto_ofrecido

    // Obtener imagen principal del producto ofrecido
    const mainProductImage = mainProduct?.imagenes?.find((img: any) => img.es_principal)?.url_imagen 
      || mainProduct?.imagenes?.[0]?.url_imagen 
      || '/images/placeholder-product.jpg'

    // Obtener imagen principal del producto solicitado si existe
    const requestedProductImage = intercambio.producto_solicitado?.imagenes?.find((img: any) => img.es_principal)?.url_imagen 
      || intercambio.producto_solicitado?.imagenes?.[0]?.url_imagen 
      || '/images/placeholder-product.jpg'

    // Transformar mensajes
    const messages = (intercambio.chat?.mensajes || []).map((msg: any) => ({
      id: String(msg.mensaje_id),
      senderId: String(msg.usuario_id),
      content: msg.contenido,
      timestamp: msg.fecha_envio,
      isRead: msg.leido,
      type: msg.tipo === 'imagen' ? 'image' : msg.tipo === 'ubicacion' ? 'location' : 'text',
      metadata: msg.archivo_url ? { imageUrl: msg.archivo_url } : undefined,
      sender: {
        id: String(msg.usuario?.user_id),
        name: msg.usuario?.nombre || '',
        lastName: msg.usuario?.apellido || '',
        avatar: msg.usuario?.foto_perfil
      }
    }))

    // Transformar calificaciones
    const ratings = (intercambio.calificaciones || []).map((cal: any) => ({
      id: String(cal.calificacion_id),
      exchangeId: String(intercambio.intercambio_id),
      raterId: String(cal.calificador_id),
      ratedId: String(cal.calificado_id),
      score: cal.puntuacion,
      comment: cal.comentario,
      highlightedAspects: cal.aspectos_destacados,
      wouldRecommend: cal.recomendaria,
      ratedAt: cal.fecha_calificacion,
      isPublic: cal.es_publica
    }))

    // Crear respuesta detallada
    const interactionDetail: InteractionDetail = {
      id: String(intercambio.intercambio_id),
      type: mainProduct?.tipo_transaccion || 'intercambio',
      status: intercambio.estado,
      title: `${mainProduct?.tipo_transaccion === 'intercambio' ? 'Intercambio' : 
              mainProduct?.tipo_transaccion === 'venta' ? 'Venta' : 'Donación'} ${mainProduct?.titulo}`,
      description: intercambio.mensaje_propuesta || 
                  (intercambio.producto_solicitado ? 
                    `Intercambio de ${mainProduct?.titulo} por ${intercambio.producto_solicitado.titulo}` :
                    `Transacción de ${mainProduct?.titulo}`),
      offeredProduct: {
        id: String(mainProduct?.producto_id),
        title: mainProduct?.titulo || '',
        description: mainProduct?.descripcion || '',
        price: mainProduct?.precio,
        negotiablePrice: mainProduct?.precio_negociable || false,
        condition: mainProduct?.estado || 'usado',
        transactionType: mainProduct?.tipo_transaccion || 'intercambio',
        category: mainProduct?.categoria?.nombre || 'Sin categoría',
        location: `${mainProduct?.usuario?.ubicacion?.ciudad || ''}, ${mainProduct?.usuario?.ubicacion?.departamento || ''}`,
        images: mainProduct?.imagenes?.map((img: any) => img.url_imagen) || [],
        mainImage: mainProductImage,
        status: 'activo',
        views: mainProduct?.visualizaciones || 0,
        saves: mainProduct?.veces_guardado || 0,
        publishedAt: mainProduct?.fecha_publicacion || '',
        updatedAt: mainProduct?.fecha_publicacion || '',
        validated: true,
        validationStatus: 'approved',
        tags: [],
        specifications: {},
        exchangeConditions: mainProduct?.condiciones_intercambio,
        lookingForExchange: mainProduct?.que_busco_cambio,
        user: {
          id: String(mainProduct?.usuario?.user_id),
          name: mainProduct?.usuario?.nombre || '',
          lastName: mainProduct?.usuario?.apellido || '',
          email: mainProduct?.usuario?.email || '',
          phone: mainProduct?.usuario?.telefono,
          avatar: mainProduct?.usuario?.foto_perfil,
          location: `${mainProduct?.usuario?.ubicacion?.ciudad || ''}, ${mainProduct?.usuario?.ubicacion?.departamento || ''}`,
          isVerified: mainProduct?.usuario?.verificado || false,
          isAdmin: false,
          ecoPoints: mainProduct?.usuario?.eco_puntos || 0,
          totalExchanges: mainProduct?.usuario?.total_intercambios || 0,
          averageRating: mainProduct?.usuario?.calificacion_promedio || 0,
          roles: []
        }
      },
      requestedProduct: intercambio.producto_solicitado ? {
        id: String(intercambio.producto_solicitado.producto_id),
        title: intercambio.producto_solicitado.titulo,
        description: intercambio.producto_solicitado.descripcion || '',
        price: intercambio.producto_solicitado.precio,
        negotiablePrice: intercambio.producto_solicitado.precio_negociable || false,
        condition: intercambio.producto_solicitado.estado,
        transactionType: intercambio.producto_solicitado.tipo_transaccion,
        category: intercambio.producto_solicitado.categoria?.nombre || 'Sin categoría',
        location: `${intercambio.producto_solicitado.usuario?.ubicacion?.ciudad || ''}, ${intercambio.producto_solicitado.usuario?.ubicacion?.departamento || ''}`,
        images: intercambio.producto_solicitado.imagenes?.map((img: any) => img.url_imagen) || [],
        mainImage: requestedProductImage,
        status: 'activo',
        views: intercambio.producto_solicitado.visualizaciones || 0,
        saves: intercambio.producto_solicitado.veces_guardado || 0,
        publishedAt: intercambio.producto_solicitado.fecha_publicacion || '',
        updatedAt: intercambio.producto_solicitado.fecha_publicacion || '',
        validated: true,
        validationStatus: 'approved',
        tags: [],
        specifications: {},
        exchangeConditions: intercambio.producto_solicitado.condiciones_intercambio,
        lookingForExchange: intercambio.producto_solicitado.que_busco_cambio,
        user: {
          id: String(intercambio.producto_solicitado.usuario?.user_id),
          name: intercambio.producto_solicitado.usuario?.nombre || '',
          lastName: intercambio.producto_solicitado.usuario?.apellido || '',
          email: intercambio.producto_solicitado.usuario?.email || '',
          phone: intercambio.producto_solicitado.usuario?.telefono,
          avatar: intercambio.producto_solicitado.usuario?.foto_perfil,
          location: `${intercambio.producto_solicitado.usuario?.ubicacion?.ciudad || ''}, ${intercambio.producto_solicitado.usuario?.ubicacion?.departamento || ''}`,
          isVerified: intercambio.producto_solicitado.usuario?.verificado || false,
          isAdmin: false,
          ecoPoints: intercambio.producto_solicitado.usuario?.eco_puntos || 0,
          totalExchanges: intercambio.producto_solicitado.usuario?.total_intercambios || 0,
          averageRating: intercambio.producto_solicitado.usuario?.calificacion_promedio || 0,
          roles: []
        }
      } : undefined,
      proposer: {
        id: String(intercambio.usuario_propone?.user_id),
        name: intercambio.usuario_propone?.nombre || '',
        lastName: intercambio.usuario_propone?.apellido || '',
        email: intercambio.usuario_propone?.email || '',
        phone: intercambio.usuario_propone?.telefono,
        avatar: intercambio.usuario_propone?.foto_perfil,
        location: `${intercambio.usuario_propone?.ubicacion?.ciudad || ''}, ${intercambio.usuario_propone?.ubicacion?.departamento || ''}`,
        isVerified: intercambio.usuario_propone?.verificado || false,
        isAdmin: false,
        ecoPoints: intercambio.usuario_propone?.eco_puntos || 0,
        totalExchanges: intercambio.usuario_propone?.total_intercambios || 0,
        averageRating: intercambio.usuario_propone?.calificacion_promedio || 0,
        roles: []
      },
      receiver: {
        id: String(intercambio.usuario_recibe?.user_id),
        name: intercambio.usuario_recibe?.nombre || '',
        lastName: intercambio.usuario_recibe?.apellido || '',
        email: intercambio.usuario_recibe?.email || '',
        phone: intercambio.usuario_recibe?.telefono,
        avatar: intercambio.usuario_recibe?.foto_perfil,
        location: `${intercambio.usuario_recibe?.ubicacion?.ciudad || ''}, ${intercambio.usuario_recibe?.ubicacion?.departamento || ''}`,
        isVerified: intercambio.usuario_recibe?.verificado || false,
        isAdmin: false,
        ecoPoints: intercambio.usuario_recibe?.eco_puntos || 0,
        totalExchanges: intercambio.usuario_recibe?.total_intercambios || 0,
        averageRating: intercambio.usuario_recibe?.calificacion_promedio || 0,
        roles: []
      },
      otherUser: {
        id: String(otherUser?.user_id),
        name: otherUser?.nombre || '',
        lastName: otherUser?.apellido || '',
        avatar: otherUser?.foto_perfil,
        location: `${otherUser?.ubicacion?.ciudad || ''}, ${otherUser?.ubicacion?.departamento || ''}`,
        rating: otherUser?.calificacion_promedio || 0
      },
      createdAt: intercambio.fecha_propuesta,
      updatedAt: intercambio.fecha_respuesta || intercambio.fecha_propuesta,
      messagesCount: messages.length,
      chatId: String(intercambio.chat?.chat_id || ''),
      additionalAmount: intercambio.monto_adicional || 0,
      meetingPlace: intercambio.lugar_encuentro,
      meetingDate: intercambio.fecha_encuentro,
      rejectionReason: intercambio.motivo_rechazo,
      messages,
      proposals: [], // Se pueden implementar propuestas adicionales
      deliveries: [], // Se pueden implementar entregas programadas
      ratings,
      chat: {
        id: String(intercambio.chat?.chat_id || ''),
        exchange: {} as any, // Se puede completar si es necesario
        messages,
        createdAt: intercambio.chat?.fecha_creacion || intercambio.fecha_propuesta,
        lastMessage: intercambio.chat?.ultimo_mensaje,
        lastMessageTime: intercambio.chat?.ultimo_mensaje,
        isActive: intercambio.chat?.activo || true,
        unreadCount: 0
      },
      isUrgent: false
    }

    return NextResponse.json(interactionDetail)

  } catch (error) {
    console.error('Error en API de detalle de interacción:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
