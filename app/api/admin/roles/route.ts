import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Middleware para verificar super admin
async function requireSuperAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }

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
            // Verificar si tiene rol de super admin
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

export async function GET(req: NextRequest) {
    const guard = await requireSuperAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden - Se requiere rol de Super Admin' ? 403 : 401 })

    try {
        // Obtener todos los roles disponibles
        const { data: roles, error: rolesError } = await supabaseAdmin
            .from('rol_usuario')
            .select('*')
            .eq('activo', true)
            .order('nombre')

        if (rolesError) {
            console.error('Error obteniendo roles:', rolesError)
            return NextResponse.json({ error: rolesError.message }, { status: 400 })
        }

        // Obtener todos los administradores con sus roles usando la mejor consulta
        const { data: admins, error: adminsError } = await supabaseAdmin
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                telefono,
                es_admin,
                admin_desde,
                verificado,
                activo,
                ultima_conexion,
                usuario_rol!usuario_rol_usuario_id_fkey (
                    rol_id,
                    activo,
                    fecha_asignacion,
                    rol_usuario (
                        nombre,
                        descripcion,
                        permisos
                    ),
                    asignado_por:usuario!usuario_rol_asignado_por_fkey (
                        nombre,
                        email
                    )
                )
            `)
            .eq('es_admin', true)
            .eq('usuario_rol.activo', true)
            .order('admin_desde', { ascending: false })

        if (adminsError) {
            console.error('Error obteniendo administradores:', adminsError)
            return NextResponse.json({ error: adminsError.message }, { status: 400 })
        }

        // Formatear administradores con sus roles usando la nueva estructura
        const adminsWithRoles = (admins || []).map(admin => ({
            ...admin,
            roles: admin.usuario_rol
                ?.filter(ur => ur.activo)
                .map(ur => ({
                    rol_id: ur.rol_id,
                    nombre: ur.rol_usuario?.nombre,
                    descripcion: ur.rol_usuario?.descripcion,
                    permisos: ur.rol_usuario?.permisos,
                    fecha_asignacion: ur.fecha_asignacion,
                    asignado_por: ur.asignado_por?.nombre || 'Sistema'
                }))
                .filter(ur => ur.nombre) || []
        }))

        return NextResponse.json({
            roles: roles || [],
            administradores: adminsWithRoles
        })

    } catch (error) {
        console.error('Error obteniendo roles y administradores:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const guard = await requireSuperAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden - Se requiere rol de Super Admin' ? 403 : 401 })

    try {
        const body = await req.json()
        const { email, nombre, apellido, roles, telefono, enviarInvitacion } = body

        if (!email || !nombre || !apellido || !roles || !Array.isArray(roles)) {
            return NextResponse.json({ error: 'Email, nombre, apellido y roles son requeridos' }, { status: 400 })
        }

        // Verificar que el email no esté ya registrado
        const { data: existingUser } = await supabaseAdmin
            .from('usuario')
            .select('user_id, email, es_admin')
            .eq('email', email.toLowerCase())
            .single()

        if (existingUser) {
            if (existingUser.es_admin) {
                return NextResponse.json({ error: 'Este email ya está registrado como administrador' }, { status: 400 })
            } else {
                return NextResponse.json({ error: 'Este email ya está registrado como usuario regular' }, { status: 400 })
            }
        }

        // Obtener el super admin actual
        const { data: superAdmin } = await supabaseAdmin
            .from('usuario')
            .select('user_id')
            .eq('email', guard.user.email)
            .single()

        if (!superAdmin) {
            return NextResponse.json({ error: 'Super admin no encontrado' }, { status: 404 })
        }

        // Crear usuario en Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.toLowerCase(),
            email_confirm: true, // Cambiar a true para que pueda hacer login inmediatamente
            user_metadata: {
                name: `${nombre} ${apellido}`,
                phone: telefono || null
            }
        })

        if (authError) {
            console.error('Error creando usuario en auth:', authError)
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        // Crear perfil en tabla USUARIO como admin
        const { data: newAdmin, error: userError } = await supabaseAdmin
            .from('usuario')
            .insert({
                nombre,
                apellido,
                email: email.toLowerCase(),
                telefono: telefono || null,
                password_hash: 'supabase_auth',
                verificado: true,
                activo: true,
                es_admin: true,
                admin_desde: new Date().toISOString(),
                ultima_conexion: new Date().toISOString()
            })
            .select()
            .single()

        if (userError) {
            console.error('Error creando perfil de admin:', userError)
            // Limpiar usuario de auth si falla la creación del perfil
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            return NextResponse.json({ error: userError.message }, { status: 400 })
        }

        // Asignar roles al nuevo administrador
        const roleAssignments = roles.map((rolId: number) => ({
            usuario_id: newAdmin.user_id,
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

        // Crear ubicación por defecto
        await supabaseAdmin
            .from('ubicacion')
            .insert({
                user_id: newAdmin.user_id,
                pais: 'Colombia',
                departamento: 'Risaralda',
                ciudad: 'Pereira',
                es_principal: true
            })

        // Crear configuración por defecto
        await supabaseAdmin
            .from('configuracion_usuario')
            .insert({
                usuario_id: newAdmin.user_id,
                notif_nuevas_propuestas: true,
                notif_mensajes: true,
                notif_actualizaciones: false,
                notif_newsletter: true,
                perfil_publico: true,
                mostrar_ubicacion_exacta: false,
                mostrar_telefono: false,
                recibir_mensajes_desconocidos: true,
                distancia_maxima_km: 50
            })

        // Enviar email de invitación si está habilitado
        if (enviarInvitacion) {
            try {
                // Obtener nombres de roles para el email
                const { data: roleNames } = await supabaseAdmin
                    .from('rol_usuario')
                    .select('rol_id, nombre')
                    .in('rol_id', roles)

                const roleNamesList = roleNames?.map(r => r.nombre) || ['administrador']

                // Enviar email de reset de contraseña para que pueda configurar su contraseña
                const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
                    email.toLowerCase(),
                    {
                        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/supabase-redirect?type=recovery&next=/admin/verificaciones`
                    }
                )

                if (resetError) {
                    console.error('Error enviando email de configuración de contraseña:', resetError)
                    // No fallar la creación si el email falla
                }
            } catch (error) {
                console.error('Error enviando email de configuración de contraseña:', error)
            }
        }

        // Enviar notificación al nuevo admin
        await supabaseAdmin
            .from('notificacion')
            .insert({
                usuario_id: newAdmin.user_id,
                tipo: 'admin_invitation',
                titulo: 'Bienvenido como Administrador',
                mensaje: `Has sido registrado como administrador de EcoSwap. ${enviarInvitacion ? 'Revisa tu email para configurar tu contraseña.' : 'Contacta al super administrador para obtener acceso.'}`,
                es_push: true,
                es_email: enviarInvitacion || false
            })

        return NextResponse.json({
            ok: true,
            admin: {
                ...newAdmin,
                roles: roles
            }
        })

    } catch (error) {
        console.error('Error creando administrador:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}



