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
          producto (
            producto_id,
            titulo
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
      product: {
        id: intercambio.producto.producto_id,
        title: intercambio.producto.titulo
      },
      createdAt: chat.fecha_creacion
    })

  } catch (error: any) {
    console.error('Error en API de información del chat:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
