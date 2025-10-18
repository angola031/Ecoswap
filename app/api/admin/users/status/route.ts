import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


async function requireAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }
    
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }

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
    return { ok: true }
}

export async function POST(req: NextRequest) {
        const supabase = getSupabaseClient()
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    const body = await req.json().catch(() => ({}))
    const { userId, action, motivo } = body || {}
    if (!userId || !['suspender', 'reactivar'].includes(action)) {
        return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    if (action === 'suspender') {
        const { error: e1 } = await supabase.from('usuario').update({ activo: false }).eq('user_id', userId)
        if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })
        // Notificar al usuario
        await supabase.from('notificacion').insert({
            usuario_id: userId,
            tipo: 'suspension',
            titulo: 'Cuenta suspendida',
            mensaje: motivo ? `Tu cuenta fue suspendida: ${motivo}` : 'Tu cuenta fue suspendida por incumplir las políticas.',
            es_push: true,
            es_email: false
        })
    } else {
        const { error: e1 } = await supabase.from('usuario').update({ activo: true }).eq('user_id', userId)
        if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })
        await supabase.from('notificacion').insert({
            usuario_id: userId,
            tipo: 'suspension',
            titulo: 'Cuenta reactivada',
            mensaje: 'Tu cuenta fue reactivada. Por favor, respeta las políticas de la comunidad.',
            es_push: true,
            es_email: false
        })
    }

    return NextResponse.json({ ok: true })
}


