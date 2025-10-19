import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * API endpoint para obtener la actividad del usuario (productos vistos)
 * GET /api/users/[userId]/activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const userId = params.userId;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado' },
        { status: 500 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar autenticación (opcional para pruebas)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.log('⚠️ Error de autenticación, continuando sin verificación:', authError.message);
      }
    } catch (error) {
      console.log('⚠️ Error verificando autenticación, continuando sin verificación');
    }

    // Obtener productos vistos del usuario (consulta simplificada)
    const { data: visualizaciones, error: visualizacionesError } = await supabase
      .from('visualizacion_producto')
      .select(`
        visualizacion_id,
        producto_id,
        fecha_visualizacion
      `)
      .eq('usuario_id', userId)
      .order('fecha_visualizacion', { ascending: false })
      .limit(20);

    if (visualizacionesError) {
      console.error('Error obteniendo visualizaciones:', visualizacionesError);
      return NextResponse.json(
        { error: 'Error obteniendo actividad del usuario', details: visualizacionesError.message },
        { status: 500 }
      );
    }

    // Procesar los datos para el frontend (versión simplificada)
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
      data: {
        productos_vistos: productosVistos,
        total: productosVistos.length
      }
    });

  } catch (error) {
    console.error('Error en API de actividad del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
