import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function parseAdminEmails(): Set<string> {
    const raw = process.env.ADMIN_EMAILS || ''
    return new Set(raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean))
}

async function requirePrivileged(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }
    const email = (data.user.email || '').toLowerCase()
    const allowList = parseAdminEmails()
    const isAdmin = data.user.user_metadata?.is_admin === true || (allowList.size > 0 && allowList.has(email))
    if (!isAdmin) return { ok: false, error: 'Forbidden' as const }
    return { ok: true, user: data.user }
}

export async function POST(req: NextRequest) {
    const guard = await requirePrivileged(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    const body = await req.json().catch(() => ({}))
    const { email } = body || {}
    if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    // Buscar usuario por email
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers()
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })
    const target = list.users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    // Marcar en DB: USUARIO.es_admin = true
    const { error: dbErr } = await supabaseAdmin
        .from('usuario')
        .update({ es_admin: true, admin_desde: new Date().toISOString() })
        .eq('email', email)
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
}



