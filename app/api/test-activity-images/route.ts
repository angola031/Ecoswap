import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint de prueba para verificar que las imágenes se incluyen en la actividad
 * GET /api/test-activity-images?userId=1
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase no está configurado'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1';

    console.log('🔍 Probando endpoint de actividad con imágenes para usuario:', userId);

    // Obtener productos vistos del usuario
    const { data: visualizaciones, error: visualizacionesError } = await supabase
      .from('visualizacion_producto')
      .select(`
        visualizacion_id,
        producto_id,
        fecha_visualizacion
      `)
      .eq('usuario_id', userId)
      .order('fecha_visualizacion', { ascending: false })
      .limit(5);

    if (visualizacionesError) {
      return NextResponse.json({
        success: false,
        error: 'Error consultando visualizaciones',
        details: visualizacionesError.message
      }, { status: 500 });
    }

    console.log('✅ Visualizaciones encontradas:', visualizaciones?.length || 0);

    // Procesar los datos para el frontend
    const productosVistos = [];
    
    for (const visualizacion of visualizaciones || []) {
      try {
        // Obtener información del producto
        const { data: producto, error: productoError } = await supabase
          .from('producto')
          .select(`
            producto_id,
            titulo,
            descripcion,
            precio,
            estado,
            tipo_transaccion,
            estado_publicacion,
            estado_validacion,
            ciudad_snapshot,
            departamento_snapshot,
            total_likes,
            categoria:categoria(nombre)
          `)
          .eq('producto_id', visualizacion.producto_id)
          .single();

        // Obtener imagen principal del producto
        let imagenPrincipal = '/default-product.png';
        if (!productoError && producto) {
          const { data: imagenes, error: imagenesError } = await supabase
            .from('imagen_producto')
            .select('url_imagen, es_principal, orden')
            .eq('producto_id', visualizacion.producto_id)
            .order('orden', { ascending: true });

          if (!imagenesError && imagenes && imagenes.length > 0) {
            // Buscar imagen principal o usar la primera
            const imagen = imagenes.find(img => img.es_principal) || imagenes[0];
            if (imagen && imagen.url_imagen) {
              imagenPrincipal = imagen.url_imagen;
            }
          }
        }

        if (!productoError && producto && producto.estado_publicacion === 'activo' && producto.estado_validacion === 'approved') {
          productosVistos.push({
            id: producto.producto_id.toString(),
            titulo: producto.titulo,
            descripcion: producto.descripcion,
            precio: producto.precio,
            estado: producto.estado,
            tipo_transaccion: producto.tipo_transaccion,
            categoria: producto.categoria?.nombre || 'Sin categoría',
            ubicacion: {
              ciudad: producto.ciudad_snapshot || '',
              departamento: producto.departamento_snapshot || ''
            },
            imagen_principal: imagenPrincipal,
            fecha_visualizacion: visualizacion.fecha_visualizacion,
            likes: producto.total_likes || 0
          });
        }
      } catch (error) {
        console.error('Error procesando producto:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Actividad del usuario ${userId} con imágenes`,
      data: {
        usuario_id: userId,
        total_visualizaciones: visualizaciones?.length || 0,
        productos_vistos: productosVistos,
        verificacion: {
          tabla_existe: !visualizacionesError,
          usuario_tiene_actividad: (visualizaciones?.length || 0) > 0,
          imagenes_incluidas: productosVistos.every(p => p.imagen_principal !== '/default-product.png')
        }
      }
    });

  } catch (error) {
    console.error('Error en test de actividad con imágenes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
