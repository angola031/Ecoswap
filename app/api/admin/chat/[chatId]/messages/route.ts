import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Middleware para verificar admin
async function requireAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }

    // Verificar admin por DB
    let isAdmin = false
    if (data.user.email) {
        const { data: dbUser } = await supabase
            .from('usuario')
            .select('user_id, es_admin')
            .eq('email', data.user.email)
            .single()
        if (dbUser?.es_admin) isAdmin = true
        else if (dbUser?.user_id) {
            const { data: roles } = await supabase
                .from('usuario_rol')
                .select('rol_id, activo')
                .eq('usuario_id', dbUser.user_id)
                .eq('activo', true)
            if (roles && roles.length > 0) {
                const ids = roles.map(r => r.rol_id)
                const { data: roleNames } = await supabase
                    .from('rol_usuario')
                    .select('rol_id, nombre, activo')
                    .in('rol_id', ids)
                isAdmin = !!(roleNames || []).find(r => r.activo && ['super_admin', 'admin_validacion', 'admin_soporte', 'moderador'].includes((r.nombre || '').toString()))
            }
        }
    }

    if (!isAdmin) return { ok: false, error: 'Forbidden' as const }
    return { ok: true, user: data.user }
}

export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    try {
        const chatId = Number(params.chatId)
        if (!chatId) return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 })

        const supabase = getSupabaseClient()
        
        // Verificar que el chat existe
        const { data: chat } = await supabase
            .from('chat')
            .select('chat_id, activo')
            .eq('chat_id', chatId)
            .single()

        if (!chat || !chat.activo) {
            return NextResponse.json({ error: 'Chat no encontrado o inactivo' }, { status: 404 })
        }

        const url = new URL(req.url)
        const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200)
        const beforeId = url.searchParams.get('beforeId')

        // Obtener mensajes con información del usuario
        let query = supabase
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
                es_admin,
                usuario:usuario_id (
                    user_id,
                    nombre,
                    apellido,
                    foto_perfil,
                    es_admin
                )
            `)
            .eq('chat_id', chatId)
            .order('mensaje_id', { ascending: false })
            .limit(limit)

        if (beforeId) {
            query = query.lt('mensaje_id', Number(beforeId))
        }

        const { data: messages, error } = await query

        if (error) {
            console.error('Error obteniendo mensajes:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Formatear mensajes
        const formattedMessages = (messages || []).reverse().map(msg => ({
            id: msg.mensaje_id,
            chatId: msg.chat_id,
            senderId: msg.usuario_id,
            senderName: msg.usuario && Array.isArray(msg.usuario) && msg.usuario.length > 0 ?
                (msg.es_admin ? 'Administrador' : `${msg.usuario[0].nombre} ${msg.usuario[0].apellido}`.trim()) :
                'Usuario',
            senderAvatar: (msg.usuario && Array.isArray(msg.usuario) && msg.usuario.length > 0) ? 
                msg.usuario[0].foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face' :
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
            content: msg.contenido,
            type: msg.tipo,
            fileUrl: msg.archivo_url,
            isRead: msg.leido,
            timestamp: msg.fecha_envio,
            isAdmin: msg.es_admin || false
        }))

        return NextResponse.json({ messages: formattedMessages })

    } catch (error) {
        console.error('Error obteniendo mensajes:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}



