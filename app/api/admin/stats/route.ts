import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


// Middleware para verificar admin
async function requireAdmin(req: NextRequest) {
    const supabase = getSupabaseClient()
    if (!supabase) return { ok: false, error: 'Supabase no está configurado' as const }
    
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }

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

export async function GET(req: NextRequest) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    const url = new URL(req.url)
    const type = url.searchParams.get('type')

    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }
        
        if (type === 'productos') {
            // Estadísticas de productos
            const { count: totalProductos } = await supabase
                .from('producto')
                .select('*', { count: 'exact', head: true })

            return NextResponse.json({ totalProductos: totalProductos || 0 })
        }

        if (type === 'intercambios') {
            // Estadísticas de intercambios
            const { count: totalIntercambios } = await supabase
                .from('intercambio')
                .select('*', { count: 'exact', head: true })

            return NextResponse.json({ totalIntercambios: totalIntercambios || 0 })
        }

        // Estadísticas generales de usuarios
        const [
            { count: totalUsuarios },
            { count: usuariosActivos },
            { count: usuariosVerificados },
            { count: verificacionesPendientes }
        ] = await Promise.all([
            supabase
                .from('usuario')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('usuario')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true),
            supabase
                .from('usuario')
                .select('*', { count: 'exact', head: true })
                .eq('verificado', true),
            supabase
                .from('validacion_usuario')
                .select('*', { count: 'exact', head: true })
                .in('estado', ['pendiente', 'en_revision'])
        ])

        return NextResponse.json({
            totalUsuarios: totalUsuarios || 0,
            usuariosActivos: usuariosActivos || 0,
            usuariosVerificados: usuariosVerificados || 0,
            verificacionesPendientes: verificacionesPendientes || 0,
            totalProductos: 0, // Se carga por separado
            totalIntercambios: 0 // Se carga por separado
        })

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}



