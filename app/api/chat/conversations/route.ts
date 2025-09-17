import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data } = await supabaseAdmin.auth.getUser(token)
    return data?.user || null
}

export async function GET(req: NextRequest) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Resolve usuario_id
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, nombre, apellido, email')
            .eq('email', user.email)
            .single()
        if (!u) return NextResponse.json({ items: [] })

        // Chats del usuario a través de INTERCAMBIO
        const { data: chats } = await supabaseAdmin
            .from('chat')
            .select('chat_id, intercambio_id, ultimo_mensaje, activo')
            .order('ultimo_mensaje', { ascending: false, nullsFirst: false })

        const items: any[] = []
        for (const ch of (chats || [])) {
            // Obtener participantes del intercambio
            const { data: it } = await supabaseAdmin
                .from('intercambio')
                .select('usuario_propone_id, usuario_recibe_id, fecha_propuesta')
                .eq('intercambio_id', ch.intercambio_id)
                .single()
            if (!it) continue
            const me = u.user_id
            const otherId = it.usuario_propone_id === me ? it.usuario_recibe_id : it.usuario_propone_id
            if (otherId !== it.usuario_propone_id && otherId !== it.usuario_recibe_id) continue

            // Info del otro usuario
            const { data: other } = await supabaseAdmin
                .from('usuario')
                .select('user_id, nombre, apellido, foto_perfil')
                .eq('user_id', otherId)
                .single()

            // Último mensaje como texto
            const { data: lastMsg } = await supabaseAdmin
                .from('mensaje')
                .select('contenido, tipo, fecha_envio')
                .eq('chat_id', ch.chat_id)
                .order('mensaje_id', { ascending: false })
                .limit(1)
                .single()

            // Unread count
            const { count: unread } = await supabaseAdmin
                .from('mensaje')
                .select('mensaje_id', { count: 'exact', head: true })
                .eq('chat_id', ch.chat_id)
                .neq('usuario_id', me)
                .eq('leido', false)

            items.push({
                id: ch.chat_id,
                user: {
                    id: other?.user_id,
                    name: other ? `${other.nombre} ${other.apellido}`.trim() : 'Usuario',
                    avatar: other?.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                    location: 'Colombia',
                    isOnline: false,
                    lastSeen: ''
                },
                lastMessage: lastMsg ? (lastMsg.tipo === 'texto' ? (lastMsg.contenido || '') : lastMsg.tipo) : '',
                lastMessageTime: lastMsg ? lastMsg.fecha_envio : it.fecha_propuesta,
                unreadCount: unread || 0
            })
        }

        return NextResponse.json({ items })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}



