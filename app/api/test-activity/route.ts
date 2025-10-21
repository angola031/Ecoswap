import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

// Configuraciones para evitar DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint de prueba para verificar la actividad del usuario
 * GET /api/test-activity?userId=1
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

    // Obtener userId de los parámetros de consulta
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Parámetro userId requerido'
      }, { status: 400 });
    }

    // Verificar que la tabla visualizacion_producto existe
    const { data: visualizaciones, error: visualizacionesError } = await supabase
      .from('visualizacion_producto')
      .select(`
        visualizacion_id,
        usuario_id,
        producto_id,
        fecha_visualizacion
      `)
      .eq('usuario_id', userId)
      .limit(5);

    if (visualizacionesError) {
      return NextResponse.json({
        success: false,
        error: 'Error consultando visualizaciones',
        details: visualizacionesError.message,
        hint: 'Verifica que la tabla visualizacion_producto existe'
      }, { status: 500 });
    }

    // Obtener información básica de los productos
    const productosVistos = [];
    for (const visualizacion of visualizaciones || []) {
      const { data: producto, error: productoError } = await supabase
        .from('producto')
        .select('producto_id, titulo, estado_publicacion, estado_validacion')
        .eq('producto_id', visualizacion.producto_id)
        .single();

      if (!productoError && producto) {
        productosVistos.push({
          visualizacion_id: visualizacion.visualizacion_id,
          producto_id: producto.producto_id,
          titulo: producto.titulo,
          fecha_visualizacion: visualizacion.fecha_visualizacion,
          estado_publicacion: producto.estado_publicacion,
          estado_validacion: producto.estado_validacion
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Actividad del usuario ${userId}`,
      data: {
        usuario_id: userId,
        total_visualizaciones: visualizaciones?.length || 0,
        productos_vistos: productosVistos,
        verificacion: {
          tabla_existe: !visualizacionesError,
          usuario_tiene_actividad: (visualizaciones?.length || 0) > 0
        }
      }
    });

  } catch (error) {
    console.error('Error en test de actividad:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
