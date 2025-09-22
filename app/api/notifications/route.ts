import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    
    const { data } = await supabaseAdmin.auth.getUser(token)
    if (!data?.user) return null

    // Obtener usuario de la base de datos
    const { data: userData } = await supabaseAdmin
        .from('usuario')
        .select('user_id, email')
        .eq('email', data.user.email)
        .single()

    return userData || null
}

export async function GET(req: NextRequest) {
    try {
        const user = await authUser(req)
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '20')
        const unreadOnly = searchParams.get('unread_only') === 'true'

        let query = supabaseAdmin
            .from('notificacion')
            .select(`
                notificacion_id,
                tipo,
                titulo,
                mensaje,
                fecha_creacion,
                leida,
                metadata
            `)
            .eq('usuario_id', user.user_id)
            .order('fecha_creacion', { ascending: false })

        if (unreadOnly) {
            query = query.eq('leida', false)
        }

        if (limit > 0) {
            query = query.limit(limit)
        }

        const { data: notifications, error } = await query

        if (error) {
            console.error('Error obteniendo notificaciones:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ notifications: notifications || [] })

    } catch (error: any) {
        console.error('Error en API de notificaciones:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await authUser(req)
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await req.json()
        const { notification_ids, mark_as_read } = body

        if (!notification_ids || !Array.isArray(notification_ids)) {
            return NextResponse.json({ error: 'notification_ids debe ser un array' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('notificacion')
            .update({ leida: mark_as_read })
            .eq('usuario_id', user.user_id)
            .in('notificacion_id', notification_ids)

        if (error) {
            console.error('Error actualizando notificaciones:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error actualizando notificaciones:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}