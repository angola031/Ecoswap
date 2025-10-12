import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

function parseAdminEmails(): Set<string> {
    const raw = process.env.ADMIN_EMAILS || ''
    return new Set(raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean))
}

async function requirePrivileged(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }
    
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }
    const email = (data.user.email || '').toLowerCase()
    const allowList = parseAdminEmails()
    const isAdmin = data.user.user_metadata?.is_admin === true || (allowList.size > 0 && allowList.has(email))
    if (!isAdmin) return { ok: false, error: 'Forbidden' as const }
    return { ok: true, user: data.user }
}

export async function POST(req: NextRequest) {
    const supabase = getSupabaseClient()
    const guard = await requirePrivileged(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    const body = await req.json().catch(() => ({}))
    const { email } = body || {}
    if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    // Verificar que el usuario existe en la base de datos
    const { data: existingUser, error: userErr } = await supabase
        .from('usuario')
        .select('user_id, email, es_admin')
        .eq('email', email)
        .single()

    if (userErr || !existingUser) {
        return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404 })
    }

    // Marcar en DB: USUARIO.es_admin = true
    const { error: dbErr } = await supabase
        .from('usuario')
        .update({ es_admin: true, admin_desde: new Date().toISOString() })
        .eq('email', email)
    
    if (dbErr) {
        console.error('Error actualizando usuario a admin:', dbErr)
        return NextResponse.json({ error: 'Error al asignar rol de administrador' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Usuario promovido a administrador exitosamente' })
}



