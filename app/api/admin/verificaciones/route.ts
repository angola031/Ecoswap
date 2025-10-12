import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Middleware mínimo: requiere bearer token y rol admin por email/domino simple
async function requireAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }
    
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }
    // Regla simple: emails del dominio del proyecto son admin, ajusta según tu necesidad
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

export async function GET(req: NextRequest) {
        const supabase = getSupabaseClient()
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    // Consultar VALIDACION_USUARIO en estado pendiente/en_revision
    const { data: valids } = await supabase
        .from('validacion_usuario')
        .select('validacion_id, usuario_id, estado, documentos_adjuntos, fecha_solicitud')
        .in('estado', ['pendiente', 'en_revision'])
        .order('fecha_solicitud', { ascending: true })

    const items = [] as any[]
    for (const v of valids || []) {
        const { data: u } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido, verificado, activo')
            .eq('user_id', v.usuario_id)
            .single()
        const prefix = `validacion/${v.usuario_id}/`
        const files: Record<string, string | null> = {
            cedula_frente: supabase.storage.from('Ecoswap').getPublicUrl(prefix + 'cedula_frente.jpg').data.publicUrl,
            cedula_reverso: supabase.storage.from('Ecoswap').getPublicUrl(prefix + 'cedula_reverso.jpg').data.publicUrl,
            selfie_validacion: supabase.storage.from('Ecoswap').getPublicUrl(prefix + 'selfie_validacion.jpg').data.publicUrl,
        }
        if (u) items.push({ ...u, estado: v.estado, validacion_id: v.validacion_id, files })
    }

    return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })
    
    const supabase = getSupabaseClient()
    const body = await req.json().catch(() => ({}))
    const { userId, action, motivo } = body || {}
    if (!userId || !['aprobar', 'rechazar', 'en_revision'].includes(action)) {
        return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }
    if (action === 'aprobar') {
        const { error: e1 } = await supabase.from('usuario').update({ verificado: true }).eq('user_id', userId)
        if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })
        const { error: e2 } = await supabase
            .from('validacion_usuario')
            .update({ estado: 'aprobada', fecha_aprobacion: new Date().toISOString() })
            .eq('usuario_id', userId)
            .eq('tipo_validacion', 'identidad')
        if (e2) return NextResponse.json({ error: e2.message }, { status: 400 })
        // Notificación al usuario
        const { data: u } = await supabase.from('usuario').select('user_id').eq('user_id', userId).single()
        if (u) {
            await supabase.from('notificacion').insert({
                usuario_id: u.user_id,
                tipo: 'verificacion',
                titulo: 'Verificación aprobada',
                mensaje: 'Tu verificación de identidad fue aprobada. ¡Gracias!',
                es_push: true,
                es_email: false
            })
        }
    } else {
        if (action === 'rechazar') {
            const { error: e1 } = await supabase.from('usuario').update({ verificado: false }).eq('user_id', userId)
            if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })
            const { error: e2 } = await supabase
                .from('validacion_usuario')
                .update({ estado: 'rechazada', fecha_revision: new Date().toISOString(), motivo_rechazo: motivo || null })
                .eq('usuario_id', userId)
                .eq('tipo_validacion', 'identidad')
            if (e2) return NextResponse.json({ error: e2.message }, { status: 400 })
            const { data: u } = await supabase.from('usuario').select('user_id').eq('user_id', userId).single()
            if (u) {
                await supabase.from('notificacion').insert({
                    usuario_id: u.user_id,
                    tipo: 'verificacion',
                    titulo: 'Verificación rechazada',
                    mensaje: motivo ? `Verificación rechazada: ${motivo}` : 'Tu verificación fue rechazada. Revisa los documentos y vuelve a intentarlo.',
                    es_push: true,
                    es_email: false
                })
            }
        } else {
            // en_revision
            const { error: e2 } = await supabase
                .from('validacion_usuario')
                .update({ estado: 'en_revision', fecha_revision: new Date().toISOString() })
                .eq('usuario_id', userId)
                .eq('tipo_validacion', 'identidad')
            if (e2) return NextResponse.json({ error: e2.message }, { status: 400 })
        }
    }
    return NextResponse.json({ ok: true })
}



