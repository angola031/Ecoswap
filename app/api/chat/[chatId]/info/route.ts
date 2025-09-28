import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  
  console.log('🔐 [API Info] Authorization header:', auth ? 'Presente' : 'Ausente')
  console.log('🔐 [API Info] Token:', token ? `${token.substring(0, 20)}...` : 'Vacío')
  
  if (!token) {
    console.log('❌ [API Info] No hay token')
    return null
  }
  
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    console.log('🔐 [API Info] Auth response:', { data: !!data, error: !!error })
    
    if (error) {
      console.error('❌ [API Info] Error de autenticación:', error)
      return null
    }
    
    const authUserId = data?.user?.id
    console.log('🔐 [API Info] Auth user ID:', authUserId)
    
    if (!authUserId) {
      console.log('❌ [API Info] No auth user ID')
      return null
    }
    
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    console.log('🔐 [API Info] Usuario query:', { usuario, usuarioError })
    
    if (usuarioError) {
      console.error('❌ [API Info] Error obteniendo usuario:', usuarioError)
      return null
    }
    
    console.log('✅ [API Info] User ID obtenido:', usuario?.user_id)
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
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chat')
      .select(`
        chat_id,
        intercambio_id,
        fecha_creacion,
        intercambio (
          usuario_propone_id,
          usuario_recibe_id,
          producto_ofrecido_id,
          producto_solicitado_id,
          producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey (
            producto_id,
            titulo,
            precio,
            tipo_transaccion,
            condiciones_intercambio,
            que_busco_cambio,
            precio_negociable
          ),
          producto_solicitado:producto!intercambio_producto_solicitado_id_fkey (
            producto_id,
            titulo,
            precio,
            tipo_transaccion,
            condiciones_intercambio,
            que_busco_cambio,
            precio_negociable
          ),
          usuario_propone:usuario!intercambio_usuario_propone_id_fkey (
            user_id,
            nombre,
            apellido,
            foto_perfil
          ),
          usuario_recibe:usuario!intercambio_usuario_recibe_id_fkey (
            user_id,
            nombre,
            apellido,
            foto_perfil
          )
        )
      `)
      .eq('chat_id', chatId)
      .eq('activo', true)
      .single()

    // Obtener imagen principal del producto ofrecido
    let productImageUrl = null
    if (chat?.intercambio?.producto_ofrecido_id) {
      const { data: productImage } = await supabaseAdmin
        .from('imagen_producto')
        .select('url_imagen')
        .eq('producto_id', chat.intercambio.producto_ofrecido_id)
        .eq('es_principal', true)
        .single()
      
      productImageUrl = productImage?.url_imagen || null
    }

    // Obtener imagen principal del producto solicitado
    let requestedProductImageUrl = null
    if (chat?.intercambio?.producto_solicitado_id) {
      const { data: requestedProductImage } = await supabaseAdmin
        .from('imagen_producto')
        .select('url_imagen')
        .eq('producto_id', chat.intercambio.producto_solicitado_id)
        .eq('es_principal', true)
        .single()
      
      requestedProductImageUrl = requestedProductImage?.url_imagen || null
    }

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
    }

    const intercambio = chat.intercambio as any
    if (!intercambio || (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId)) {
      return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
    }

    // Determinar quién es el otro usuario (no el actual)
    const otherUser = intercambio.usuario_propone_id === userId 
      ? intercambio.usuario_recibe 
      : intercambio.usuario_propone

    return NextResponse.json({
      chatId: chat.chat_id,
      seller: {
        id: otherUser.user_id,
        name: otherUser.nombre,
        lastName: otherUser.apellido,
        avatar: otherUser.foto_perfil
      },
      offeredProduct: {
        id: intercambio.producto_ofrecido.producto_id,
        title: intercambio.producto_ofrecido.titulo,
        precio: intercambio.producto_ofrecido.precio,
        tipo_transaccion: intercambio.producto_ofrecido.tipo_transaccion,
        condiciones_intercambio: intercambio.producto_ofrecido.condiciones_intercambio,
        que_busco_cambio: intercambio.producto_ofrecido.que_busco_cambio,
        precio_negociable: intercambio.producto_ofrecido.precio_negociable,
        imageUrl: productImageUrl
      },
      requestedProduct: intercambio.producto_solicitado ? {
        id: intercambio.producto_solicitado.producto_id,
        title: intercambio.producto_solicitado.titulo,
        precio: intercambio.producto_solicitado.precio,
        tipo_transaccion: intercambio.producto_solicitado.tipo_transaccion,
        condiciones_intercambio: intercambio.producto_solicitado.condiciones_intercambio,
        que_busco_cambio: intercambio.producto_solicitado.que_busco_cambio,
        precio_negociable: intercambio.producto_solicitado.precio_negociable,
        imageUrl: requestedProductImageUrl
      } : null,
      createdAt: chat.fecha_creacion
    })

  } catch (error: any) {
    console.error('Error en API de información del chat:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
