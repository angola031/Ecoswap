import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data } = await supabaseAdmin.auth.getUser(token)
    return data?.user || null
}

async function userInChat(userId: number, chatId: number) {
    // CHAT -> INTERCAMBIO -> usuarios
    const { data: chat } = await supabaseAdmin
        .from('chat')
        .select('intercambio_id, activo')
        .eq('chat_id', chatId)
        .single()
    if (!chat || chat.activo === false) return false
    const { data: it } = await supabaseAdmin
        .from('intercambio')
        .select('usuario_propone_id, usuario_recibe_id')
        .eq('intercambio_id', chat.intercambio_id)
        .single()
    if (!it) return false
    return it.usuario_propone_id === userId || it.usuario_recibe_id === userId
}

export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const chatId = Number(params.chatId)
        if (!chatId) return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 })

        // Resolve usuario_id from USUARIO by email
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id')
            .eq('email', user.email)
            .single()
        if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const allowed = await userInChat(u.user_id, chatId)
        if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const url = new URL(req.url)
        const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200)
        const beforeId = url.searchParams.get('beforeId')

        let query = supabaseAdmin
            .from('mensaje')
            .select(`
                mensaje_id, 
                chat_id, 
                usuario_id, 
                contenido, 
                tipo, 
                archivo_url, 
                leido, 
                fecha_envio,
                usuario (
                    user_id,
                    nombre,
                    apellido,
                    foto_perfil
                )
            `)
            .eq('chat_id', chatId)
            .order('mensaje_id', { ascending: false })
            .limit(limit)
        if (beforeId) {
            query = query.lt('mensaje_id', Number(beforeId))
        }
        const { data: msgs, error } = await query
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        
        // Transformar los mensajes al formato esperado por el frontend
        const transformedMessages = (msgs || []).reverse().map((msg: any) => ({
          id: msg.mensaje_id.toString(),
          senderId: msg.usuario_id.toString(),
          content: msg.contenido || '',
          timestamp: new Date(msg.fecha_envio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          isRead: msg.leido || false,
          type: msg.tipo || 'texto',
          imageUrl: msg.archivo_url || undefined,
          sender: {
            id: msg.usuario?.user_id?.toString() || '',
            name: msg.usuario?.nombre || 'Usuario',
            lastName: msg.usuario?.apellido || '',
            avatar: msg.usuario?.foto_perfil || undefined
          }
        }))
        
        return NextResponse.json({ data: transformedMessages })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const chatId = Number(params.chatId)
        if (!chatId) return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 })

        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, activo')
            .eq('email', user.email)
            .single()
        if (!u || !u.activo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const allowed = await userInChat(u.user_id, chatId)
        if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await req.json().catch(() => ({}))
        const { contenido, tipo, archivo_url } = body || {}
        if ((!contenido || typeof contenido !== 'string') && !archivo_url) {
            return NextResponse.json({ error: 'Contenido o archivo requerido' }, { status: 400 })
        }

        const payload: any = {
            chat_id: chatId,
            usuario_id: u.user_id,
            contenido: contenido || null,
            tipo: tipo && ['texto', 'imagen', 'ubicacion'].includes(tipo) ? tipo : (archivo_url ? 'imagen' : 'texto'),
            archivo_url: archivo_url || null,
            leido: false
        }

        const { data: inserted, error } = await supabaseAdmin
            .from('mensaje')
            .insert(payload)
            .select()
            .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        await supabaseAdmin.from('chat').update({ ultimo_mensaje: new Date().toISOString() }).eq('chat_id', chatId)

        return NextResponse.json({ ok: true, message: inserted })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}



