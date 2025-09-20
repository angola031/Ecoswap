import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Middleware para verificar admin
async function requireAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }

    // Verificar admin por DB
    let isAdmin = false
    if (data.user.email) {
        const { data: dbUser } = await supabaseAdmin
            .from('usuario')
            .select('user_id, es_admin')
            .eq('email', data.user.email)
            .single()
        if (dbUser?.es_admin) isAdmin = true
        else if (dbUser?.user_id) {
            const { data: roles } = await supabaseAdmin
                .from('usuario_rol')
                .select('rol_id, activo')
                .eq('usuario_id', dbUser.user_id)
                .eq('activo', true)
            if (roles && roles.length > 0) {
                const ids = roles.map(r => r.rol_id)
                const { data: roleNames } = await supabaseAdmin
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

export async function GET(req: NextRequest) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    try {
        // Obtener todas las conversaciones activas
        const { data: chats } = await supabaseAdmin
            .from('chat')
            .select(`
                chat_id,
                intercambio_id,
                ultimo_mensaje,
                activo,
                intercambio:intercambio_id (
                    intercambio_id,
                    usuario_propone_id,
                    usuario_recibe_id,
                    fecha_propuesta,
                    estado
                )
            `)
            .eq('activo', true)
            .order('ultimo_mensaje', { ascending: false, nullsFirst: false })

        const conversations = []

        for (const chat of chats || []) {
            if (!chat.intercambio) continue

            const { usuario_propone_id, usuario_recibe_id } = chat.intercambio

            // Obtener información de ambos usuarios
            const [proponente, receptor] = await Promise.all([
                supabaseAdmin
                    .from('usuario')
                    .select('user_id, nombre, apellido, email, foto_perfil, activo, verificado')
                    .eq('user_id', usuario_propone_id)
                    .single(),
                supabaseAdmin
                    .from('usuario')
                    .select('user_id, nombre, apellido, email, foto_perfil, activo, verificado')
                    .eq('user_id', usuario_recibe_id)
                    .single()
            ])

            // Obtener último mensaje
            const { data: lastMessage } = await supabaseAdmin
                .from('mensaje')
                .select('contenido, tipo, fecha_envio, usuario_id')
                .eq('chat_id', chat.chat_id)
                .order('mensaje_id', { ascending: false })
                .limit(1)
                .single()

            // Contar mensajes no leídos
            const { count: unreadCount } = await supabaseAdmin
                .from('mensaje')
                .select('mensaje_id', { count: 'exact', head: true })
                .eq('chat_id', chat.chat_id)
                .eq('leido', false)

            conversations.push({
                id: chat.chat_id,
                intercambioId: chat.intercambio_id,
                participantes: [
                    {
                        id: proponente.data?.user_id,
                        nombre: proponente.data ? `${proponente.data.nombre} ${proponente.data.apellido}`.trim() : 'Usuario',
                        email: proponente.data?.email,
                        avatar: proponente.data?.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                        activo: proponente.data?.activo,
                        verificado: proponente.data?.verificado
                    },
                    {
                        id: receptor.data?.user_id,
                        nombre: receptor.data ? `${receptor.data.nombre} ${receptor.data.apellido}`.trim() : 'Usuario',
                        email: receptor.data?.email,
                        avatar: receptor.data?.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                        activo: receptor.data?.activo,
                        verificado: receptor.data?.verificado
                    }
                ],
                lastMessage: lastMessage ? {
                    contenido: lastMessage.contenido,
                    tipo: lastMessage.tipo,
                    fecha: lastMessage.fecha_envio,
                    esAdmin: false // Los admins no envían mensajes regulares
                } : null,
                unreadCount: unreadCount || 0,
                estado: chat.intercambio.estado,
                fechaCreacion: chat.intercambio.fecha_propuesta
            })
        }

        return NextResponse.json({ conversations })

    } catch (error) {
        console.error('Error obteniendo conversaciones:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}



