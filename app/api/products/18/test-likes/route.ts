import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint de prueba específico para el producto 18
 * GET /api/products/18/test-likes
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 1. Verificar el producto 18
    const { data: product, error: productError } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes, fecha_actualizacion')
      .eq('producto_id', 18)
      .single();

    if (productError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo producto 18',
        details: productError.message
      }, { status: 500 });
    }

    // 2. Contar favoritos reales para el producto 18
    const { data: favoritos, error: favoritosError } = await supabase
      .from('favorito')
      .select('favorito_id, usuario_id, fecha_agregado')
      .eq('producto_id', 18);

    if (favoritosError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo favoritos del producto 18',
        details: favoritosError.message
      }, { status: 500 });
    }

    // 3. Verificar si el campo total_likes existe
    const { data: columnCheck, error: columnError } = await supabase
      .from('producto')
      .select('total_likes')
      .eq('producto_id', 18)
      .single();

    // 4. Verificar triggers
    const { data: triggers, error: triggersError } = await supabase
      .rpc('get_triggers_info', { table_name: 'favorito' })
      .single();

    return NextResponse.json({
      success: true,
      message: 'Información del producto 18',
      data: {
        producto: {
          id: product.producto_id,
          titulo: product.titulo,
          total_likes: product.total_likes || 0,
          fecha_actualizacion: product.fecha_actualizacion
        },
        favoritos: {
          total: favoritos.length,
          detalles: favoritos
        },
        verificacion: {
          campo_total_likes_existe: !columnError,
          contador_sistema: product.total_likes || 0,
          favoritos_reales: favoritos.length,
          sincronizado: (product.total_likes || 0) === favoritos.length
        },
        recomendaciones: [
          favoritos.length === 0 ? 'No hay favoritos para este producto' : `Hay ${favoritos.length} favoritos`,
          (product.total_likes || 0) === 0 ? 'El contador está en 0' : `El contador muestra ${product.total_likes}`,
          (product.total_likes || 0) !== favoritos.length ? 'Los contadores están desincronizados' : 'Los contadores están sincronizados'
        ]
      }
    });

  } catch (error) {
    console.error('Error en test de producto 18:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * POST endpoint para corregir el producto 18
 * POST /api/products/18/test-likes
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // Sincronizar el contador del producto 18
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

    const totalFavoritos = favoritos.length;

    // Actualizar el contador
    const { error: updateError } = await supabase
      .from('producto')
      .update({ 
        total_likes: totalFavoritos,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('producto_id', 18);

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Error actualizando contador',
        details: updateError.message
      }, { status: 500 });
    }

    // Verificar el resultado
    const { data: updatedProduct, error: verifyError } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes, fecha_actualizacion')
      .eq('producto_id', 18)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Producto 18 actualizado correctamente',
      data: {
        producto: updatedProduct,
        favoritos_reales: totalFavoritos,
        sincronizado: updatedProduct.total_likes === totalFavoritos
      }
    });

  } catch (error) {
    console.error('Error corrigiendo producto 18:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
