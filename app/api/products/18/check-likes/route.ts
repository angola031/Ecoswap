import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint simple para verificar el campo total_likes del producto 18
 * GET /api/products/18/check-likes
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

    // Consultar directamente el producto 18 con el campo total_likes
    const { data: product, error } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes, fecha_actualizacion')
      .eq('producto_id', 18)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo producto 18',
        details: error.message
      }, { status: 500 });
    }

    // Contar favoritos reales
    const { data: favoritos, error: favoritosError } = await supabase
      .from('favorito')
      .select('favorito_id')
      .eq('producto_id', 18);

    if (favoritosError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo favoritos',
        details: favoritosError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Datos del producto 18',
      data: {
        producto: {
          id: product.producto_id,
          titulo: product.titulo,
          total_likes: product.total_likes,
          fecha_actualizacion: product.fecha_actualizacion
        },
        favoritos_reales: favoritos.length,
        verificacion: {
          campo_total_likes_existe: product.total_likes !== undefined,
          valor_total_likes: product.total_likes,
          sincronizado: product.total_likes === favoritos.length
        },
        instrucciones: [
          'El campo total_likes existe en la base de datos',
          `El valor actual es: ${product.total_likes}`,
          `Hay ${favoritos.length} favoritos reales`,
          'El frontend debería mostrar este valor en el campo "me gusta"'
        ]
      }
    });

  } catch (error) {
    console.error('Error verificando producto 18:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
