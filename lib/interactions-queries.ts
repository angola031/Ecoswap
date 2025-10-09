// Funciones de base de datos para el módulo de interacciones
import { supabase } from './supabase'
import { 
  IntercambioWithDetails, 
  ChatWithDetails, 
  Mensaje, 
  Propuesta, 
  Calificacion,
  Notificacion,
  IntercambioFilters,
  PaginatedResponse,
  ApiResponse
} from './types/database'
import { 
  InteractionSummary, 
  InteractionDetail, 
  UserActivity, 
  SystemEvent,
  InteractionStats,
  InteractionsResponse,
  InteractionFilters
} from './types/interactions'

// ===== CONSULTAS DE INTERACCIONES =====

/**
 * Obtiene todas las interacciones de un usuario con filtros opcionales
 */
export async function getInteractions(
  userId: number,
  filters: InteractionFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<InteractionsResponse>> {
  try {
    const offset = (page - 1) * limit

    // Construir consulta base
    let query = supabase
      .from('intercambio')
      .select(`
        *,
        producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey(
          *,
          imagenes:imagen_producto(*),
          usuario:usuario!producto_user_id_fkey(*),
          categoria:categoria(*)
        ),
        producto_solicitado:producto!intercambio_producto_solicitado_id_fkey(
          *,
          imagenes:imagen_producto(*),
          usuario:usuario!producto_user_id_fkey(*),
          categoria:categoria(*)
        ),
        usuario_propone:usuario!intercambio_usuario_propone_id_fkey(
          *,
          ubicaciones:ubicacion(*)
        ),
        usuario_recibe:usuario!intercambio_usuario_recibe_id_fkey(
          *,
          ubicaciones:ubicacion(*)
        ),
        chat(
          chat_id,
          mensajes:mensaje(
            mensaje_id,
            contenido
          )
        )
      `)

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('estado', filters.status)
    }

    if (filters.type) {
      // Filtrar por tipo de transacción del producto ofrecido
      query = query.eq('producto_ofrecido.tipo_transaccion', filters.type)
    }

    if (filters.dateFrom) {
      query = query.gte('fecha_propuesta', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('fecha_propuesta', filters.dateTo)
    }

    // Filtrar por usuario (como propone o recibe)
    query = query.or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)

    // Aplicar paginación y ordenamiento
    query = query
      .order('fecha_propuesta', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error obteniendo interacciones:', error)
      return { success: false, error: error.message }
    }

    if (data && data.length > 0) {
    }

    // Transformar datos a InteractionSummary
    const interactions: InteractionSummary[] = (data || []).map((intercambio, index) => {
      // Validar datos requeridos
      if (!intercambio.producto_ofrecido) {
        console.warn('Intercambio sin producto ofrecido:', intercambio.intercambio_id)
        return null
      }

      return {
        id: intercambio.intercambio_id?.toString() || '',
        type: intercambio.producto_ofrecido?.tipo_transaccion || 'intercambio',
        status: intercambio.estado || 'pendiente',
        title: intercambio.producto_ofrecido?.titulo || '',
        description: intercambio.mensaje_propuesta || '',
        offeredProduct: {
          id: intercambio.producto_ofrecido?.producto_id?.toString() || '',
          title: intercambio.producto_ofrecido?.titulo || '',
          image: intercambio.producto_ofrecido?.imagenes?.[0]?.url_imagen || '',
          price: intercambio.producto_ofrecido?.precio,
          condition: intercambio.producto_ofrecido?.estado || 'usado',
          category: intercambio.producto_ofrecido?.categoria?.nombre || 'Sin categoría'
        },
        requestedProduct: intercambio.producto_solicitado ? {
          id: intercambio.producto_solicitado?.producto_id?.toString() || '',
          title: intercambio.producto_solicitado?.titulo || '',
          image: intercambio.producto_solicitado?.imagenes?.[0]?.url_imagen || '',
          price: intercambio.producto_solicitado?.precio,
          condition: intercambio.producto_solicitado?.estado || 'usado',
          category: intercambio.producto_solicitado?.categoria?.nombre || 'Sin categoría'
        } : undefined,
        otherUser: {
          id: intercambio.usuario_propone_id === userId 
            ? intercambio.usuario_recibe?.user_id?.toString() || ''
            : intercambio.usuario_propone?.user_id?.toString() || '',
          name: intercambio.usuario_propone_id === userId 
            ? intercambio.usuario_recibe?.nombre || ''
            : intercambio.usuario_propone?.nombre || '',
          lastName: intercambio.usuario_propone_id === userId 
            ? intercambio.usuario_recibe?.apellido || ''
            : intercambio.usuario_propone?.apellido || '',
          avatar: intercambio.usuario_propone_id === userId 
            ? intercambio.usuario_recibe?.foto_perfil
            : intercambio.usuario_propone?.foto_perfil,
          location: (() => {
            const user = intercambio.usuario_propone_id === userId 
              ? intercambio.usuario_recibe 
              : intercambio.usuario_propone
            
            console.log('🔍 DEBUG: Construyendo ubicación para usuario:', {
              userId,
              usuarioProponeId: intercambio.usuario_propone_id,
              usuarioRecibeId: intercambio.usuario_recibe_id,
              user: user ? {
                ubicaciones: user.ubicaciones?.length || 0,
                ciudad_snapshot: user.ciudad_snapshot,
                departamento_snapshot: user.departamento_snapshot,
                ciudad: user.ciudad,
                departamento: user.departamento
              } : 'null'
            })
            
            if (!user) return 'Ubicación no disponible'
            
            // Buscar ubicación principal del usuario
            const ubicacionPrincipal = user.ubicaciones?.find((ubicacion: any) => ubicacion.es_principal) || user.ubicaciones?.[0]
            
            if (ubicacionPrincipal) {
              const ciudad = ubicacionPrincipal.ciudad || ''
              const departamento = ubicacionPrincipal.departamento || ''
              const barrio = ubicacionPrincipal.barrio || ''
              
              let ubicacionCompleta = ''
              if (ciudad && departamento) {
                ubicacionCompleta = `${ciudad}, ${departamento}`
              } else if (ciudad) {
                ubicacionCompleta = ciudad
              } else if (departamento) {
                ubicacionCompleta = departamento
              }
              
              if (barrio && ubicacionCompleta) {
                ubicacionCompleta = `${barrio}, ${ubicacionCompleta}`
              }
              
              return ubicacionCompleta || 'Ubicación no disponible'
            }
            
            // Fallback a snapshots si no hay ubicaciones
            const ciudad = user.ciudad_snapshot || user.ciudad || ''
            const departamento = user.departamento_snapshot || user.departamento || ''
            
            if (ciudad && departamento) {
              return `${ciudad}, ${departamento}`
            } else if (ciudad) {
              return ciudad
            } else if (departamento) {
              return departamento
            } else {
              return 'Ubicación no disponible'
            }
          })(),
          rating: intercambio.usuario_propone_id === userId 
            ? intercambio.usuario_recibe?.calificacion_promedio || 0
            : intercambio.usuario_propone?.calificacion_promedio || 0,
          phone: intercambio.usuario_propone_id === userId 
            ? intercambio.usuario_recibe?.telefono
            : intercambio.usuario_propone?.telefono
        },
        createdAt: intercambio.fecha_propuesta || new Date().toISOString(),
        updatedAt: intercambio.fecha_respuesta || intercambio.fecha_propuesta || new Date().toISOString(),
        messagesCount: (() => {
          const raw = (intercambio.chat?.mensajes as any[]) || []
          // Aplicar el mismo filtro de ChatModule para excluir mensajes automáticos de producto
          const filtered = raw.filter((m: any) => {
            const content = m?.contenido || ''
            const isProductInfo = content.includes('Producto Ofrecido') &&
                                   content.includes('$') &&
                                   content.includes('Negociable')
            return !isProductInfo && content.trim().length > 0
          })
          return filtered.length
        })(),
        chatId: intercambio.chat?.chat_id?.toString() || '',
        additionalAmount: intercambio.monto_adicional || 0,
        meetingPlace: intercambio.lugar_encuentro,
        meetingDate: intercambio.fecha_encuentro,
        rejectionReason: intercambio.motivo_rechazo
      }
    }).filter(interaction => interaction !== null) // Filtrar nulls)

    // Obtener estadísticas
    const stats = await getInteractionStats(userId)

    const response: InteractionsResponse = {
      interactions,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > offset + limit,
      stats
    }

    return { success: true, data: response }

  } catch (error) {
    console.error('Error en getInteractions:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene los detalles completos de una interacción específica
 */
export async function getInteractionDetail(
  interactionId: string,
  userId: number
): Promise<ApiResponse<InteractionDetail>> {
  try {
    // Obtener intercambio con todos los detalles
    const { data: intercambio, error: intercambioError } = await supabase
      .from('intercambio')
      .select(`
        *,
        producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey(
          *,
          imagenes:imagen_producto(*),
          usuario:usuario!producto_user_id_fkey(*),
          categoria:categoria(*),
          ubicacion:ubicacion(*)
        ),
        producto_solicitado:producto!intercambio_producto_solicitado_id_fkey(
          *,
          imagenes:imagen_producto(*),
          usuario:usuario!producto_user_id_fkey(*),
          categoria:categoria(*),
          ubicacion:ubicacion(*)
        ),
        usuario_propone:usuario!intercambio_usuario_propone_id_fkey(
          *,
          ubicaciones:ubicacion(*)
        ),
        usuario_recibe:usuario!intercambio_usuario_recibe_id_fkey(
          *,
          ubicaciones:ubicacion(*)
        )
      `)
      .eq('intercambio_id', interactionId)
      .single()

    if (intercambioError || !intercambio) {
      return { success: false, error: 'Interacción no encontrada' }
    }

    // Verificar que el usuario tenga acceso a esta interacción
    if (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId) {
      return { success: false, error: 'No tienes permisos para ver esta interacción' }
    }

    // Obtener chat y mensajes con la misma lógica que ChatModule
    const { data: chat, error: chatError } = await supabase
      .from('chat')
      .select(`
        *,
        mensajes:mensaje(
          *,
          usuario:usuario!mensaje_usuario_id_fkey(*)
        ),
        propuestas:propuesta(
          *,
          proposer:usuario!propuesta_usuario_propone_id_fkey(*),
          receiver:usuario!propuesta_usuario_recibe_id_fkey(*)
        )
      `)
      .eq('intercambio_id', interactionId)
      .single()

    console.log('🔍 DEBUG: Chat obtenido:', {
      chatId: chat?.chat_id,
      mensajesCount: chat?.mensajes?.length || 0,
      error: chatError,
      chatExists: !!chat,
      rawChat: chat
    })

    // Si no existe chat, crear uno
    let finalChat = chat
    if (!chat && !chatError) {
      const { data: newChat, error: createChatError } = await supabase
        .from('chat')
        .insert({
          intercambio_id: parseInt(interactionId),
          activo: true
        })
        .select(`
          *,
          mensajes:mensaje(
            *,
            usuario:usuario!mensaje_usuario_id_fkey(*)
          ),
          propuestas:propuesta(
            *,
            proposer:usuario!propuesta_usuario_propone_id_fkey(*),
            receiver:usuario!propuesta_usuario_recibe_id_fkey(*)
          )
        `)
        .single()

      if (createChatError) {
        console.error('❌ Error creando chat:', createChatError)
        return { success: false, error: 'Error creando chat para la interacción' }
      }

      finalChat = newChat
    }

    // Obtener calificaciones
    const { data: calificaciones, error: calificacionesError } = await supabase
      .from('calificacion')
      .select('*')
      .eq('intercambio_id', interactionId)

    // Transformar a InteractionDetail
    const interactionDetail: InteractionDetail = {
      id: intercambio.intercambio_id.toString(),
      type: intercambio.producto_ofrecido.tipo_transaccion,
      status: intercambio.estado,
      title: intercambio.producto_ofrecido.titulo,
      description: intercambio.mensaje_propuesta || '',
      offeredProduct: {
        id: intercambio.producto_ofrecido.producto_id.toString(),
        title: intercambio.producto_ofrecido.titulo,
        image: intercambio.producto_ofrecido.imagenes?.[0]?.url_imagen || '',
        price: intercambio.producto_ofrecido.precio,
        condition: intercambio.producto_ofrecido.estado,
        category: intercambio.producto_ofrecido.categoria.nombre
      },
      requestedProduct: intercambio.producto_solicitado ? {
        id: intercambio.producto_solicitado.producto_id.toString(),
        title: intercambio.producto_solicitado.titulo,
        image: intercambio.producto_solicitado.imagenes?.[0]?.url_imagen || '',
        price: intercambio.producto_solicitado.precio,
        condition: intercambio.producto_solicitado.estado,
        category: intercambio.producto_solicitado.categoria.nombre
      } : undefined,
      otherUser: {
        id: intercambio.usuario_propone_id === userId 
          ? intercambio.usuario_recibe.user_id.toString()
          : intercambio.usuario_propone.user_id.toString(),
        name: intercambio.usuario_propone_id === userId 
          ? intercambio.usuario_recibe.nombre
          : intercambio.usuario_propone.nombre,
        lastName: intercambio.usuario_propone_id === userId 
          ? intercambio.usuario_recibe.apellido
          : intercambio.usuario_propone.apellido,
        avatar: intercambio.usuario_propone_id === userId 
          ? intercambio.usuario_recibe.foto_perfil
          : intercambio.usuario_propone.foto_perfil,
        location: (() => {
          const user = intercambio.usuario_propone_id === userId 
            ? intercambio.usuario_recibe 
            : intercambio.usuario_propone
          
          if (!user) return 'Ubicación no disponible'
          
          // Buscar ubicación principal del usuario
          const ubicacionPrincipal = user.ubicaciones?.find((ubicacion: any) => ubicacion.es_principal) || user.ubicaciones?.[0]
          
          if (ubicacionPrincipal) {
            const ciudad = ubicacionPrincipal.ciudad || ''
            const departamento = ubicacionPrincipal.departamento || ''
            const barrio = ubicacionPrincipal.barrio || ''
            
            let ubicacionCompleta = ''
            if (ciudad && departamento) {
              ubicacionCompleta = `${ciudad}, ${departamento}`
            } else if (ciudad) {
              ubicacionCompleta = ciudad
            } else if (departamento) {
              ubicacionCompleta = departamento
            }
            
            if (barrio && ubicacionCompleta) {
              ubicacionCompleta = `${barrio}, ${ubicacionCompleta}`
            }
            
            return ubicacionCompleta || 'Ubicación no disponible'
          }
          
          // Fallback a snapshots si no hay ubicaciones
          const ciudad = user.ciudad_snapshot || user.ciudad || ''
          const departamento = user.departamento_snapshot || user.departamento || ''
          
          if (ciudad && departamento) {
            return `${ciudad}, ${departamento}`
          } else if (ciudad) {
            return ciudad
          } else if (departamento) {
            return departamento
          } else {
            return 'Ubicación no disponible'
          }
        })(),
        rating: intercambio.usuario_propone_id === userId 
          ? intercambio.usuario_recibe.calificacion_promedio
          : intercambio.usuario_propone.calificacion_promedio,
        phone: intercambio.usuario_propone_id === userId 
          ? intercambio.usuario_recibe.telefono
          : intercambio.usuario_propone.telefono
      },
      createdAt: intercambio.fecha_propuesta,
      updatedAt: intercambio.fecha_respuesta || intercambio.fecha_propuesta,
      messagesCount: finalChat?.mensajes?.length || 0,
      chatId: finalChat?.chat_id?.toString() || '',
      additionalAmount: intercambio.monto_adicional,
      meetingPlace: intercambio.lugar_encuentro,
      meetingDate: intercambio.fecha_encuentro,
      rejectionReason: intercambio.motivo_rechazo,
      
      // Detalles adicionales
      proposer: intercambio.usuario_propone,
      receiver: intercambio.usuario_recibe,
      messages: (() => {
        const rawMessages = finalChat?.mensajes || []
        
        const filteredMessages = rawMessages.filter((m: any) => {
          // Filtrar mensajes como en ChatModule
          const content = m.contenido || ''
          const isProductInfo = content.includes('Producto Ofrecido') && 
                               content.includes('$') && 
                               content.includes('Negociable')
          return !isProductInfo && content.trim().length > 0
        })
        
        
        const transformedMessages = filteredMessages.map((m: any) => ({
          id: m.mensaje_id.toString(),
          text: m.contenido || '',
          timestamp: m.fecha_envio,
          sender: {
            id: m.usuario?.user_id?.toString() || m.usuario_id?.toString() || '',
            name: m.usuario?.nombre || 'Usuario',
            lastName: m.usuario?.apellido || '',
            avatar: m.usuario?.foto_perfil || undefined
          },
          type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
          metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined
        }))
        
        
        return transformedMessages.sort((a, b) => Number(a.id) - Number(b.id)) // Ordenar como en ChatModule
      })(),
      proposals: (() => {
        const rawProposals = finalChat?.propuestas || []
        
        const transformedProposals = rawProposals.map((p: any) => ({
          id: p.propuesta_id,
          type: p.tipo,
          description: p.descripcion || '',
          proposedPrice: p.precio_propuesto,
          conditions: p.condiciones,
          status: p.estado,
          createdAt: p.fecha_creacion,
          respondedAt: p.fecha_respuesta,
          response: p.respuesta,
          meetingDate: p.fecha_encuentro,
          meetingPlace: p.lugar_encuentro,
          proposer: {
            id: p.proposer?.user_id || p.usuario_propone_id,
            name: p.proposer?.nombre || 'Usuario',
            lastName: p.proposer?.apellido || '',
            avatar: p.proposer?.foto_perfil || undefined
          },
          receiver: {
            id: p.receiver?.user_id || p.usuario_recibe_id,
            name: p.receiver?.nombre || 'Usuario',
            lastName: p.receiver?.apellido || '',
            avatar: p.receiver?.foto_perfil || undefined
          }
        }))
        
        
        return transformedProposals
      })(),
      deliveries: [], // TODO: Implementar entregas
      ratings: calificaciones || [],
      chat: finalChat,
      isUrgent: false, // TODO: Implementar lógica de urgencia
      notes: intercambio.notas_encuentro
    }

    return { success: true, data: interactionDetail }

  } catch (error) {
    console.error('Error en getInteractionDetail:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene estadísticas de interacciones de un usuario
 */
export async function getInteractionStats(userId: number): Promise<InteractionStats> {
  try {
    // Obtener conteos por estado
    const { data: stats, error } = await supabase
      .from('intercambio')
      .select('estado, monto_adicional')
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)

    if (error) {
      console.error('Error obteniendo estadísticas:', error)
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalValue: 0,
        averageRating: 0,
        successRate: 0
      }
    }

    const counts = {
      total: stats.length,
      pending: stats.filter(s => s.estado === 'pendiente').length,
      inProgress: stats.filter(s => s.estado === 'aceptado').length,
      completed: stats.filter(s => s.estado === 'completado').length,
      cancelled: stats.filter(s => s.estado === 'cancelado' || s.estado === 'rechazado').length
    }

    const totalValue = stats.reduce((sum, s) => sum + (s.monto_adicional || 0), 0)
    const successRate = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0

    // Obtener calificación promedio del usuario
    const { data: usuario } = await supabase
      .from('usuario')
      .select('calificacion_promedio')
      .eq('user_id', userId)
      .single()

    return {
      ...counts,
      totalValue,
      averageRating: usuario?.calificacion_promedio || 0,
      successRate
    }

  } catch (error) {
    console.error('Error en getInteractionStats:', error)
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      totalValue: 0,
      averageRating: 0,
      successRate: 0
    }
  }
}

// ===== MUTACIONES DE INTERACCIONES =====

/**
 * Acepta un intercambio
 */
export async function acceptExchange(
  exchangeId: string,
  userId: number,
  meetingData: {
    location: string
    date: string
    time: string
    notes?: string
  }
): Promise<ApiResponse<boolean>> {
  try {
    // Verificar que el usuario puede aceptar este intercambio
    const { data: intercambio, error: fetchError } = await supabase
      .from('intercambio')
      .select('*')
      .eq('intercambio_id', exchangeId)
      .eq('usuario_recibe_id', userId)
      .eq('estado', 'pendiente')
      .single()

    if (fetchError || !intercambio) {
      return { success: false, error: 'Intercambio no encontrado o no se puede aceptar' }
    }

    // Actualizar intercambio
    const { error: updateError } = await supabase
      .from('intercambio')
      .update({
        estado: 'aceptado',
        fecha_respuesta: new Date().toISOString(),
        lugar_encuentro: meetingData.location,
        fecha_encuentro: `${meetingData.date}T${meetingData.time}`,
        notas_encuentro: meetingData.notes
      })
      .eq('intercambio_id', exchangeId)

    if (updateError) {
      console.error('Error actualizando intercambio:', updateError)
      return { success: false, error: 'Error al aceptar el intercambio' }
    }

    // Crear notificación para el usuario que propone
    await supabase
      .from('notificacion')
      .insert({
        usuario_id: intercambio.usuario_propone_id,
        tipo: 'exchange_accepted',
        titulo: 'Intercambio Aceptado',
        mensaje: `Tu propuesta de intercambio ha sido aceptada. Lugar: ${meetingData.location}`,
        datos_adicionales: {
          intercambio_id: exchangeId,
          lugar_encuentro: meetingData.location,
          fecha_encuentro: `${meetingData.date}T${meetingData.time}`
        }
      })

    return { success: true, data: true }

  } catch (error) {
    console.error('Error en acceptExchange:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Rechaza un intercambio
 */
export async function rejectExchange(
  exchangeId: string,
  userId: number,
  reason: string
): Promise<ApiResponse<boolean>> {
  try {
    // Verificar que el usuario puede rechazar este intercambio
    const { data: intercambio, error: fetchError } = await supabase
      .from('intercambio')
      .select('*')
      .eq('intercambio_id', exchangeId)
      .eq('usuario_recibe_id', userId)
      .eq('estado', 'pendiente')
      .single()

    if (fetchError || !intercambio) {
      return { success: false, error: 'Intercambio no encontrado o no se puede rechazar' }
    }

    // Actualizar intercambio
    const { error: updateError } = await supabase
      .from('intercambio')
      .update({
        estado: 'rechazado',
        fecha_respuesta: new Date().toISOString(),
        motivo_rechazo: reason
      })
      .eq('intercambio_id', exchangeId)

    if (updateError) {
      console.error('Error actualizando intercambio:', updateError)
      return { success: false, error: 'Error al rechazar el intercambio' }
    }

    // Crear notificación para el usuario que propone
    await supabase
      .from('notificacion')
      .insert({
        usuario_id: intercambio.usuario_propone_id,
        tipo: 'exchange_rejected',
        titulo: 'Intercambio Rechazado',
        mensaje: `Tu propuesta de intercambio ha sido rechazada. Motivo: ${reason}`,
        datos_adicionales: {
          intercambio_id: exchangeId,
          motivo_rechazo: reason
        }
      })

    return { success: true, data: true }

  } catch (error) {
    console.error('Error en rejectExchange:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Cancela un intercambio
 */
export async function cancelExchange(
  exchangeId: string,
  userId: number,
  reason?: string
): Promise<ApiResponse<boolean>> {
  try {
    // Verificar que el usuario puede cancelar este intercambio
    const { data: intercambio, error: fetchError } = await supabase
      .from('intercambio')
      .select('*')
      .eq('intercambio_id', exchangeId)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .in('estado', ['pendiente', 'aceptado'])
      .single()

    if (fetchError || !intercambio) {
      return { success: false, error: 'Intercambio no encontrado o no se puede cancelar' }
    }

    // Actualizar intercambio
    const { error: updateError } = await supabase
      .from('intercambio')
      .update({
        estado: 'cancelado',
        fecha_respuesta: new Date().toISOString(),
        motivo_rechazo: reason || 'Cancelado por el usuario'
      })
      .eq('intercambio_id', exchangeId)

    if (updateError) {
      console.error('Error actualizando intercambio:', updateError)
      return { success: false, error: 'Error al cancelar el intercambio' }
    }

    // Notificar al otro usuario
    const otherUserId = intercambio.usuario_propone_id === userId 
      ? intercambio.usuario_recibe_id 
      : intercambio.usuario_propone_id

    await supabase
      .from('notificacion')
      .insert({
        usuario_id: otherUserId,
        tipo: 'exchange_cancelled',
        titulo: 'Intercambio Cancelado',
        mensaje: `El intercambio ha sido cancelado. Motivo: ${reason || 'No especificado'}`,
        datos_adicionales: {
          intercambio_id: exchangeId,
          motivo_cancelacion: reason
        }
      })

    return { success: true, data: true }

  } catch (error) {
    console.error('Error en cancelExchange:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Marca un intercambio como completado
 */
export async function completeExchange(
  exchangeId: string,
  userId: number
): Promise<ApiResponse<boolean>> {
  try {
    // Verificar que el usuario puede completar este intercambio
    const { data: intercambio, error: fetchError } = await supabase
      .from('intercambio')
      .select('*')
      .eq('intercambio_id', exchangeId)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .eq('estado', 'aceptado')
      .single()

    if (fetchError || !intercambio) {
      return { success: false, error: 'Intercambio no encontrado o no se puede completar' }
    }

    // Actualizar intercambio
    const { error: updateError } = await supabase
      .from('intercambio')
      .update({
        estado: 'completado',
        fecha_completado: new Date().toISOString()
      })
      .eq('intercambio_id', exchangeId)

    if (updateError) {
      console.error('Error actualizando intercambio:', updateError)
      return { success: false, error: 'Error al completar el intercambio' }
    }

    // Actualizar contadores de usuarios
    await supabase.rpc('incrementar_intercambios_completados', {
      user_id_1: intercambio.usuario_propone_id,
      user_id_2: intercambio.usuario_recibe_id
    })

    // Notificar a ambos usuarios
    await supabase
      .from('notificacion')
      .insert([
        {
          usuario_id: intercambio.usuario_propone_id,
          tipo: 'exchange_completed',
          titulo: 'Intercambio Completado',
          mensaje: '¡Tu intercambio se ha completado exitosamente!',
          datos_adicionales: { intercambio_id: exchangeId }
        },
        {
          usuario_id: intercambio.usuario_recibe_id,
          tipo: 'exchange_completed',
          titulo: 'Intercambio Completado',
          mensaje: '¡Tu intercambio se ha completado exitosamente!',
          datos_adicionales: { intercambio_id: exchangeId }
        }
      ])

    return { success: true, data: true }

  } catch (error) {
    console.error('Error en completeExchange:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Crea una nueva propuesta dentro de un chat
 */
export async function createProposal(
  chatId: string,
  userId: number,
  proposalData: {
    tipo_propuesta: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
    descripcion: string
    precio_propuesto?: number
    condiciones?: string
    fecha_encuentro?: string
    lugar_encuentro?: string
  }
): Promise<ApiResponse<Propuesta>> {
  try {
    // Obtener información del chat para validar
    const { data: chat, error: chatError } = await supabase
      .from('chat')
      .select(`
        *,
        intercambio!inner(
          usuario_propone_id,
          usuario_recibe_id
        )
      `)
      .eq('chat_id', chatId)
      .single()

    if (chatError || !chat) {
      return { success: false, error: 'Chat no encontrado' }
    }

    // Verificar que el usuario puede hacer propuestas en este chat
    const intercambio = chat.intercambio
    if (userId !== intercambio.usuario_propone_id && userId !== intercambio.usuario_recibe_id) {
      return { success: false, error: 'No tienes permisos para hacer propuestas en este chat' }
    }

    // Determinar quién recibe la propuesta
    const usuario_recibe_id = userId === intercambio.usuario_propone_id 
      ? intercambio.usuario_recibe_id 
      : intercambio.usuario_propone_id

    // Crear propuesta
    const { data: propuesta, error: propuestaError } = await supabase
      .from('propuesta')
      .insert({
        chat_id: parseInt(chatId),
        usuario_propone_id: userId,
        usuario_recibe_id,
        ...proposalData,
        estado: 'pendiente'
      })
      .select()
      .single()

    if (propuestaError) {
      console.error('Error creando propuesta:', propuestaError)
      return { success: false, error: 'Error al crear la propuesta' }
    }

    // Crear notificación
    await supabase
      .from('notificacion')
      .insert({
        usuario_id: usuario_recibe_id,
        tipo: 'new_proposal',
        titulo: 'Nueva Propuesta',
        mensaje: `Has recibido una nueva propuesta: ${proposalData.descripcion}`,
        datos_adicionales: {
          propuesta_id: propuesta.propuesta_id,
          chat_id: chatId
        }
      })

    return { success: true, data: propuesta }

  } catch (error) {
    console.error('Error en createProposal:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Responde a una propuesta
 */
export async function respondToProposal(
  proposalId: string,
  userId: number,
  response: {
    estado: 'aceptada' | 'rechazada' | 'contrapropuesta'
    respuesta: string
  }
): Promise<ApiResponse<boolean>> {
  try {
    // Verificar que el usuario puede responder a esta propuesta
    const { data: propuesta, error: fetchError } = await supabase
      .from('propuesta')
      .select('*')
      .eq('propuesta_id', proposalId)
      .eq('usuario_recibe_id', userId)
      .eq('estado', 'pendiente')
      .single()

    if (fetchError || !propuesta) {
      return { success: false, error: 'Propuesta no encontrada o no se puede responder' }
    }

    // Actualizar propuesta
    const { error: updateError } = await supabase
      .from('propuesta')
      .update({
        estado: response.estado,
        respuesta: response.respuesta,
        fecha_respuesta: new Date().toISOString()
      })
      .eq('propuesta_id', proposalId)

    if (updateError) {
      console.error('Error actualizando propuesta:', updateError)
      return { success: false, error: 'Error al responder la propuesta' }
    }

    // Crear notificación para quien hizo la propuesta
    await supabase
      .from('notificacion')
      .insert({
        usuario_id: propuesta.usuario_propone_id,
        tipo: `proposal_${response.estado}`,
        titulo: `Propuesta ${response.estado === 'aceptada' ? 'Aceptada' : response.estado === 'rechazada' ? 'Rechazada' : 'Con Contrapropuesta'}`,
        mensaje: response.respuesta,
        datos_adicionales: {
          propuesta_id: proposalId
        }
      })

    return { success: true, data: true }

  } catch (error) {
    console.error('Error en respondToProposal:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Crea una calificación para un intercambio completado
 */
export async function createRating(
  exchangeId: string,
  userId: number,
  ratingData: {
    calificado_id: number
    puntuacion: number
    comentario?: string
    aspectos_destacados?: string
    recomendaria?: boolean
    es_publica?: boolean
  }
): Promise<ApiResponse<Calificacion>> {
  try {
    // Verificar que el usuario puede calificar este intercambio
    const { data: intercambio, error: fetchError } = await supabase
      .from('intercambio')
      .select('*')
      .eq('intercambio_id', exchangeId)
      .eq('estado', 'completado')
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .single()

    if (fetchError || !intercambio) {
      return { success: false, error: 'Intercambio no encontrado o no se puede calificar' }
    }

    // Verificar que no se haya calificado antes
    const { data: existingRating, error: existingError } = await supabase
      .from('calificacion')
      .select('*')
      .eq('intercambio_id', exchangeId)
      .eq('calificador_id', userId)
      .single()

    if (existingRating) {
      return { success: false, error: 'Ya has calificado este intercambio' }
    }

    // Crear calificación
    const { data: calificacion, error: ratingError } = await supabase
      .from('calificacion')
      .insert({
        intercambio_id: parseInt(exchangeId),
        calificador_id: userId,
        ...ratingData
      })
      .select()
      .single()

    if (ratingError) {
      console.error('Error creando calificación:', ratingError)
      return { success: false, error: 'Error al crear la calificación' }
    }

    // Actualizar calificación promedio del usuario calificado
    await supabase.rpc('actualizar_calificacion_promedio', {
      user_id: ratingData.calificado_id
    })

    // Crear notificación
    await supabase
      .from('notificacion')
      .insert({
        usuario_id: ratingData.calificado_id,
        tipo: 'rating_received',
        titulo: 'Nueva Calificación',
        mensaje: `Has recibido una calificación de ${ratingData.puntuacion} estrellas`,
        datos_adicionales: {
          calificacion_id: calificacion.calificacion_id,
          intercambio_id: exchangeId,
          puntuacion: ratingData.puntuacion
        }
      })

    return { success: true, data: calificacion }

  } catch (error) {
    console.error('Error en createRating:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===== CONSULTAS DE ACTIVIDADES Y EVENTOS =====

/**
 * Obtiene las actividades recientes de un usuario
 */
export async function getUserActivities(
  userId: number,
  limit: number = 50
): Promise<ApiResponse<UserActivity[]>> {
  try {
    // Obtener actividades de diferentes fuentes
    const activities: UserActivity[] = []

    // 1. Intercambios recientes
    const { data: intercambios } = await supabase
      .from('intercambio')
      .select(`
        *,
        producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey(*),
        producto_solicitado:producto!intercambio_producto_solicitado_id_fkey(*)
      `)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .order('fecha_propuesta', { ascending: false })
      .limit(10)

    if (intercambios) {
      intercambios.forEach(intercambio => {
        activities.push({
          id: `intercambio-${intercambio.intercambio_id}`,
          type: 'exchange',
          description: `Intercambio ${intercambio.estado}: ${intercambio.producto_ofrecido.titulo}`,
          interaction: {
            id: intercambio.intercambio_id.toString(),
            type: intercambio.producto_ofrecido.tipo_transaccion,
            status: intercambio.estado,
            title: intercambio.producto_ofrecido.titulo,
            description: intercambio.mensaje_propuesta || '',
            offeredProduct: {
              id: intercambio.producto_ofrecido.producto_id.toString(),
              title: intercambio.producto_ofrecido.titulo,
              image: '',
              price: intercambio.producto_ofrecido.precio,
              condition: intercambio.producto_ofrecido.estado,
              category: ''
            },
            otherUser: {
              id: intercambio.usuario_propone_id === userId 
                ? intercambio.usuario_recibe_id.toString()
                : intercambio.usuario_propone_id.toString(),
              name: '',
              lastName: '',
              avatar: '',
              location: '',
              rating: 0
            },
            createdAt: intercambio.fecha_propuesta,
            updatedAt: intercambio.fecha_respuesta || intercambio.fecha_propuesta,
            messagesCount: 0
          },
          timestamp: intercambio.fecha_propuesta
        })
      })
    }

    // 2. Mensajes recientes
    const { data: mensajes } = await supabase
      .from('mensaje')
      .select(`
        *,
        chat!inner(
          intercambio!inner(
            usuario_propone_id,
            usuario_recibe_id
          )
        )
      `)
      .eq('usuario_id', userId)
      .order('fecha_envio', { ascending: false })
      .limit(10)

    if (mensajes) {
      mensajes.forEach(mensaje => {
        activities.push({
          id: `mensaje-${mensaje.mensaje_id}`,
          type: 'message',
          description: `Mensaje enviado: ${mensaje.contenido.substring(0, 50)}...`,
          timestamp: mensaje.fecha_envio
        })
      })
    }

    // 3. Calificaciones recibidas
    const { data: calificaciones } = await supabase
      .from('calificacion')
      .select('*')
      .eq('calificado_id', userId)
      .order('fecha_calificacion', { ascending: false })
      .limit(5)

    if (calificaciones) {
      calificaciones.forEach(calificacion => {
        activities.push({
          id: `calificacion-${calificacion.calificacion_id}`,
          type: 'rating',
          description: `Calificación recibida: ${calificacion.puntuacion} estrellas`,
          timestamp: calificacion.fecha_calificacion
        })
      })
    }

    // Ordenar por timestamp y limitar
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return { success: true, data: activities.slice(0, limit) }

  } catch (error) {
    console.error('Error en getUserActivities:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene los eventos del sistema para un usuario
 */
export async function getSystemEvents(
  userId: number,
  limit: number = 20
): Promise<ApiResponse<SystemEvent[]>> {
  try {
    // Obtener notificaciones del sistema
    const { data: notificaciones, error } = await supabase
      .from('notificacion')
      .select('*')
      .eq('usuario_id', userId)
      .order('fecha_creacion', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error obteniendo eventos del sistema:', error)
      return { success: false, error: error.message }
    }

    const events: SystemEvent[] = (notificaciones || []).map(notif => ({
      id: notif.notificacion_id.toString(),
      type: notif.tipo.includes('proposal') ? 'notification' : 
            notif.tipo.includes('deadline') ? 'deadline' :
            notif.tipo.includes('achievement') ? 'achievement' : 'notification',
      title: notif.titulo,
      description: notif.mensaje,
      date: notif.fecha_creacion,
      isRead: notif.leida,
      priority: notif.tipo.includes('urgent') ? 'high' : 'medium',
      actionUrl: notif.datos_adicionales?.action_url,
      metadata: notif.datos_adicionales
    }))

    return { success: true, data: events }

  } catch (error) {
    console.error('Error en getSystemEvents:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
