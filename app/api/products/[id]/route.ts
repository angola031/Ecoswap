import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Products [id]: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }

        const productId = params.id

        if (!productId) {
            return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
        }

        // Obtener el producto con información del usuario y categoría
        const { data: product, error } = await supabase
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
            .eq('producto_id', productId)
            .eq('estado_validacion', 'approved')
            .eq('estado_publicacion', 'activo')
            .single()

        if (error) {
            console.error('Error obteniendo producto:', error)
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
        }

        if (!product) {
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
        }

        // Obtener imágenes del producto desde la tabla IMAGEN_PRODUCTO
        const { data: images, error: imagesError } = await supabase
            .from('imagen_producto')
            .select('url_imagen, descripcion_alt, es_principal, orden')
            .eq('producto_id', productId)
            .order('orden', { ascending: true })

        console.log('🔍 Consulta de imágenes - Producto ID:', productId)
        console.log('🔍 Error de imágenes:', imagesError)
        console.log('🔍 Datos de imágenes:', images)

        let imageUrls: string[] = []
        if (!imagesError && images && images.length > 0) {
            imageUrls = images
                .map(img => {
                    const url = img.url_imagen
                    console.log('🔍 Procesando imagen:', url, 'Tipo:', typeof url)
                    return String(url || '')
                })
                .filter(url => url && url.trim() !== '' && url !== 'undefined' && url !== 'null')
            console.log('🔍 Imágenes procesadas:', imageUrls)
        }

        // Obtener especificaciones técnicas normalizadas
        const specifications: Record<string, string> = {}
        try {
            const { data: specRows } = await supabase
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

    // Obtener estadísticas del usuario (conteo de productos publicados)
    const { data: userStats } = await supabase
            .from('producto')
            .select('producto_id')
            .eq('user_id', product.user_id)
            .eq('estado_validacion', 'approved')

    // Resolver usuario autenticado (si viene token) para calcular isOwner y liked
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    let isOwner = false
    let currentUsuarioId: number | null = null
    if (token) {
      try {
        const { data } = await supabase.auth.getUser(token)
        const email = data?.user?.email
        if (email) {
          isOwner = email === product.usuario?.email
        }
        // Obtener user_id para verificar like
        if (data?.user?.id || email) {
          const { data: usuarioRow } = await supabase
            .from('usuario')
            .select('user_id')
            .or(`auth_user_id.eq.${data?.user?.id || '00000000-0000-0000-0000-000000000000'},email.eq.${email || 'none@example.com'}`)
            .single()
          if (usuarioRow?.user_id) currentUsuarioId = Number(usuarioRow.user_id)
        }
      } catch {}
    }

    // Consultar like del usuario autenticado (si aplica)
    let liked = false
    if (currentUsuarioId) {
      try {
        const { data: favRow } = await supabase
          .from('favorito')
          .select('favorito_id')
          .eq('usuario_id', currentUsuarioId)
          .eq('producto_id', Number(productId))
          .single()
        liked = !!favRow
      } catch {}
    }

    // Verificar si el producto debe considerarse bloqueado por intercambio
    // Se bloquea si hay un intercambio 'completado' (definitivo)
    // o temporalmente si está 'aceptado' o 'en_progreso'
    let isInActiveExchange = false
    try {
      const { data: exchangeData } = await supabase
        .from('intercambio')
        .select('intercambio_id, estado')
        .or(`producto_ofrecido_id.eq.${productId},producto_solicitado_id.eq.${productId}`)
        .in('estado', ['completado', 'aceptado', 'en_progreso'])
        .limit(1)
      
      isInActiveExchange = !!exchangeData && exchangeData.length > 0
    } catch (error) {
      console.error('Error verificando estado de intercambio:', error)
    }

    // Incrementar contador de vistas y registrar visualización si el viewer NO es el dueño
    ;(async () => {
      try {
        if (!isOwner && currentUsuarioId) {
          // Incrementar contador de visualizaciones del producto
          await supabase
            .from('producto')
            .update({ visualizaciones: (product.visualizaciones || 0) + 1 })
            .eq('producto_id', Number(productId))
          
          // Registrar la visualización del usuario
          try {
            // Primero intentar insertar
            const { error: insertError } = await supabase
              .from('visualizacion_producto')
              .insert({
                usuario_id: currentUsuarioId,
                producto_id: Number(productId),
                fecha_visualizacion: new Date().toISOString()
              })
            
            // Si hay error de conflicto (código 23505), actualizar
            if (insertError && insertError.code === '23505') {
              await supabase
                .from('visualizacion_producto')
                .update({
                  fecha_visualizacion: new Date().toISOString()
                })
                .eq('usuario_id', currentUsuarioId)
                .eq('producto_id', Number(productId))
            }
          } catch (error) {
            console.error('Error en upsert de visualización:', error)
          }
        }
      } catch (error) {
        console.error('Error registrando visualización:', error)
      }
    })()

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
            categoria_nombre: product.categoria?.nombre || 'Sin categoría',
            especificaciones: specifications,
            visualizaciones: product.visualizaciones ?? 0,
            total_likes: product.total_likes ?? 0,
            usuario: {
                user_id: product.user_id,
                nombre: product.usuario?.nombre || '',
                apellido: product.usuario?.apellido || '',
                email: product.usuario?.email || '',
                foto_perfil: product.usuario?.foto_perfil || '',
                calificacion_promedio: product.usuario?.calificacion_promedio || 0,
                total_intercambios: product.usuario?.total_intercambios || 0
            },
            ubicacion: {
                ciudad: product.ciudad_snapshot || '',
                departamento: product.departamento_snapshot || ''
            },
            imagenes: imageUrls,
            total_productos_usuario: userStats?.length || 0
        }

    return NextResponse.json(
      { product: formattedProduct, liked, isOwner, isInActiveExchange },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
        }
      }
    )

    } catch (error: any) {
        console.error('Error en API de producto:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}
