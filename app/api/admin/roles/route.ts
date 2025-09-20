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

        // Validar email antes de crear el administrador
        console.log('🔍 Validando email:', email.toLowerCase())
        
        // PASO 1: Verificar en tabla usuario
        const { data: existingUser, error: userCheckError } = await supabaseAdmin
            .from('usuario')
            .select('user_id, email, es_admin, activo, nombre, apellido')
            .eq('email', email.toLowerCase())
            .single()

        if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('❌ Error verificando usuario existente:', userCheckError)
            return NextResponse.json({ error: 'Error verificando usuario existente' }, { status: 500 })
        }

        if (existingUser) {
            console.log('⚠️ Usuario encontrado en base de datos:', {
                email: existingUser.email,
                es_admin: existingUser.es_admin,
                activo: existingUser.activo,
                nombre: existingUser.nombre
            })
            
            if (existingUser.es_admin) {
                if (existingUser.activo) {
                    return NextResponse.json({ 
                        error: `Este email ya está registrado como administrador activo: ${existingUser.nombre} ${existingUser.apellido}` 
                    }, { status: 400 })
                } else {
                    return NextResponse.json({ 
                        error: `Este email ya está registrado como administrador inactivo: ${existingUser.nombre} ${existingUser.apellido}. Puedes reactivarlo desde la gestión de administradores.` 
                    }, { status: 400 })
                }
            } else {
                return NextResponse.json({ 
                    error: `Este email ya está registrado como usuario regular: ${existingUser.nombre} ${existingUser.apellido}. Los usuarios regulares no pueden ser promovidos a administradores desde aquí.` 
                }, { status: 400 })
            }
        }

        // PASO 2: Verificar en Supabase Auth (por si existe pero no está en nuestra tabla usuario)
        console.log('🔍 Verificando en Supabase Auth...')
        try {
            const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
                page: 1,
                perPage: 1000 // Obtener muchos usuarios para buscar
            })

            if (authListError) {
                console.error('❌ Error listando usuarios de auth:', authListError)
                // No fallar la creación por esto, solo loggear
            } else {
                const existingAuthUser = authUsers?.users?.find(user => 
                    user.email?.toLowerCase() === email.toLowerCase()
                )

                if (existingAuthUser) {
                    console.log('⚠️ Usuario encontrado en Supabase Auth:', {
                        email: existingAuthUser.email,
                        created_at: existingAuthUser.created_at,
                        email_confirmed_at: existingAuthUser.email_confirmed_at
                    })
                    
                    return NextResponse.json({ 
                        error: `Este email ya existe en el sistema de autenticación. Por favor, contacta al super administrador para resolver esta situación.` 
                    }, { status: 400 })
                }
            }
        } catch (authError) {
            console.error('❌ Error verificando en Supabase Auth:', authError)
            // No fallar la creación por esto, solo loggear
        }

        console.log('✅ Email validado correctamente, no existe en el sistema')

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
        let emailEnviado = false
        if (enviarInvitacion) {
            try {
                console.log('📧 Enviando correo de configuración de contraseña a:', email.toLowerCase())
                
                // Obtener nombres de roles para el email
                const { data: roleNames } = await supabaseAdmin
                    .from('rol_usuario')
                    .select('rol_id, nombre')
                    .in('rol_id', roles)

                const roleNamesList = roleNames?.map(r => r.nombre) || ['administrador']
                console.log('🎯 Roles asignados:', roleNamesList)

                // Construir URL de redirección
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
                const redirectUrl = `${siteUrl}/auth/supabase-redirect?type=recovery&next=/admin/verificaciones`
                console.log('🔗 URL de redirección:', redirectUrl)

                // Enviar email de reset de contraseña para que pueda configurar su contraseña
                const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
                    email.toLowerCase(),
                    {
                        redirectTo: redirectUrl
                    }
                )

                if (resetError) {
                    console.error('❌ Error enviando email de configuración de contraseña:', resetError)
                    emailEnviado = false
                } else {
                    console.log('✅ Email de configuración de contraseña enviado exitosamente a', email.toLowerCase())
                    emailEnviado = true
                }
            } catch (error) {
                console.error('❌ Error enviando email de configuración de contraseña:', error)
                emailEnviado = false
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
            },
            email_enviado: emailEnviado,
            message: emailEnviado 
                ? `Administrador creado exitosamente. Se ha enviado un correo a ${email} para configurar su contraseña.`
                : `Administrador creado exitosamente. ${enviarInvitacion ? 'Error enviando correo de configuración de contraseña.' : 'No se envió correo de invitación.'}`
        })

    } catch (error) {
        console.error('Error creando administrador:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}



