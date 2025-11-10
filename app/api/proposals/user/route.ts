import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

async function getAuthUserId(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseClient()
    if (!supabase) return null

    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) return null

    // Intentar por auth_user_id
    const { data: usuarioByAuth } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioByAuth?.user_id) return usuarioByAuth.user_id

    // Fallback por email
    if (user.email) {
      const { data: usuarioByEmail } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', user.email)
        .single()
      if (usuarioByEmail?.user_id) return usuarioByEmail.user_id
    }

    return null
  } catch (error) {
    console.error('Error obteniendo usuario:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
    }

    // Obtener parámetros de query para filtrado
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // 'pendiente', 'aceptada', 'rechazada', o null para todas

    // Obtener todas las propuestas del usuario (como proponente o receptor)
    let proposalsQuery = supabase
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
        fecha_respuesta,
        respuesta,
        fecha_encuentro,
        lugar_encuentro,
        archivo_url,
        nota_intercambio,
        chat:chat!propuesta_chat_id_fkey (
          intercambio:intercambio!chat_intercambio_id_fkey (
            intercambio_id,
            producto_ofrecido_id,
            producto_solicitado_id,
            usuario_propone_id,
            usuario_recibe_id,
            producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey (
              producto_id,
              titulo,
              precio,
              tipo_transaccion,
              condiciones_intercambio,
              que_busco_cambio,
              precio_negociable,
              estado,
              estado_publicacion,
              ciudad_snapshot,
              departamento_snapshot,
              categoria:categoria (
                nombre
              )
            ),
            producto_solicitado:producto!intercambio_producto_solicitado_id_fkey (
              producto_id,
              titulo,
              precio,
              tipo_transaccion,
              condiciones_intercambio,
              que_busco_cambio,
              precio_negociable,
              estado,
              estado_publicacion,
              ciudad_snapshot,
              departamento_snapshot,
              categoria:categoria (
                nombre
              )
            )
          )
        ),
        usuario_propone:usuario!propuesta_usuario_propone_id_fkey (
          user_id,
          nombre,
          apellido,
          foto_perfil
        ),
        usuario_recibe:usuario!propuesta_usuario_recibe_id_fkey (
          user_id,
          nombre,
          apellido,
          foto_perfil
        )
      `)
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)
      .order('fecha_creacion', { ascending: false })

    // Aplicar filtro de estado si se proporciona
    if (statusFilter && statusFilter !== 'todas') {
      proposalsQuery = proposalsQuery.eq('estado', statusFilter)
    }

    const { data: proposals, error: proposalsError } = await proposalsQuery

    if (proposalsError) {
      console.error('❌ [API] Error obteniendo propuestas:', proposalsError)
      return NextResponse.json({ 
        error: 'Error obteniendo propuestas', 
        details: proposalsError.message 
      }, { status: 500 })
    }

    if (!proposals || proposals.length === 0) {
      return NextResponse.json({
        success: true,
        proposalsByProduct: [],
        totalProposals: 0
      })
    }

    // Obtener imágenes principales de productos
    const productIds = new Set<number>()
    proposals.forEach((p: any) => {
      const intercambio = p.chat?.intercambio
      if (intercambio?.producto_ofrecido_id) productIds.add(intercambio.producto_ofrecido_id)
      if (intercambio?.producto_solicitado_id) productIds.add(intercambio.producto_solicitado_id)
    })

    const { data: productImages } = await supabase
      .from('imagen_producto')
      .select('producto_id, url_imagen')
      .in('producto_id', Array.from(productIds))
      .eq('es_principal', true)

    const imagesMap = new Map<number, string>()
    productImages?.forEach((img: any) => {
      imagesMap.set(img.producto_id, img.url_imagen)
    })

    // Transformar y agrupar propuestas por producto
    const proposalsByProduct: { [key: string]: any } = {}

    proposals.forEach((proposal: any) => {
      const intercambio = proposal.chat?.intercambio
      if (!intercambio) {
        // Si no hay intercambio, agrupar en "Sin producto"
        const key = 'sin_producto'
        if (!proposalsByProduct[key]) {
          proposalsByProduct[key] = {
            product: null,
            proposals: []
          }
        }
        proposalsByProduct[key].proposals.push(transformProposal(proposal, null, userId, imagesMap))
        return
      }

      const productoOfrecido = intercambio.producto_ofrecido
      const productoSolicitado = intercambio.producto_solicitado
      const intercambioProposerId = intercambio.usuario_propone_id
      const intercambioReceiverId = intercambio.usuario_recibe_id
      const proposalProposerId = proposal.usuario_propone_id

      // Determinar a qué producto pertenece la propuesta
      // Lógica mejorada:
      // 1. Si el proposer de la propuesta = proposer del intercambio → producto ofrecido
      // 2. Si el proposer de la propuesta = receptor del intercambio → producto solicitado  
      // 3. Si el proposer de la propuesta ≠ proposer del intercambio → producto solicitado (si existe)
      // 4. Fallback: producto ofrecido si existe
      let targetProduct = null
      let productKey = 'sin_producto'

      // Normalizar IDs para comparación
      const normalizedProposalProposerId = Number(proposalProposerId)
      const normalizedIntercambioProposerId = Number(intercambioProposerId)
      const normalizedIntercambioReceiverId = Number(intercambioReceiverId)

      if (normalizedProposalProposerId === normalizedIntercambioProposerId && productoOfrecido) {
        // Caso 1: El que propone la propuesta es el que propone el intercambio → producto ofrecido
        targetProduct = productoOfrecido
        productKey = `producto_${productoOfrecido.producto_id}`
      } else if (normalizedProposalProposerId === normalizedIntercambioReceiverId && productoSolicitado) {
        // Caso 2: El que propone la propuesta es el receptor del intercambio → producto solicitado
        targetProduct = productoSolicitado
        productKey = `producto_${productoSolicitado.producto_id}`
      } else if (normalizedProposalProposerId !== normalizedIntercambioProposerId && productoSolicitado) {
        // Caso 3: El que propone la propuesta NO es el proposer del intercambio → producto solicitado
        targetProduct = productoSolicitado
        productKey = `producto_${productoSolicitado.producto_id}`
      } else if (productoOfrecido) {
        // Caso 4: Fallback - usar producto ofrecido si existe
        targetProduct = productoOfrecido
        productKey = `producto_${productoOfrecido.producto_id}`
      }

      // Debug log para verificar agrupación
      console.log('🔍 [API] Agrupando propuesta:', {
        proposalId: proposal.propuesta_id,
        proposalProposerId: normalizedProposalProposerId,
        intercambioProposerId: normalizedIntercambioProposerId,
        intercambioReceiverId: normalizedIntercambioReceiverId,
        productoOfrecidoId: productoOfrecido?.producto_id,
        productoSolicitadoId: productoSolicitado?.producto_id,
        productKey,
        targetProductId: targetProduct?.producto_id
      })

      if (!proposalsByProduct[productKey]) {
        proposalsByProduct[productKey] = {
          product: targetProduct ? transformProduct(targetProduct, imagesMap) : null,
          proposals: []
        }
      }

      proposalsByProduct[productKey].proposals.push(
        transformProposal(proposal, targetProduct, userId, imagesMap)
      )
    })

    // Convertir el objeto a un array para facilitar el renderizado
    const proposalsByProductArray = Object.values(proposalsByProduct).map((group: any) => ({
      product: group.product,
      proposals: group.proposals
    }))

    // Debug: Verificar resultado de agrupación
    console.log('🔍 [API] Resultado de agrupación:', {
      totalGroups: proposalsByProductArray.length,
      groups: proposalsByProductArray.map((g: any) => ({
        productId: g.product?.id || 'sin_producto',
        productTitle: g.product?.title || 'Sin producto',
        proposalsCount: g.proposals.length
      }))
    })

    return NextResponse.json({
      success: true,
      proposalsByProduct: proposalsByProductArray,
      totalProposals: proposals.length
    })

  } catch (error) {
    console.error('❌ [API] Error en /api/proposals/user:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

function transformProduct(product: any, imagesMap: Map<number, string>) {
  return {
    id: product.producto_id,
    title: product.titulo,
    price: product.precio,
    type: product.tipo_transaccion,
    exchangeConditions: product.condiciones_intercambio,
    exchangeSeeking: product.que_busco_cambio,
    negotiable: product.precio_negociable,
    image: imagesMap.get(product.producto_id) || null,
    category: product.categoria?.nombre || null,
    condition: product.estado,
    status: product.estado_publicacion,
    location: product.ciudad_snapshot && product.departamento_snapshot
      ? `${product.ciudad_snapshot}, ${product.departamento_snapshot}`
      : null
  }
}

function transformProposal(proposal: any, product: any, userId: number, imagesMap: Map<number, string>) {
  const isProposer = proposal.usuario_propone_id === userId

  return {
    id: proposal.propuesta_id,
    type: proposal.tipo_propuesta,
    description: proposal.descripcion,
    proposedPrice: proposal.precio_propuesto,
    conditions: proposal.condiciones,
    status: proposal.estado,
    createdAt: proposal.fecha_creacion,
    updatedAt: proposal.fecha_actualizacion,
    respondedAt: proposal.fecha_respuesta,
    response: proposal.respuesta,
    meetingDate: proposal.fecha_encuentro,
    meetingPlace: proposal.lugar_encuentro,
    archivo_url: proposal.archivo_url,
    nota_intercambio: proposal.nota_intercambio,
    proposer: {
      id: proposal.usuario_propone?.user_id || proposal.usuario_propone_id,
      name: proposal.usuario_propone?.nombre || 'Usuario',
      lastName: proposal.usuario_propone?.apellido || '',
      avatar: proposal.usuario_propone?.foto_perfil || null
    },
    receiver: {
      id: proposal.usuario_recibe?.user_id || proposal.usuario_recibe_id,
      name: proposal.usuario_recibe?.nombre || 'Usuario',
      lastName: proposal.usuario_recibe?.apellido || '',
      avatar: proposal.usuario_recibe?.foto_perfil || null
    },
    product: product ? transformProduct(product, imagesMap) : null,
    chatId: proposal.chat_id,
    isMyProposal: isProposer
  }
}
