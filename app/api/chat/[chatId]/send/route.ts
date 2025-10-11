import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { content, type = 'texto', imageUrl } = await req.json()
    const chatId = Number(params.chatId)
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Contenido del mensaje es requerido' }, { status: 400 })
    }

    if (!chatId) {
      return NextResponse.json({ error: 'ID de chat inválido' }, { status: 400 })
    }

    const userId = await getAuthUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Verificar que el chat existe y el usuario tiene acceso
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chat')
      .select(`
        chat_id,
        intercambio_id,
        intercambio (
          usuario_propone_id,
          usuario_recibe_id
        )
      `)
      .eq('chat_id', chatId)
      .eq('activo', true)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
    }

    const intercambio = chat.intercambio as any
    if (!intercambio || (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId)) {
      return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
    }

    // Crear el mensaje
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('mensaje')
      .insert({
        chat_id: chatId,
        usuario_id: userId,
        contenido: content.trim(),
        tipo: type,
        archivo_url: imageUrl || null,
        leido: false,
        fecha_envio: new Date().toISOString()
      })
      .select(`
        mensaje_id,
        contenido,
        tipo,
        archivo_url,
        fecha_envio,
        leido,
        usuario_id,
        usuario (
          user_id,
          nombre,
          apellido,
          foto_perfil
        )
      `)
      .single()

    if (messageError || !newMessage) {
      console.error('Error creando mensaje:', messageError)
      return NextResponse.json({ error: 'Error enviando mensaje' }, { status: 500 })
    }

    // Actualizar último mensaje del chat
    await supabaseAdmin
      .from('chat')
      .update({ ultimo_mensaje: new Date().toISOString() })
      .eq('chat_id', chatId)

    // Crear notificación para el otro usuario
    const otherUserId = intercambio.usuario_propone_id === userId 
      ? intercambio.usuario_recibe_id 
      : intercambio.usuario_propone_id

    // Obtener información del producto para la notificación
    const { data: productInfo } = await supabaseAdmin
      .from('producto')
      .select('titulo, imagenes (url_imagen)')
      .eq('producto_id', intercambio.producto_ofrecido_id)
      .single()

    await supabaseAdmin
      .from('notificacion')
      .insert({
        usuario_id: otherUserId,
        tipo: 'nuevo_mensaje',
        titulo: `Mensaje sobre "${productInfo?.titulo || 'producto'}"`,
        mensaje: `${(newMessage.usuario as any)?.nombre || 'Usuario'} ${(newMessage.usuario as any)?.apellido || ''}: ${newMessage.contenido}`,
        datos_adicionales: {
          chat_id: chatId,
          mensaje_id: newMessage.mensaje_id,
          sender_id: userId,
          sender_name: (newMessage.usuario as any)?.nombre || 'Usuario',
          sender_lastname: (newMessage.usuario as any)?.apellido || '',
          product_id: intercambio.producto_ofrecido_id,
          product_title: productInfo?.titulo || 'Producto',
          product_image: productInfo?.imagenes?.[0]?.url_imagen || null,
          message_type: 'new_message'
        },
        leida: false,
        fecha_creacion: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'Mensaje enviado exitosamente',
      data: {
        id: newMessage.mensaje_id,
        content: newMessage.contenido,
        type: newMessage.tipo,
        imageUrl: newMessage.archivo_url,
        timestamp: newMessage.fecha_envio,
        isRead: newMessage.leido,
        sender: {
          id: newMessage.usuario_id,
          name: (newMessage.usuario as any)?.nombre,
          lastName: (newMessage.usuario as any)?.apellido,
          avatar: (newMessage.usuario as any)?.foto_perfil
        }
      }
    })

  } catch (error: any) {
    console.error('Error en API de enviar mensaje:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
