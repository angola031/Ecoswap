import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const productId = params.id

        if (!productId) {
            return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
        }

        // Obtener el producto con información del usuario y categoría
        const { data: product, error } = await supabaseAdmin
            .from('productos_publicos')
            .select('*')
            .eq('producto_id', productId)
            .single()

        if (error) {
            console.error('Error obteniendo producto:', error)
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
        }

        if (!product) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
        }

        // Obtener imágenes del producto desde la tabla IMAGEN_PRODUCTO
        const { data: images, error: imagesError } = await supabaseAdmin
            .from('imagen_producto')
            .select('url_imagen, descripcion_alt, es_principal, orden')
            .eq('producto_id', productId)
            .order('orden', { ascending: true })

        let imageUrls: string[] = []
        if (!imagesError && images && images.length > 0) {
            imageUrls = images.map(img => img.url_imagen)
        }

        // Obtener especificaciones técnicas normalizadas
        const specifications: Record<string, string> = {}
        try {
            const { data: specRows } = await supabaseAdmin
                .from('producto_especificacion')
                .select('clave, valor')
                .eq('producto_id', productId)
            if (Array.isArray(specRows)) {
                for (const r of specRows) {
                    const k = String((r as any)?.clave || '').trim()
                    const v = String((r as any)?.valor || '').trim()
                    if (k && v) specifications[k] = v
                }
            }
        } catch {}

        // Obtener estadísticas del usuario
        const { data: userStats } = await supabaseAdmin
            .from('producto')
            .select('producto_id')
            .eq('user_id', product.user_id)
            .eq('estado_validacion', 'approved')

        // Incrementar contador de vistas si el viewer NO es el dueño
        try {
            const auth = req.headers.get('authorization') || ''
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
            let isOwner = false
            if (token) {
                const { data } = await supabaseAdmin.auth.getUser(token)
                const email = data?.user?.email
                if (email) {
                    isOwner = email === product.usuario_email
                }
            }
            if (!isOwner) {
                await supabaseAdmin
                    .from('producto')
                    .update({ visualizaciones: (product.visualizaciones || 0) + 1 })
                    .eq('producto_id', Number(productId))
            }
        } catch {}

        // Formatear la respuesta
        const formattedProduct = {
            id: product.producto_id.toString(),
            titulo: product.titulo,
            descripcion: product.descripcion,
            precio: product.precio,
            estado: product.estado,
            tipo_transaccion: product.tipo_transaccion,
            precio_negociable: product.precio_negociable,
            condiciones_intercambio: product.condiciones_intercambio,
            que_busco_cambio: product.que_busco_cambio,
            fecha_creacion: product.fecha_creacion,
            categoria_nombre: product.categoria_nombre,
            especificaciones: specifications,
            visualizaciones: product.visualizaciones ?? 0,
            total_likes: product.total_likes ?? 0,
            usuario: {
                user_id: product.user_id,
                nombre: product.usuario_nombre,
                apellido: product.usuario_apellido,
                email: product.usuario_email,
                foto_perfil: product.usuario_foto,
                calificacion_promedio: product.usuario_calificacion,
                total_intercambios: product.usuario_total_intercambios
            },
            ubicacion: {
                ciudad: product.ciudad,
                departamento: product.departamento
            },
            imagenes: imageUrls,
            total_productos_usuario: userStats?.length || 0
        }

        return NextResponse.json({ product: formattedProduct })

    } catch (error: any) {
        console.error('Error en API de producto:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}
