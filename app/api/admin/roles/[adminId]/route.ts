import { NextRequest, NextResponse } from 'next/server'

// Middleware para verificar super admin
async function requireSuperAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    
    if (!token) {
        return { ok: false, error: 'Unauthorized' as const }
    }

    if (!supabaseAdmin) {
        return { ok: false, error: 'Database not configured' as const }
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error) {
        return { ok: false, error: 'Unauthorized' as const }
    }
    
    if (!data?.user) {
        return { ok: false, error: 'Unauthorized' as const }
    }
    

    // Verificar super admin por DB
    let isSuperAdmin = false
    if (data.user.email) {
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('usuario')
            .select('user_id, es_admin')
            .eq('email', data.user.email)
            .single()

        if (dbError) {
            return { ok: false, error: 'Database error' as const }
        }


        if (dbUser?.es_admin) {
            // Verificar si tiene rol de super admin
            const { data: roles, error: rolesError } = await supabaseAdmin
                .from('usuario_rol')
                .select('rol_id, activo')
                .eq('usuario_id', dbUser.user_id)
                .eq('activo', true)

            if (rolesError) {
                return { ok: false, error: 'Database error' as const }
            }


            if (roles && roles.length > 0) {
                const ids = roles.map(r => r.rol_id)
                const { data: roleNames, error: roleNamesError } = await supabaseAdmin
                    .from('rol_usuario')
                    .select('rol_id, nombre, activo')
                    .in('rol_id', ids)

                if (roleNamesError) {
                    return { ok: false, error: 'Database error' as const }
                }

                isSuperAdmin = !!(roleNames || []).find(r => r.activo && r.nombre === 'super_admin')
            } else {
            }
        } else {
        }
    }

    if (!isSuperAdmin) {
        return { ok: false, error: 'Forbidden - Se requiere rol de Super Admin' as const }
    }
    
    return { ok: true, user: data.user }
}

