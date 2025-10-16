import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabase-client'

// Middleware para verificar admin
async function requireAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }
    
    const supabase = getSupabaseClient()
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

export async function GET(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    const { userId } = params
    if (!userId) {
        return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // Determinar si es UUID o integer
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    const isInteger = !isNaN(Number(userId)) && Number.isInteger(Number(userId))
    
    if (!isUUID && !isInteger) {
        return NextResponse.json({ error: 'ID de usuario inválido. Debe ser UUID o número entero.' }, { status: 400 })
    }

    // Usar admin client si está disponible (Vercel), sino usar cliente autenticado (localhost)
    const adminClient = getSupabaseAdminClient()
    const supabase = adminClient || getSupabaseClient()
    const isUsingAdmin = !!adminClient

    try {
        // Consultar estado de validación del usuario específico
        // Si es UUID, buscar por auth_user_id en la tabla usuario primero
        let usuarioId: number | null = null
        if (isUUID) {
            const { data: userData } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('auth_user_id', userId)
                .single()
            usuarioId = userData?.user_id || null
        } else {
            usuarioId = Number(userId)
        }

        if (!usuarioId) {
            return NextResponse.json({
                error: 'Usuario no encontrado'
            }, { status: 404 })
        }

        const { data: validation, error: validationError } = await supabase
            .from('validacion_usuario')
            .select('validacion_id, usuario_id, estado, motivo_rechazo, fecha_solicitud, fecha_revision, fecha_aprobacion, tipo_validacion, documentos_adjuntos')
            .eq('usuario_id', usuarioId)
            .eq('tipo_validacion', 'identidad')
            .single()

        if (validationError && validationError.code !== 'PGRST116') {
            console.error('Error consultando validación:', validationError)
            return NextResponse.json({ 
                error: 'Error consultando validación de usuario',
                details: validationError.message 
            }, { status: 500 })
        }

        // Si no hay validación, devolver estado por defecto
        if (!validation) {
            return NextResponse.json({
                usuario_id: usuarioId,
                estado: 'no_solicitado',
                motivo_rechazo: null,
                fecha_solicitud: null,
                fecha_revision: null,
                fecha_aprobacion: null,
                tipo_validacion: 'identidad',
                documentos_adjuntos: null
            })
        }

        // Consultar información del usuario
        const { data: user, error: userError } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido, verificado, activo')
            .eq('user_id', usuarioId)
            .single()

        if (userError) {
            console.error('Error consultando usuario:', userError)
            return NextResponse.json({ 
                error: 'Error consultando información del usuario',
                details: userError.message 
            }, { status: 500 })
        }

        // Generar URLs de documentos si existen
        const prefix = `validacion/${usuarioId}/`
        const documentUrls = {
            cedula_frente: supabase.storage.from('Ecoswap').getPublicUrl(prefix + 'cedula_frente.jpg').data.publicUrl,
            cedula_reverso: supabase.storage.from('Ecoswap').getPublicUrl(prefix + 'cedula_reverso.jpg').data.publicUrl,
            selfie_validacion: supabase.storage.from('Ecoswap').getPublicUrl(prefix + 'selfie_validacion.jpg').data.publicUrl,
        }

        return NextResponse.json({
            ...validation,
            usuario: user,
            documentos_urls: documentUrls,
            cliente_usado: isUsingAdmin ? 'admin' : 'autenticado'
        })

    } catch (error) {
        console.error('Error en GET /api/admin/verificaciones/[userId]:', error)
        return NextResponse.json({ 
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { userId: string } }
) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    const { userId } = params
    if (!userId) {
        return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })
    }

    // Determinar si es UUID o integer
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
    const isInteger = !isNaN(Number(userId)) && Number.isInteger(Number(userId))
    
    if (!isUUID && !isInteger) {
        return NextResponse.json({ error: 'ID de usuario inválido. Debe ser UUID o número entero.' }, { status: 400 })
    }

    // Si es UUID, buscar por auth_user_id en la tabla usuario primero
    let usuarioId: number | null = null
    if (isUUID) {
        const adminClient = getSupabaseAdminClient()
        const supabase = adminClient || getSupabaseClient()
        const { data: userData } = await supabase
            .from('usuario')
            .select('user_id')
            .eq('auth_user_id', userId)
            .single()
        usuarioId = userData?.user_id || null
    } else {
        usuarioId = Number(userId)
    }

    if (!usuarioId) {
        return NextResponse.json({
            error: 'Usuario no encontrado'
        }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const { action, motivo } = body || {}
    
    if (!['aprobar', 'rechazar', 'en_revision'].includes(action)) {
        return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    // Usar admin client si está disponible
    const adminClient = getSupabaseAdminClient()
    const supabase = adminClient || getSupabaseClient()
    const isUsingAdmin = !!adminClient

    try {
        if (action === 'aprobar') {
            // Actualizar usuario como verificado
            const { error: userError } = await supabase
                .from('usuario')
                .update({ verificado: true })
                .eq('user_id', usuarioId)

            if (userError) {
                return NextResponse.json({ error: 'Error actualizando usuario', details: userError.message }, { status: 500 })
            }

            // Actualizar validación como aprobada
            const { error: validationError } = await supabase
                .from('validacion_usuario')
                .update({ 
                    estado: 'aprobada', 
                    fecha_aprobacion: new Date().toISOString(),
                    motivo_rechazo: null
                })
                .eq('usuario_id', usuarioId)
                .eq('tipo_validacion', 'identidad')

            if (validationError) {
                return NextResponse.json({ error: 'Error actualizando validación', details: validationError.message }, { status: 500 })
            }

        } else if (action === 'rechazar') {
            // Actualizar usuario como no verificado
            const { error: userError } = await supabase
                .from('usuario')
                .update({ verificado: false })
                .eq('user_id', usuarioId)

            if (userError) {
                return NextResponse.json({ error: 'Error actualizando usuario', details: userError.message }, { status: 500 })
            }

            // Actualizar validación como rechazada
            const { error: validationError } = await supabase
                .from('validacion_usuario')
                .update({ 
                    estado: 'rechazada', 
                    fecha_revision: new Date().toISOString(), 
                    motivo_rechazo: motivo || null 
                })
                .eq('usuario_id', usuarioId)
                .eq('tipo_validacion', 'identidad')

            if (validationError) {
                return NextResponse.json({ error: 'Error actualizando validación', details: validationError.message }, { status: 500 })
            }

        } else if (action === 'en_revision') {
            // Actualizar validación como en revisión
            const { error: validationError } = await supabase
                .from('validacion_usuario')
                .update({ 
                    estado: 'en_revision', 
                    fecha_revision: new Date().toISOString(),
                    motivo_rechazo: null
                })
                .eq('usuario_id', usuarioId)
                .eq('tipo_validacion', 'identidad')

            if (validationError) {
                return NextResponse.json({ error: 'Error actualizando validación', details: validationError.message }, { status: 500 })
            }
        }

        // Crear notificación para el usuario
        const { data: user } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido')
            .eq('user_id', usuarioId)
            .single()

        if (user) {
            let titulo = ''
            let mensaje = ''
            let urlAccion = ''

            switch (action) {
                case 'aprobar':
                    titulo = 'Verificación aprobada'
                    mensaje = 'Tu verificación de identidad fue aprobada. ¡Gracias por completar el proceso!'
                    urlAccion = '/?m=profile'
                    break
                case 'rechazar':
                    titulo = 'Verificación rechazada'
                    mensaje = motivo ? `Verificación rechazada: ${motivo}` : 'Tu verificación fue rechazada. Revisa los documentos y vuelve a intentarlo.'
                    urlAccion = '/verificacion-identidad'
                    break
                case 'en_revision':
                    titulo = 'Verificación en revisión'
                    mensaje = 'Tu verificación de identidad está siendo revisada por nuestro equipo.'
                    urlAccion = '/?m=profile'
                    break
            }

            await supabase.from('notificacion').insert({
                usuario_id: user.user_id,
                tipo: 'verificacion',
                titulo,
                mensaje,
                datos_adicionales: {
                    url_accion: urlAccion,
                    accion: action,
                    motivo_rechazo: action === 'rechazar' ? motivo : null,
                    fecha_revision: new Date().toISOString()
                },
                es_push: true,
                es_email: false
            })
        }

        return NextResponse.json({ 
            ok: true, 
            action,
            cliente_usado: isUsingAdmin ? 'admin' : 'autenticado'
        })

    } catch (error) {
        console.error('Error en PUT /api/admin/verificaciones/[userId]:', error)
        return NextResponse.json({ 
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}


