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

export async function POST(req: NextRequest) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    try {
        const body = await req.json()
        const { chatId, contenido, tipo = 'texto', archivo_url } = body

        if (!chatId || !contenido) {
            return NextResponse.json({ error: 'Chat ID y contenido son requeridos' }, { status: 400 })
        }

        // Verificar que el chat existe y está activo
        const { data: chat } = await supabaseAdmin
            .from('chat')
            .select('chat_id, activo')
            .eq('chat_id', chatId)
            .single()

        if (!chat || !chat.activo) {
            return NextResponse.json({ error: 'Chat no encontrado o inactivo' }, { status: 404 })
        }

        // Obtener el ID del admin actual
        const { data: adminUser } = await supabaseAdmin
            .from('usuario')
            .select('user_id')
            .eq('email', guard.user.email)
            .single()

        if (!adminUser) {
            return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })
        }

        // Crear mensaje como admin (usando un ID especial para admin)
        const { data: message, error: messageError } = await supabaseAdmin
            .from('mensaje')
            .insert({
                chat_id: chatId,
                usuario_id: adminUser.user_id,
                contenido: contenido,
                tipo: tipo,
                archivo_url: archivo_url || null,
                leido: false,
                es_admin: true // Marcar como mensaje de admin
            })
            .select()
            .single()

        if (messageError) {
            console.error('Error creando mensaje:', messageError)
            return NextResponse.json({ error: messageError.message }, { status: 400 })
        }

        // Actualizar último mensaje del chat
        await supabaseAdmin
            .from('chat')
            .update({ ultimo_mensaje: new Date().toISOString() })
            .eq('chat_id', chatId)

        // Crear notificación para los usuarios del chat
        const { data: intercambio } = await supabaseAdmin
            .from('intercambio')
            .select('usuario_propone_id, usuario_recibe_id')
            .eq('intercambio_id', (await supabaseAdmin
                .from('chat')
                .select('intercambio_id')
                .eq('chat_id', chatId)
                .single()
            ).data?.intercambio_id)
            .single()

        if (intercambio) {
            // Notificar a ambos usuarios
            const notificaciones = [
                {
                    usuario_id: intercambio.usuario_propone_id,
                    tipo: 'mensaje',
                    titulo: 'Nuevo mensaje del administrador',
                    mensaje: `El administrador escribió: ${contenido.substring(0, 50)}${contenido.length > 50 ? '...' : ''}`,
                    es_push: true,
                    es_email: false
                },
                {
                    usuario_id: intercambio.usuario_recibe_id,
                    tipo: 'mensaje',
                    titulo: 'Nuevo mensaje del administrador',
                    mensaje: `El administrador escribió: ${contenido.substring(0, 50)}${contenido.length > 50 ? '...' : ''}`,
                    es_push: true,
                    es_email: false
                }
            ]

            await supabaseAdmin
                .from('notificacion')
                .insert(notificaciones)
        }

        return NextResponse.json({
            ok: true,
            message: {
                ...message,
                es_admin: true,
                admin_name: 'Administrador'
            }
        })

    } catch (error) {
        console.error('Error enviando mensaje:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}



