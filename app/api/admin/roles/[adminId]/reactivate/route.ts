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

        const body = await req.json()
        const { roles, motivo } = body

        if (!Array.isArray(roles) || roles.length === 0) {
            return NextResponse.json({ error: 'Debe especificar al menos un rol para reactivar' }, { status: 400 })
        }

        // Verificar que el usuario existe
        const { data: user, error: userError } = await supabaseAdmin
            .from('usuario')
            .select('user_id, nombre, apellido, email, es_admin, activo, admin_desde')
            .eq('user_id', adminId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Obtener el super admin actual
        const { data: superAdmin } = await supabaseAdmin
            .from('usuario')
            .select('user_id')
            .eq('email', guard.user?.email)
            .single()

        if (!superAdmin) {
            return NextResponse.json({ error: 'Super admin no encontrado' }, { status: 404 })
        }

        // Reactivar usuario como administrador
        const { error: updateError } = await supabaseAdmin
            .from('usuario')
            .update({
                activo: true,
                es_admin: true,
                admin_desde: user.es_admin ? user.admin_desde : new Date().toISOString(),
                motivo_suspension: null,
                fecha_suspension: null,
                // suspendido_por: null, // Columna no existe
                // fecha_desbloqueo: new Date().toISOString() // Columna no existe
            })
            .eq('user_id', adminId)

        if (updateError) {
            console.error('Error reactivando administrador:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        // Obtener roles existentes para este usuario
        const { data: existingRoles } = await supabaseAdmin
            .from('usuario_rol')
            .select('rol_id, activo')
            .eq('usuario_id', adminId)

        const existingRoleIds = existingRoles?.map(r => r.rol_id) || []

        // Desactivar roles anteriores
        await supabaseAdmin
            .from('usuario_rol')
            .update({ activo: false })
            .eq('usuario_id', adminId)

        // Preparar roles para asignar
        const rolesToAssign = []
        const rolesToUpdate = []

        for (const rolId of roles) {
            if (existingRoleIds.includes(rolId)) {
                // Rol ya existe, actualizar
                rolesToUpdate.push(rolId)
            } else {
                // Rol nuevo, insertar
                rolesToAssign.push({
                    usuario_id: adminId,
                    rol_id: rolId,
                    activo: true,
                    asignado_por: superAdmin.user_id,
                    fecha_asignacion: new Date().toISOString()
                })
            }
        }

        // Insertar roles nuevos
        if (rolesToAssign.length > 0) {
            const { error: insertError } = await supabaseAdmin
                .from('usuario_rol')
                .insert(rolesToAssign)

            if (insertError) {
                console.error('Error insertando roles nuevos:', insertError)
                return NextResponse.json({ error: insertError.message }, { status: 400 })
            }
        }

        // Actualizar roles existentes
        if (rolesToUpdate.length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('usuario_rol')
                .update({
                    activo: true,
                    asignado_por: superAdmin.user_id,
                    fecha_asignacion: new Date().toISOString()
                })
                .eq('usuario_id', adminId)
                .in('rol_id', rolesToUpdate)

            if (updateError) {
                console.error('Error actualizando roles existentes:', updateError)
                return NextResponse.json({ error: updateError.message }, { status: 400 })
            }
        }

        // Los errores ya se manejan individualmente arriba

        // Obtener nombres de roles para la notificación
        const { data: roleNames } = await supabaseAdmin
            .from('rol_usuario')
            .select('rol_id, nombre')
            .in('rol_id', roles)

        const roleNamesList = roleNames?.map(r => r.nombre) || ['administrador']

        // Crear notificación de reactivación
        await supabaseAdmin
            .from('notificacion')
            .insert({
                usuario_id: adminId,
                tipo: 'admin_reactivated',
                titulo: 'Acceso de Administrador Reactivado',
                mensaje: `Tu acceso como administrador ha sido reactivado. Roles asignados: ${roleNamesList.join(', ')}. ${motivo ? `Motivo: ${motivo}` : ''}`,
                es_push: true,
                es_email: true
            })

        // Enviar correo de reactivación con enlace para restablecer contraseña
        try {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
            const redirectUrl = `${siteUrl}/auth/supabase-redirect?type=recovery&next=/auth/reset-password`
            
            
            const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
                user.email,
                {
                    redirectTo: redirectUrl
                }
            )

            if (resetError) {
                console.error('❌ Error enviando correo de reactivación:', resetError.message)
                // No fallar la operación si el correo falla
            } else {
            }
        } catch (emailError) {
            console.error('❌ Error enviando correo de reactivación:', emailError)
            // No fallar la operación si el correo falla
        }

        // Obtener información completa del administrador reactivado
        const { data: reactivatedAdmin, error: adminError } = await supabaseAdmin
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                es_admin,
                admin_desde,
                activo,
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
            .eq('user_id', adminId)
            .single()

        if (adminError) {
            console.error('Error obteniendo administrador reactivado:', adminError)
        }

        return NextResponse.json({
            ok: true,
            message: 'Administrador reactivado exitosamente. Se ha enviado un correo para establecer nueva contraseña.',
            email_enviado: true,
            administrador: reactivatedAdmin ? {
                ...reactivatedAdmin,
                roles: reactivatedAdmin.usuario_rol
                    ?.filter(ur => ur.activo)
                    .map(ur => ({
                        rol_id: ur.rol_id,
                        nombre: (ur.rol_usuario as any)?.nombre,
                        descripcion: (ur.rol_usuario as any)?.descripcion,
                        fecha_asignacion: ur.fecha_asignacion
                    })) || []
            } : null
        })

    } catch (error) {
        console.error('Error reactivando administrador:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
