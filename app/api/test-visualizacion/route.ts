import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint de prueba simple para visualizaciones
 * GET /api/test-visualizacion?userId=1
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

    console.log('🔍 Probando endpoint de visualizaciones para usuario:', userId);

    // Verificar que la tabla existe
    const { data: visualizaciones, error: visualizacionesError } = await supabase
      .from('visualizacion_producto')
      .select('*')
      .eq('usuario_id', userId)
      .limit(10);

    if (visualizacionesError) {
      console.error('❌ Error consultando visualizaciones:', visualizacionesError);
      return NextResponse.json({
        success: false,
        error: 'Error consultando visualizaciones',
        details: visualizacionesError.message
      }, { status: 500 });
    }

    console.log('✅ Visualizaciones encontradas:', visualizaciones?.length || 0);

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
      message: `Visualizaciones del usuario ${userId}`,
      data: {
        usuario_id: userId,
        total_visualizaciones: visualizaciones?.length || 0,
        productos_vistos: productosVistos,
        raw_data: visualizaciones
      }
    });

  } catch (error) {
    console.error('❌ Error en test de visualizaciones:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
