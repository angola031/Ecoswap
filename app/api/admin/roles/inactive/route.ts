import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


// Middleware para verificar super admin
async function requireSuperAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }

    const supabase = getSupabaseClient()
    if (!supabase) return { ok: false, error: 'Database not configured' as const }

    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }

    // Verificar super admin por DB
    let isSuperAdmin = false
    if (data.user.email) {
        const { data: dbUser } = await supabase
            .from('usuario')
            .select('user_id, es_admin')
            .eq('email', data.user.email)
            .single()

        if (dbUser?.es_admin) {
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
                isSuperAdmin = !!(roleNames || []).find(r => r.activo && r.nombre === 'super_admin')
            }
        }
    }

    if (!isSuperAdmin) return { ok: false, error: 'Forbidden - Se requiere rol de Super Admin' as const }
    return { ok: true, user: data.user }
}

export async function GET(req: NextRequest) {
    const guard = await requireSuperAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden - Se requiere rol de Super Admin' ? 403 : 401 })

    const supabase = getSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    try {
        // Obtener administradores desactivados
        const { data: inactiveAdmins, error: adminsError } = await supabase
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                es_admin,
                admin_desde,
                activo,
                motivo_suspension,
                fecha_suspension,
                usuario_rol!usuario_rol_usuario_id_fkey (
                    rol_id,
                    activo,
                    fecha_asignacion,
                    rol_usuario (
                        nombre,
                        descripcion
                    )
                )
            `)
            .eq('es_admin', false) // Administradores que fueron desactivados
            .not('admin_desde', 'is', null) // Que alguna vez fueron administradores
            .order('fecha_suspension', { ascending: false })

        if (adminsError) {
            console.error('Error obteniendo administradores inactivos:', adminsError)
            return NextResponse.json({ error: adminsError.message }, { status: 400 })
        }

        // Formatear administradores inactivos
        const formattedInactiveAdmins = (inactiveAdmins || []).map(admin => ({
            ...admin,
            roles: admin.usuario_rol
                ?.filter(ur => ur.activo)
                .map(ur => ({
                    rol_id: ur.rol_id,
                    nombre: (ur.rol_usuario as any)?.nombre,
                    descripcion: (ur.rol_usuario as any)?.descripcion,
                    fecha_asignacion: ur.fecha_asignacion
                }))
                .filter(ur => ur.nombre) || [],
            status: 'inactive',
            can_reactivate: true
        }))

        return NextResponse.json({
            administradores_inactivos: formattedInactiveAdmins,
            total: formattedInactiveAdmins.length
        })

    } catch (error) {
        console.error('Error obteniendo administradores inactivos:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