export async function GET(req: NextRequest, { params }: { params: { adminId: string } }) {
    const guard = await requireSuperAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden - Se requiere rol de Super Admin' ? 403 : 401 })

    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    try {
        const adminId = Number(params.adminId)
        if (isNaN(adminId)) {
            return NextResponse.json({ error: 'ID de administrador inválido' }, { status: 400 })
        }

        // Obtener administrador con sus roles
        const { data: admin, error: adminError } = await supabaseAdmin
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
                    asignado_por,
                    rol_usuario (
                        nombre,
                        descripcion,
                        permisos
                    )
                )
            `)
            .eq('user_id', adminId)
            .eq('es_admin', true)
            .single()

        if (adminError) {
            console.error('Error obteniendo administrador:', adminError)
            return NextResponse.json({ error: adminError.message }, { status: 400 })
        }

        if (!admin) {
            return NextResponse.json({ error: 'Administrador no encontrado' }, { status: 404 })
        }

        // Formatear administrador con sus roles
        const adminWithRoles = {
            ...admin,
            roles: admin.usuario_rol
                ?.filter(ur => ur.activo)
                .map(ur => ({
                    rol_id: ur.rol_id,
                    nombre: (ur.rol_usuario as any)?.nombre,
                    descripcion: (ur.rol_usuario as any)?.descripcion,
                    permisos: (ur.rol_usuario as any)?.permisos,
                    fecha_asignacion: ur.fecha_asignacion,
                    asignado_por: ur.asignado_por
                }))
                .filter(ur => ur.nombre) || []
        }

        return NextResponse.json({ administrador: adminWithRoles })

    } catch (error) {
        console.error('Error obteniendo administrador:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: { adminId: string } }) {
    const guard = await requireSuperAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden - Se requiere rol de Super Admin' ? 403 : 401 })

    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    try {
        const adminId = Number(params.adminId)
        if (isNaN(adminId)) {
            return NextResponse.json({ error: 'ID de administrador inválido' }, { status: 400 })
        }

        const body = await req.json()
        const { roles, activo, motivo } = body

        if (!Array.isArray(roles)) {
            return NextResponse.json({ error: 'Roles debe ser un array' }, { status: 400 })
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

        // Actualizar estado del administrador
        const { error: updateError } = await supabaseAdmin
            .from('usuario')
            .update({
                activo: activo,
                motivo_suspension: !activo ? motivo : null,
                fecha_suspension: !activo ? new Date().toISOString() : null,
                // suspendido_por: !activo ? superAdmin.user_id : null // Columna no existe
            })
            .eq('user_id', adminId)

        if (updateError) {
            console.error('Error actualizando administrador:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        // Desactivar todos los roles actuales
        await supabaseAdmin
            .from('usuario_rol')
            .update({ activo: false })
            .eq('usuario_id', adminId)

        // Asignar nuevos roles
        if (roles.length > 0) {
            const roleAssignments = roles.map((rolId: number) => ({
                usuario_id: adminId,
                rol_id: rolId,
                activo: true,
                asignado_por: superAdmin.user_id,
                fecha_asignacion: new Date().toISOString()
            }))

            const { error: rolesError } = await supabaseAdmin
                .from('usuario_rol')
                .insert(roleAssignments)

            if (rolesError) {
                console.error('Error asignando roles:', rolesError)
                return NextResponse.json({ error: rolesError.message }, { status: 400 })
            }
        }

        // Crear notificación
        await supabaseAdmin
            .from('notificacion')
            .insert({
                usuario_id: adminId,
                tipo: activo ? 'admin_activated' : 'admin_suspended',
                titulo: activo ? 'Cuenta Reactivada' : 'Cuenta Suspendida',
                mensaje: activo
                    ? 'Tu cuenta de administrador ha sido reactivada.'
                    : `Tu cuenta de administrador ha sido suspendida. Motivo: ${motivo || 'No especificado'}`,
                es_push: true,
                es_email: true
            })

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error('Error actualizando administrador:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { adminId: string } }) {
    const guard = await requireSuperAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden - Se requiere rol de Super Admin' ? 403 : 401 })

    if (!supabaseAdmin) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    try {
        const adminId = Number(params.adminId)
        if (isNaN(adminId)) {
            return NextResponse.json({ error: 'ID de administrador inválido' }, { status: 400 })
        }

        // Obtener información del administrador antes de desactivar
        const { data: admin } = await supabaseAdmin
            .from('usuario')
            .select('nombre, email, es_admin')
            .eq('user_id', adminId)
            .single()

        if (!admin) {
            return NextResponse.json({ error: 'Administrador no encontrado' }, { status: 404 })
        }

        // Solo desactivar si es administrador
        if (!admin.es_admin) {
            return NextResponse.json({ error: 'Este usuario no es administrador' }, { status: 400 })
        }

        // Desactivar administrador (soft delete - no eliminar físicamente)
        const { error: updateError } = await supabaseAdmin
            .from('usuario')
            .update({
                activo: false,
                es_admin: false,
                motivo_suspension: 'Desactivado por super administrador',
                fecha_suspension: new Date().toISOString(),
                // suspendido_por: guard.user?.id ?
                //     (await supabaseAdmin
                //         .from('usuario')
                //         .select('user_id')
                //         .eq('email', guard.user.email)
                //         .single()).data?.user_id : null // Columna no existe
            })
            .eq('user_id', adminId)

        if (updateError) {
            console.error('Error desactivando administrador:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        // Desactivar todos los roles
        await supabaseAdmin
            .from('usuario_rol')
            .update({ activo: false })
            .eq('usuario_id', adminId)

        // Crear notificación
        await supabaseAdmin
            .from('notificacion')
            .insert({
                usuario_id: adminId,
                tipo: 'admin_deactivated',
                titulo: 'Acceso de Administrador Desactivado',
                mensaje: 'Tu acceso como administrador ha sido desactivado. Contacta al super administrador si necesitas reactivación.',
                es_push: true,
                es_email: true
            })

        return NextResponse.json({
            ok: true,
            message: 'Administrador desactivado exitosamente. Puede ser reactivado más tarde.'
        })

    } catch (error) {
        console.error('Error desactivando administrador:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
