import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint de prueba para verificar el sistema de likes
 * GET /api/products/likes/test
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 1. Verificar que el campo total_likes existe
    const { data: columnCheck, error: columnError } = await supabase
      .from('producto')
      .select('total_likes')
      .limit(1);

    if (columnError) {
      return NextResponse.json({
        success: false,
        error: 'Campo total_likes no existe o hay error de acceso',
        details: columnError.message
      }, { status: 500 });
    }

    // 2. Obtener algunos productos con sus likes
    const { data: products, error: productsError } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes')
      .order('total_likes', { ascending: false })
      .limit(10);

    if (productsError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo productos',
        details: productsError.message
      }, { status: 500 });
    }

    // 3. Contar favoritos reales
    const { data: favoritos, error: favoritosError } = await supabase
      .from('favorito')
      .select('producto_id')
      .not('producto_id', 'is', null);

    if (favoritosError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo favoritos',
        details: favoritosError.message
      }, { status: 500 });
    }

    // 4. Verificar sincronización para algunos productos
    const verificaciones = [];
    for (const product of products.slice(0, 5)) {
      const favoritosReales = favoritos.filter(f => f.producto_id === product.producto_id).length;
      verificaciones.push({
        producto_id: product.producto_id,
        titulo: product.titulo,
        contador_sistema: product.total_likes || 0,
        favoritos_reales: favoritosReales,
        sincronizado: (product.total_likes || 0) === favoritosReales
      });
    }

    // 5. Estadísticas generales
    const totalProductos = products.length;
    const totalLikesSistema = products.reduce((sum, p) => sum + (p.total_likes || 0), 0);
    const productosConLikes = products.filter(p => (p.total_likes || 0) > 0).length;
    const totalFavoritosReales = favoritos.length;

    return NextResponse.json({
      success: true,
      message: 'Sistema de likes funcionando correctamente',
      data: {
        verificaciones,
        estadisticas: {
          total_productos_verificados: totalProductos,
          total_likes_sistema: totalLikesSistema,
          total_favoritos_reales: totalFavoritosReales,
          productos_con_likes: productosConLikes,
          diferencia_total: totalLikesSistema - totalFavoritosReales
        },
        productos_muestra: products
      }
    });

  } catch (error) {
    console.error('Error en test de likes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
