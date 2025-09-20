import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Middleware para verificar super admin
async function requireSuperAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }

    if (!supabaseAdmin) return { ok: false, error: 'Database not configured' as const }

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }

    // Verificar super admin por DB
    let isSuperAdmin = false
    if (data.user.email) {
        const { data: dbUser } = await supabaseAdmin
            .from('usuario')
            .select('user_id, es_admin')
            .eq('email', data.user.email)
            .single()

        if (dbUser?.es_admin) {
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
                isSuperAdmin = !!(roleNames || []).find(r => r.activo && r.nombre === 'super_admin')
            }
        }
    }

    if (!isSuperAdmin) return { ok: false, error: 'Forbidden - Se requiere rol de Super Admin' as const }
    return { ok: true, user: data.user }
}

export async function POST(req: NextRequest, { params }: { params: { adminId: string } }) {
    const guard = await requireSuperAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden - Se requiere rol de Super Admin' ? 403 : 401 })

    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    try {
        const adminId = Number(params.adminId)
        if (isNaN(adminId)) {
            return NextResponse.json({ error: 'ID de administrador inválido' }, { status: 400 })
        }

        // Obtener información del administrador
        const { data: admin, error: adminError } = await supabaseAdmin
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                usuario_rol!usuario_rol_usuario_id_fkey (
                    rol_usuario (
                        nombre
                    )
                )
            `)
            .eq('user_id', adminId)
            .eq('es_admin', true)
            .single()

        if (adminError || !admin) {
            return NextResponse.json({ error: 'Administrador no encontrado' }, { status: 404 })
        }

        // Obtener nombres de roles
        const roleNames = admin.usuario_rol
            ?.map(ur => (ur.rol_usuario as any)?.nombre)
            .filter(Boolean) || ['administrador']

        // Enviar email de invitación
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            admin.email,
            {
                data: {
                    name: `${admin.nombre} ${admin.apellido}`,
                    roles: roleNames
                }
            }
        )

        if (inviteError) {
            console.error('Error enviando invitación:', inviteError)
            return NextResponse.json({ error: inviteError.message }, { status: 400 })
        }

        // Crear notificación
        await supabaseAdmin
            .from('notificacion')
            .insert({
                usuario_id: admin.user_id,
                tipo: 'admin_invitation_resent',
                titulo: 'Invitación Reenviada',
                mensaje: 'Se ha reenviado la invitación para configurar tu contraseña. Revisa tu email.',
                es_push: true,
                es_email: true
            })

        return NextResponse.json({
            ok: true,
            message: 'Invitación enviada exitosamente'
        })

    } catch (error) {
        console.error('Error enviando invitación:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
