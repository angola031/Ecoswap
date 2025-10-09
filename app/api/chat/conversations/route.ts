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

        // Resolve usuario_id
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, nombre, apellido, email')
            .eq('email', user.email)
            .single()
        if (!u) return NextResponse.json({ items: [] })

        // Obtener intercambios del usuario actual
        const { data: intercambios } = await supabaseAdmin
            .from('intercambio')
            .select(`
                intercambio_id,
                usuario_propone_id,
                usuario_recibe_id,
                fecha_propuesta,
                producto_ofrecido_id,
                producto_solicitado_id
            `)
            .or(`usuario_propone_id.eq.${u.user_id},usuario_recibe_id.eq.${u.user_id}`)
            .order('fecha_propuesta', { ascending: false })

        const items: any[] = []
        for (const it of (intercambios || [])) {
            const me = u.user_id
            const otherId = it.usuario_propone_id === me ? it.usuario_recibe_id : it.usuario_propone_id

            // Obtener el chat asociado al intercambio
            const { data: chat } = await supabaseAdmin
                .from('chat')
                .select('chat_id, ultimo_mensaje, activo')
                .eq('intercambio_id', it.intercambio_id)
                .single()

            if (!chat) continue

            // Info del otro usuario
            const { data: other } = await supabaseAdmin
                .from('usuario')
                .select('user_id, nombre, apellido, foto_perfil')
                .eq('user_id', otherId)
                .single()

            // Obtener información del producto ofrecido
            let productInfo = null
            if (it.producto_ofrecido_id) {
                const { data: producto } = await supabaseAdmin
                    .from('producto')
                    .select(`
                        producto_id,
                        titulo,
                        descripcion,
                        precio,
                        tipo_transaccion,
                        condiciones_intercambio,
                        que_busco_cambio,
                        precio_negociable,
                        categoria (nombre)
                    `)
                    .eq('producto_id', it.producto_ofrecido_id)
                    .single()

                if (producto) {
                    // Obtener imagen principal del producto
                    let mainImage = null
                    const { data: imagen } = await supabaseAdmin
                        .from('imagen_producto')
                        .select('url_imagen')
                        .eq('producto_id', producto.producto_id)
                        .eq('es_principal', true)
                        .single()
                    mainImage = imagen?.url_imagen

                    productInfo = {
                        id: producto.producto_id,
                        title: producto.titulo,
                        description: producto.descripcion,
                        price: producto.precio ? 
                            new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0
                            }).format(producto.precio) + (producto.precio_negociable ? ' (Negociable)' : '') :
                            (producto.tipo_transaccion === 'cambio' ? 
                                (producto.condiciones_intercambio || producto.que_busco_cambio || 'Intercambio') : 
                                'Precio no especificado'),
                        category: producto.categoria?.nombre || 'Sin categoría',
                        mainImage: mainImage,
                        exchangeConditions: producto.condiciones_intercambio || producto.que_busco_cambio
                    }
                } else {
                }
            } else {
            }

            // Último mensaje como texto
            const { data: lastMsg } = await supabaseAdmin
                .from('mensaje')
                .select('contenido, tipo, fecha_envio')
                .eq('chat_id', chat.chat_id)
                .order('mensaje_id', { ascending: false })
                .limit(1)
                .single()

            // Unread count
            const { count: unread } = await supabaseAdmin
                .from('mensaje')
                .select('mensaje_id', { count: 'exact', head: true })
                .eq('chat_id', chat.chat_id)
                .neq('usuario_id', me)
                .eq('leido', false)

            items.push({
                id: chat.chat_id,
                user: {
                    id: other?.user_id,
                    name: other ? `${other.nombre} ${other.apellido}`.trim() : 'Usuario',
                    avatar: other?.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                    location: 'Colombia',
                    isOnline: false,
                    lastSeen: ''
                },
                lastMessage: lastMsg ? (lastMsg.tipo === 'texto' ? (lastMsg.contenido || '') : lastMsg.tipo) : '',
                lastMessageTime: lastMsg ? lastMsg.fecha_envio : it.fecha_propuesta,
                unreadCount: unread || 0,
                product: productInfo,
                offered: productInfo, // Para compatibilidad
                requested: null // Por ahora solo mostramos el producto ofrecido
            })
        }

        return NextResponse.json({ items })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}



