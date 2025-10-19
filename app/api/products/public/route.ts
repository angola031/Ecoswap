import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Products Public: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }

        // Obtener parámetros de consulta
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')
        const categoria = searchParams.get('categoria')
        const tipoTransaccion = searchParams.get('tipo_transaccion')
        const ubicacion = searchParams.get('ubicacion')

        // Construir consulta base usando la tabla PRODUCTO directamente
        let query = supabase
            .from('producto')
            .select(`
                producto_id,
                titulo,
                descripcion,
                precio,
                estado,
                tipo_transaccion,
                precio_negociable,
                condiciones_intercambio,
                que_busco_cambio,
                fecha_creacion,
                fecha_publicacion,
                visualizaciones,
                total_likes,
                user_id,
                ciudad_snapshot,
                departamento_snapshot,
                categoria_id,
                categoria:categoria(categoria_id, nombre),
                usuario:usuario!producto_user_id_fkey(
                    user_id,
                    nombre,
                    apellido,
                    email,
                    foto_perfil,
                    calificacion_promedio,
                    total_intercambios
                )
            `)
            .eq('estado_validacion', 'approved')
            .eq('estado_publicacion', 'activo')
            .order('fecha_publicacion', { ascending: false })
            .range(offset, offset + limit - 1)

        // Aplicar filtros si existen
        if (categoria) {
            query = query.ilike('categoria.nombre', `%${categoria}%`)
        }

        if (tipoTransaccion) {
            query = query.eq('tipo_transaccion', tipoTransaccion)
        }

        if (ubicacion) {
            query = query.or(`ciudad_snapshot.ilike.%${ubicacion}%,departamento_snapshot.ilike.%${ubicacion}%`)
        }

        const { data: productos, error } = await query

        if (error) {
            console.error('❌ API Products Public: Error obteniendo productos:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Obtener imágenes para cada producto
        const productosConImagenes = await Promise.all(
            (productos || []).map(async (producto) => {
                try {
                    const { data: imagenes } = await supabase
                        .from('imagen_producto')
                        .select('url_imagen, es_principal')
                        .eq('producto_id', producto.producto_id)
                        .order('es_principal', { ascending: false })

                    return {
                        ...producto,
                        imagenes: imagenes || [],
                        imagen_principal: imagenes?.find(img => img.es_principal)?.url_imagen || imagenes?.[0]?.url_imagen || null
                    }
                } catch (error) {
                    console.warn(`⚠️ Error obteniendo imágenes para producto ${producto.producto_id}:`, error)
                    return {
                        ...producto,
                        imagenes: [],
                        imagen_principal: null
                    }
                }
            })
        )

        // Obtener total de productos para paginación
        let countQuery = supabase
            .from('producto')
            .select('*', { count: 'exact', head: true })
            .eq('estado_validacion', 'approved')
            .eq('estado_publicacion', 'activo')

        if (categoria) {
            countQuery = countQuery.ilike('categoria.nombre', `%${categoria}%`)
        }

        if (tipoTransaccion) {
            countQuery = countQuery.eq('tipo_transaccion', tipoTransaccion)
        }

        if (ubicacion) {
            countQuery = countQuery.or(`ciudad_snapshot.ilike.%${ubicacion}%,departamento_snapshot.ilike.%${ubicacion}%`)
        }

        const { count } = await countQuery

        return NextResponse.json({
            productos: productosConImagenes,
            paginacion: {
                total: count || 0,
                limit,
                offset,
                hasMore: (count || 0) > offset + limit
            }
        })

    } catch (error: any) {
        console.error('❌ API Products Public: Error:', error)
        return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
    }
}