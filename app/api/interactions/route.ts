import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { InteractionSummary, InteractionsResponse, InteractionStats } from '@/lib/types/interactions'

export async function GET(req: NextRequest) {
  try {
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
              // This can be ignored if you have middleware refreshing
              // user sessions.
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

    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const offset = (page - 1) * limit

    // Construir consulta base para intercambios
    let query = supabase
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
          precio,
          estado,
          tipo_transaccion,
          condiciones_intercambio,
          que_busco_cambio,
          precio_negociable,
          usuario:usuario!producto_user_id_fkey (
            user_id,
            nombre,
            apellido,
            foto_perfil,
            calificacion_promedio,
            ubicacion:ubicacion!ubicacion_user_id_fkey (
              ciudad,
              departamento
            )
          ),
          imagenes:imagen_producto (
            url_imagen,
            es_principal
          ),
          categoria:categoria (
            nombre
          )
        ),
        producto_solicitado:producto!intercambio_producto_solicitado_id_fkey (
          producto_id,
          titulo,
          precio,
          estado,
          tipo_transaccion,
          condiciones_intercambio,
          que_busco_cambio,
          precio_negociable,
          usuario:usuario!producto_user_id_fkey (
            user_id,
            nombre,
            apellido,
            foto_perfil,
            calificacion_promedio,
            ubicacion:ubicacion!ubicacion_user_id_fkey (
              ciudad,
              departamento
            )
          ),
          imagenes:imagen_producto (
            url_imagen,
            es_principal
          ),
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
          ubicacion:ubicacion!ubicacion_user_id_fkey (
            ciudad,
            departamento
          )
        ),
        usuario_recibe:usuario!intercambio_usuario_recibe_id_fkey (
          user_id,
          nombre,
          apellido,
          foto_perfil,
          calificacion_promedio,
          ubicacion:ubicacion!ubicacion_user_id_fkey (
            ciudad,
            departamento
          )
        ),
        chat:chat (
          chat_id,
          fecha_creacion,
          ultimo_mensaje
        )
      `)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .order('fecha_propuesta', { ascending: false })

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('estado', status)
    }

    if (type) {
      query = query.eq('producto_ofrecido.tipo_transaccion', type)
    }

    // Obtener total para paginación
    const { count } = await supabase
      .from('intercambio')
      .select('*', { count: 'exact', head: true })
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data: intercambios, error } = await query

    if (error) {
      console.error('Error obteniendo intercambios:', error)
      return NextResponse.json({ error: 'Error obteniendo intercambios' }, { status: 500 })
    }

    // Transformar datos a formato de interfaz
    const interactions: InteractionSummary[] = (intercambios || []).map((intercambio: any) => {
      // Determinar el otro usuario
      const otherUser = intercambio.usuario_propone_id === userId 
        ? intercambio.usuario_recibe 
        : intercambio.usuario_propone

      // Determinar el producto principal (el que está siendo ofrecido)
      const mainProduct = intercambio.producto_ofrecido

      // Obtener imagen principal del producto ofrecido
      const mainProductImage = mainProduct?.imagenes?.find((img: any) => img.es_principal)?.url_imagen 
        || mainProduct?.imagenes?.[0]?.url_imagen 
        || '/images/placeholder-product.jpg'

      // Obtener imagen principal del producto solicitado si existe
      const requestedProductImage = intercambio.producto_solicitado?.imagenes?.find((img: any) => img.es_principal)?.url_imagen 
        || intercambio.producto_solicitado?.imagenes?.[0]?.url_imagen 
        || '/images/placeholder-product.jpg'

      return {
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
          image: mainProductImage,
          price: mainProduct?.precio,
          condition: mainProduct?.estado || 'usado',
          category: mainProduct?.categoria?.nombre || 'Sin categoría'
        },
        requestedProduct: intercambio.producto_solicitado ? {
          id: String(intercambio.producto_solicitado.producto_id),
          title: intercambio.producto_solicitado.titulo,
          image: requestedProductImage,
          price: intercambio.producto_solicitado.precio,
          condition: intercambio.producto_solicitado.estado,
          category: intercambio.producto_solicitado.categoria?.nombre || 'Sin categoría'
        } : undefined,
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
        messagesCount: 0, // Se puede calcular después con una consulta adicional
        chatId: String(intercambio.chat?.chat_id || ''),
        additionalAmount: intercambio.monto_adicional || 0,
        meetingPlace: intercambio.lugar_encuentro,
        meetingDate: intercambio.fecha_encuentro,
        rejectionReason: intercambio.motivo_rechazo
      }
    })

    // Obtener estadísticas
    const statsQuery = supabase
      .from('intercambio')
      .select('estado, producto_ofrecido:tipo_transaccion, monto_adicional, producto_ofrecido:precio')
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)

    const { data: statsData } = await statsQuery

    const stats: InteractionStats = {
      total: count || 0,
      pending: statsData?.filter(i => i.estado === 'pendiente').length || 0,
      inProgress: statsData?.filter(i => ['aceptado'].includes(i.estado)).length || 0,
      completed: statsData?.filter(i => i.estado === 'completado').length || 0,
      cancelled: statsData?.filter(i => ['rechazado', 'cancelado'].includes(i.estado)).length || 0,
      totalValue: 0, // Calcular valor total
      averageRating: 0, // Calcular calificación promedio
      successRate: 0 // Calcular tasa de éxito
    }

    const response: InteractionsResponse = {
      interactions,
      total: count || 0,
      page,
      limit,
      hasMore: (offset + limit) < (count || 0),
      stats
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error en API de interacciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
