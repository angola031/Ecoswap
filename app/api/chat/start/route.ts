import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  
  try {
    const { data } = await supabaseAdmin.auth.getUser(token)
    const authUserId = data?.user?.id
    if (!authUserId) return null
    
    const { data: usuario } = await supabaseAdmin
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    return usuario?.user_id ?? null
  } catch (error) {
    console.error('Error obteniendo user_id:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sellerId, productId } = await req.json()
    
    if (!sellerId || !productId) {
      return NextResponse.json({ error: 'sellerId y productId son requeridos' }, { status: 400 })
    }

    const userId = await getAuthUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Verificar que no es el mismo usuario
    if (userId === sellerId) {
      return NextResponse.json({ error: 'No puedes chatear contigo mismo' }, { status: 400 })
    }

    // Verificar que el vendedor existe
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from('usuario')
      .select('user_id, nombre, apellido, foto_perfil')
      .eq('user_id', sellerId)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 })
    }

    // Verificar que el producto existe y pertenece al vendedor
    const { data: product, error: productError } = await supabaseAdmin
      .from('producto')
      .select('producto_id, titulo, user_id')
      .eq('producto_id', productId)
      .eq('user_id', sellerId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado o no pertenece al vendedor' }, { status: 404 })
    }

    // Buscar si ya existe un intercambio entre estos usuarios para este producto
    const { data: existingIntercambio, error: intercambioError } = await supabaseAdmin
      .from('intercambio')
      .select('intercambio_id')
      .eq('usuario_propone_id', userId)
      .eq('usuario_recibe_id', sellerId)
      .eq('producto_ofrecido_id', productId)
      .single()

    let intercambioId = existingIntercambio?.intercambio_id

    // Si no existe intercambio, crear uno
    if (!existingIntercambio) {
      const { data: newIntercambio, error: createIntercambioError } = await supabaseAdmin
        .from('intercambio')
        .insert({
          usuario_propone_id: userId,
          usuario_recibe_id: sellerId,
          producto_ofrecido_id: productId,
          mensaje_propuesta: 'Chat iniciado sobre el producto',
          estado: 'pendiente',
          fecha_propuesta: new Date().toISOString()
        })
        .select('intercambio_id')
        .single()

      if (createIntercambioError || !newIntercambio) {
        console.error('Error creando intercambio:', createIntercambioError)
        return NextResponse.json({ error: 'Error creando intercambio' }, { status: 500 })
      }

      intercambioId = newIntercambio.intercambio_id
    }

    // Buscar si ya existe un chat para este intercambio
    const { data: existingChat, error: chatError } = await supabaseAdmin
      .from('chat')
      .select('chat_id')
      .eq('intercambio_id', intercambioId)
      .single()

    if (existingChat) {
      // Si ya existe el chat, retornarlo
      return NextResponse.json({ 
        chatId: existingChat.chat_id,
        intercambioId: intercambioId,
        message: 'Chat existente encontrado',
        seller: {
          id: seller.user_id,
          nombre: seller.nombre,
          apellido: seller.apellido,
          foto_perfil: seller.foto_perfil
        },
        product: {
          id: product.producto_id,
          titulo: product.titulo
        }
      })
    }

    // Crear nuevo chat
    const { data: newChat, error: createError } = await supabaseAdmin
      .from('chat')
      .insert({
        intercambio_id: intercambioId,
        fecha_creacion: new Date().toISOString(),
        activo: true
      })
      .select('chat_id')
      .single()

    if (createError || !newChat) {
      console.error('Error creando chat:', createError)
      return NextResponse.json({ error: 'Error creando chat' }, { status: 500 })
    }

    // Enviar mensaje de bienvenida automático
    const welcomeMessage = `¡Hola! Me interesa tu producto "${product.titulo}". ¿Podrías darme más información?`
    
    await supabaseAdmin
      .from('mensaje')
      .insert({
        chat_id: newChat.chat_id,
        usuario_id: userId,
        contenido: welcomeMessage,
        tipo: 'texto',
        leido: false,
        fecha_envio: new Date().toISOString()
      })

    // Actualizar último mensaje del chat
    await supabaseAdmin
      .from('chat')
      .update({ ultimo_mensaje: new Date().toISOString() })
      .eq('chat_id', newChat.chat_id)

    // Obtener información del comprador para la notificación
    const { data: buyer } = await supabaseAdmin
      .from('usuario')
      .select('nombre, apellido')
      .eq('user_id', userId)
      .single()

    // Crear notificación detallada para el vendedor
    await supabaseAdmin
      .from('notificacion')
      .insert({
        usuario_id: sellerId,
        tipo: 'nuevo_mensaje',
        titulo: `Nuevo chat sobre "${product.titulo}"`,
        mensaje: `${buyer?.nombre || 'Un usuario'} ${buyer?.apellido || ''} ha iniciado una conversación sobre tu producto "${product.titulo}". ¡Responde para cerrar el intercambio!`,
        datos_adicionales: {
          chat_id: newChat.chat_id,
          sender_id: userId,
          sender_name: buyer?.nombre || 'Usuario',
          sender_lastname: buyer?.apellido || '',
          product_id: productId,
          product_title: product.titulo,
          message_type: 'chat_started'
        },
        leida: false,
        fecha_creacion: new Date().toISOString()
      })

    return NextResponse.json({ 
      chatId: newChat.chat_id,
      intercambioId: intercambioId,
      message: 'Chat creado exitosamente con mensaje de bienvenida',
      seller: {
        id: seller.user_id,
        nombre: seller.nombre,
        apellido: seller.apellido,
        foto_perfil: seller.foto_perfil
      },
      product: {
        id: product.producto_id,
        titulo: product.titulo
      }
    })

  } catch (error: any) {
    console.error('Error en API de iniciar chat:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
