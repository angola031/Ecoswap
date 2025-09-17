import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
            const isProponente = intercambio.usuario_propone_id === u.user_id
            const isReceptor = intercambio.usuario_recibe_id === u.user_id

            return {
                ...intercambio,
                // Información del otro usuario
                otro_usuario: isProponente ? intercambio.usuario_recibe : intercambio.usuario_propone,
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