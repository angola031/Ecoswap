import { NextRequest, NextResponse } from 'next/server'

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data } = await supabaseAdmin.auth.getUser(token)
    return data?.user || null
}

export async function GET(req: NextRequest) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Resolver usuario actual
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, activo, verificado')
            .eq('email', user.email)
            .single()
        if (!u || !u.activo) return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 })

        const url = new URL(req.url)
        const estado = url.searchParams.get('estado') // 'pendiente', 'aceptado', 'rechazado', 'completado', 'cancelado'
        const tipo = url.searchParams.get('tipo') // 'proponidos', 'recibidos', 'todos'

        // Construir query base
        let query = supabaseAdmin
            .from('intercambio')
            .select(`
                intercambio_id,
                estado,
                mensaje_propuesta,
                monto_adicional,
                condiciones_adicionales,
                fecha_propuesta,
                fecha_respuesta,
                fecha_completado,
                motivo_rechazo,
                lugar_encuentro,
                fecha_encuentro,
                notas_encuentro,
                producto_ofrecido:PRODUCTO!INTERCAMBIO_producto_ofrecido_id(
                    producto_id,
                    titulo,
                    descripcion,
                    precio,
                    tipo_transaccion,
                    estado_publicacion,
                    usuario:USUARIO!PRODUCTO_user_id_fkey(
                        user_id,
                        nombre,
                        apellido,
                        foto_perfil
                    )
                ),
                producto_solicitado:PRODUCTO!INTERCAMBIO_producto_solicitado_id(
                    producto_id,
                    titulo,
                    descripcion,
                    precio,
                    tipo_transaccion,
                    estado_publicacion,
                    usuario:USUARIO!PRODUCTO_user_id_fkey(
                        user_id,
                        nombre,
                        apellido,
                        foto_perfil
                    )
                ),
                usuario_propone:USUARIO!INTERCAMBIO_usuario_propone_id_fkey(
                    user_id,
                    nombre,
                    apellido,
                    foto_perfil,
                    calificacion_promedio
                ),
                usuario_recibe:USUARIO!INTERCAMBIO_usuario_recibe_id_fkey(
                    user_id,
                    nombre,
                    apellido,
                    foto_perfil,
                    calificacion_promedio
                ),
                chat:CHAT(
                    chat_id,
                    ultimo_mensaje
                )
            `)

        // Filtrar por usuario
        if (tipo === 'proponidos') {
            query = query.eq('usuario_propone_id', u.user_id)
        } else if (tipo === 'recibidos') {
            query = query.eq('usuario_recibe_id', u.user_id)
        } else {
            // 'todos' - intercambios donde el usuario participa
            query = query.or(`usuario_propone_id.eq.${u.user_id},usuario_recibe_id.eq.${u.user_id}`)
        }

        // Filtrar por estado
        if (estado) {
            query = query.eq('estado', estado)
        }

        // Ordenar por fecha más reciente
        query = query.order('fecha_propuesta', { ascending: false })

        const { data: intercambios, error } = await query

        if (error) {
            console.error('Error fetching intercambios:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Procesar datos para incluir información adicional
        const processedIntercambios = intercambios?.map(intercambio => {
            const usuarioPropone = Array.isArray(intercambio.usuario_propone) ? intercambio.usuario_propone[0] : intercambio.usuario_propone
            const usuarioRecibe = Array.isArray(intercambio.usuario_recibe) ? intercambio.usuario_recibe[0] : intercambio.usuario_recibe
            
            const isProponente = usuarioPropone?.user_id === u.user_id
            const isReceptor = usuarioRecibe?.user_id === u.user_id

            return {
                ...intercambio,
                // Información del otro usuario
                otro_usuario: isProponente ? usuarioRecibe : usuarioPropone,
                // Información del producto del otro usuario
                producto_otro: isProponente ? intercambio.producto_solicitado : intercambio.producto_ofrecido,
                // Información del producto propio
                producto_propio: isProponente ? intercambio.producto_ofrecido : intercambio.producto_solicitado,
                // Roles del usuario actual
                es_proponente: isProponente,
                es_receptor: isReceptor,
                // Acciones disponibles
                puede_aceptar: isReceptor && intercambio.estado === 'pendiente',
                puede_rechazar: isReceptor && intercambio.estado === 'pendiente',
                puede_cancelar: (isProponente || isReceptor) && ['pendiente', 'aceptado'].includes(intercambio.estado),
                puede_completar: (isProponente || isReceptor) && intercambio.estado === 'aceptado'
            }
        }) || []

        return NextResponse.json({ intercambios: processedIntercambios })
    } catch (e: any) {
        console.error('Error in GET /api/intercambios:', e)
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Resolver usuario actual
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, activo, verificado')
            .eq('email', user.email)
            .single()
        
        if (!u || !u.activo) return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 })

        const body = await req.json()
        const { 
            producto_ofrecido_id, 
            producto_solicitado_id, 
            usuario_recibe_id, 
            mensaje_propuesta,
            monto_adicional,
            condiciones_adicionales 
        } = body

        // Validaciones
        if (!producto_ofrecido_id || !producto_solicitado_id || !usuario_recibe_id || !mensaje_propuesta) {
            return NextResponse.json({ 
                error: 'Faltan parámetros requeridos: producto_ofrecido_id, producto_solicitado_id, usuario_recibe_id, mensaje_propuesta' 
            }, { status: 400 })
        }

        // Verificar que el usuario no esté proponiendo intercambio consigo mismo
        if (u.user_id === usuario_recibe_id) {
            return NextResponse.json({ 
                error: 'No puedes proponer un intercambio contigo mismo' 
            }, { status: 400 })
        }

        // Verificar que los productos existen y pertenecen a los usuarios correctos
        const { data: productoOfrecido, error: errorOfrecido } = await supabaseAdmin
            .from('producto')
            .select('producto_id, user_id, estado_publicacion, titulo')
            .eq('producto_id', producto_ofrecido_id)
            .single()

        if (errorOfrecido || !productoOfrecido) {
            return NextResponse.json({ 
                error: 'Producto ofrecido no encontrado' 
            }, { status: 404 })
        }

        if (productoOfrecido.user_id !== u.user_id) {
            return NextResponse.json({ 
                error: 'No puedes ofrecer un producto que no te pertenece' 
            }, { status: 403 })
        }

        if (productoOfrecido.estado_publicacion !== 'activo') {
            return NextResponse.json({ 
                error: 'El producto ofrecido no está disponible para intercambio' 
            }, { status: 400 })
        }

        const { data: productoSolicitado, error: errorSolicitado } = await supabaseAdmin
            .from('producto')
            .select('producto_id, user_id, estado_publicacion, titulo')
            .eq('producto_id', producto_solicitado_id)
            .single()

        if (errorSolicitado || !productoSolicitado) {
            return NextResponse.json({ 
                error: 'Producto solicitado no encontrado' 
            }, { status: 404 })
        }

        if (productoSolicitado.user_id !== usuario_recibe_id) {
            return NextResponse.json({ 
                error: 'El producto solicitado no pertenece al usuario indicado' 
            }, { status: 403 })
        }

        if (productoSolicitado.estado_publicacion !== 'activo') {
            return NextResponse.json({ 
                error: 'El producto solicitado no está disponible para intercambio' 
            }, { status: 400 })
        }

        // Verificar que el usuario receptor existe y está activo
        const { data: usuarioRecibe, error: errorRecibe } = await supabaseAdmin
            .from('usuario')
            .select('user_id, activo, nombre, apellido')
            .eq('user_id', usuario_recibe_id)
            .single()

        if (errorRecibe || !usuarioRecibe || !usuarioRecibe.activo) {
            return NextResponse.json({ 
                error: 'Usuario receptor no encontrado o inactivo' 
            }, { status: 404 })
        }

        // Verificar si ya existe un intercambio pendiente entre estos usuarios con estos productos
        const { data: intercambioExistente, error: errorExistente } = await supabaseAdmin
            .from('intercambio')
            .select('intercambio_id, estado')
            .or(`and(producto_ofrecido_id.eq.${producto_ofrecido_id},producto_solicitado_id.eq.${producto_solicitado_id}),and(producto_ofrecido_id.eq.${producto_solicitado_id},producto_solicitado_id.eq.${producto_ofrecido_id})`)
            .in('estado', ['pendiente', 'aceptado', 'en_progreso', 'pendiente_validacion'])
            .limit(1)

        if (errorExistente) {
            console.error('Error verificando intercambio existente:', errorExistente)
            return NextResponse.json({ 
                error: 'Error verificando intercambios existentes' 
            }, { status: 500 })
        }

        if (intercambioExistente && intercambioExistente.length > 0) {
            return NextResponse.json({ 
                error: 'Ya existe un intercambio pendiente entre estos productos' 
            }, { status: 409 })
        }

        // Crear el intercambio
        const { data: nuevoIntercambio, error: createError } = await supabaseAdmin
            .from('intercambio')
            .insert({
                producto_ofrecido_id,
                producto_solicitado_id,
                usuario_propone_id: u.user_id,
                usuario_recibe_id,
                mensaje_propuesta,
                monto_adicional: monto_adicional || 0,
                condiciones_adicionales: condiciones_adicionales || null,
                estado: 'pendiente'
            })
            .select(`
                intercambio_id,
                estado,
                fecha_propuesta,
                mensaje_propuesta,
                monto_adicional,
                condiciones_adicionales,
                producto_ofrecido_id,
                producto_solicitado_id,
                usuario_propone_id,
                usuario_recibe_id
            `)
            .single()

        if (createError) {
            console.error('Error creando intercambio:', createError)
            return NextResponse.json({ 
                error: 'Error creando intercambio' 
            }, { status: 500 })
        }

        // Crear chat asociado al intercambio
        const { data: nuevoChat, error: chatError } = await supabaseAdmin
            .from('chat')
            .insert({
                intercambio_id: nuevoIntercambio.intercambio_id
            })
            .select('chat_id')
            .single()

        if (chatError) {
            console.error('Error creando chat:', chatError)
            // No fallar la creación del intercambio si falla el chat
        }

        // Crear notificación para el usuario receptor
        try {
            await supabaseAdmin
                .from('notificacion')
                .insert({
                    usuario_id: usuario_recibe_id,
                    tipo: 'nueva_propuesta_intercambio',
                    titulo: 'Nueva Propuesta de Intercambio',
                    mensaje: `Un usuario te ha propuesto un intercambio: ${productoOfrecido.titulo} por ${productoSolicitado.titulo}`,
                    datos_adicionales: {
                        intercambio_id: nuevoIntercambio.intercambio_id,
                        usuario_propone_id: u.user_id,
                        producto_ofrecido_id,
                        producto_solicitado_id
                    },
                    es_push: true,
                    es_email: false
                })
        } catch (notificationError) {
            console.error('Error creando notificación:', notificationError)
            // No fallar la creación del intercambio si falla la notificación
        }

        // Marcar productos como temporalmente no disponibles (opcional)
        try {
            await supabaseAdmin
                .from('producto')
                .update({ estado_publicacion: 'pausado' })
                .in('producto_id', [producto_ofrecido_id, producto_solicitado_id])
        } catch (productError) {
            console.error('Error actualizando estado de productos:', productError)
            // No fallar la creación del intercambio si falla la actualización de productos
        }

        console.log('✅ Intercambio creado exitosamente:', {
            intercambio_id: nuevoIntercambio.intercambio_id,
            usuario_propone: u.user_id,
            usuario_recibe: usuario_recibe_id,
            producto_ofrecido: producto_ofrecido_id,
            producto_solicitado: producto_solicitado_id,
            chat_id: nuevoChat?.chat_id
        })

        return NextResponse.json({
            success: true,
            data: {
                ...nuevoIntercambio,
                chat_id: nuevoChat?.chat_id,
                producto_ofrecido: productoOfrecido,
                producto_solicitado: productoSolicitado,
                usuario_recibe: usuarioRecibe
            }
        }, { status: 201 })

    } catch (e: any) {
        console.error('Error in POST /api/intercambios:', e)
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}