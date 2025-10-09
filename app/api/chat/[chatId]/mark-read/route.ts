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

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    let messageIds = null
    try {
      const body = await req.json()
      messageIds = body.messageIds
    } catch (jsonError) {
    }
    
    const chatId = Number(params.chatId)
    
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

    // Si se especifican mensajes específicos, marcar solo esos
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('mensaje')
        .update({ 
          leido: true,
          fecha_lectura: new Date().toISOString()
        })
        .in('mensaje_id', messageIds)
        .eq('chat_id', chatId)
        .neq('usuario_id', userId) // Solo marcar mensajes de otros usuarios

      if (updateError) {
        console.error('Error marcando mensajes como leídos:', updateError)
        return NextResponse.json({ error: 'Error marcando mensajes como leídos' }, { status: 500 })
      }
    } else {
      // Marcar todos los mensajes no leídos del chat como leídos
      const { error: updateError } = await supabaseAdmin
        .from('mensaje')
        .update({ 
          leido: true,
          fecha_lectura: new Date().toISOString()
        })
        .eq('chat_id', chatId)
        .eq('leido', false)
        .neq('usuario_id', userId) // Solo marcar mensajes de otros usuarios

      if (updateError) {
        console.error('Error marcando mensajes como leídos:', updateError)
        return NextResponse.json({ error: 'Error marcando mensajes como leídos' }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: 'Mensajes marcados como leídos exitosamente',
      chatId: chatId,
      markedCount: messageIds ? messageIds.length : 'all'
    })

  } catch (error: any) {
    console.error('Error en API de marcar como leído:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
