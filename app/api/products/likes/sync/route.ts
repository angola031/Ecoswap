import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * API endpoint para sincronizar los contadores de likes de productos
 * POST /api/products/likes/sync
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Verificar autenticación (opcional, depende de tus políticas)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Ejecutar la función de sincronización
    const { data, error } = await supabase.rpc('sync_all_product_likes');

    if (error) {
      console.error('Error al sincronizar likes:', error);
      return NextResponse.json(
        { error: 'Error al sincronizar contadores de likes', details: error.message },
        { status: 500 }
      );
    }

    // Obtener estadísticas actualizadas
    const { data: stats, error: statsError } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes, fecha_actualizacion')
      .order('total_likes', { ascending: false })
      .limit(10);

    if (statsError) {
      console.error('Error al obtener estadísticas:', statsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Contadores de likes sincronizados correctamente',
      data: {
        productos_actualizados: data?.length || 0,
        top_productos: stats || []
      }
    });

  } catch (error) {
    console.error('Error en sincronización de likes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para obtener estadísticas de likes
 * GET /api/products/likes/sync
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Obtener estadísticas generales
    const { data: stats, error: statsError } = await supabase
      .from('producto')
      .select('total_likes')
      .not('total_likes', 'is', null);

    if (statsError) {
      throw statsError;
    }

    // Calcular estadísticas
    const totalProductos = stats.length;
    const totalLikes = stats.reduce((sum, p) => sum + (p.total_likes || 0), 0);
    const promedioLikes = totalProductos > 0 ? (totalLikes / totalProductos) : 0;
    const maxLikes = Math.max(...stats.map(p => p.total_likes || 0));
    const productosConLikes = stats.filter(p => (p.total_likes || 0) > 0).length;

    // Obtener top productos
    const { data: topProductos, error: topError } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes, fecha_actualizacion')
      .gt('total_likes', 0)
      .order('total_likes', { ascending: false })
      .limit(10);

    if (topError) {
      console.error('Error al obtener top productos:', topError);
    }

    return NextResponse.json({
      success: true,
      data: {
        estadisticas: {
          total_productos: totalProductos,
          total_likes_sistema: totalLikes,
          promedio_likes: Number(promedioLikes.toFixed(2)),
          max_likes: maxLikes,
          productos_con_likes: productosConLikes
        },
        top_productos: topProductos || []
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de likes:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
