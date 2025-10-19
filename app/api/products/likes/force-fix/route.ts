import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint para forzar la corrección del sistema de likes
 * POST /api/products/likes/force-fix
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado' },
        { status: 500 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { producto_id } = await request.json().catch(() => ({}));

    // 1. Verificar que el campo total_likes existe
    const { data: columnCheck, error: columnError } = await supabase
      .from('producto')
      .select('total_likes')
      .limit(1);

    if (columnError) {
      return NextResponse.json({
        success: false,
        error: 'Campo total_likes no existe',
        details: columnError.message,
        solucion: 'Ejecutar el script de instalación en la base de datos'
      }, { status: 500 });
    }

    // 2. Si se especifica un producto, corregir solo ese
    if (producto_id) {
      // Contar favoritos reales para el producto específico
      const { data: favoritos, error: favoritosError } = await supabase
        .from('favorito')
        .select('favorito_id')
        .eq('producto_id', producto_id);

      if (favoritosError) {
        return NextResponse.json({
          success: false,
          error: 'Error obteniendo favoritos',
          details: favoritosError.message
        }, { status: 500 });
      }

      const totalFavoritos = favoritos.length;

      // Actualizar contador del producto específico
      const { error: updateError } = await supabase
        .from('producto')
        .update({ 
          total_likes: totalFavoritos,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('producto_id', producto_id);

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Error actualizando producto específico',
          details: updateError.message
        }, { status: 500 });
      }

      // Verificar resultado
      const { data: updatedProduct, error: verifyError } = await supabase
        .from('producto')
        .select('producto_id, titulo, total_likes, fecha_actualizacion')
        .eq('producto_id', producto_id)
        .single();

      return NextResponse.json({
        success: true,
        message: `Producto ${producto_id} corregido`,
        data: {
          producto: updatedProduct,
          favoritos_reales: totalFavoritos,
          sincronizado: updatedProduct.total_likes === totalFavoritos
        }
      });
    }

    // 3. Corregir TODOS los productos
    const { data: allProducts, error: productsError } = await supabase
      .from('producto')
      .select('producto_id, total_likes');

    if (productsError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo productos',
        details: productsError.message
      }, { status: 500 });
    }

    let productosCorregidos = 0;
    let errores = [];

    for (const product of allProducts) {
      try {
        // Contar favoritos reales para este producto
        const { count: favoritosReales, error: countError } = await supabase
          .from('favorito')
          .select('*', { count: 'exact', head: true })
          .eq('producto_id', product.producto_id);

        if (countError) {
          errores.push({
            producto_id: product.producto_id,
            error: countError.message
          });
          continue;
        }

        // Actualizar contador
        const { error: updateError } = await supabase
          .from('producto')
          .update({ 
            total_likes: favoritosReales || 0,
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('producto_id', product.producto_id);

        if (updateError) {
          errores.push({
            producto_id: product.producto_id,
            error: updateError.message
          });
        } else {
          productosCorregidos++;
        }

      } catch (error) {
        errores.push({
          producto_id: product.producto_id,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    // 4. Verificar estado final
    const { data: finalStats, error: statsError } = await supabase
      .from('producto')
      .select('total_likes');

    const totalLikesSistema = finalStats?.reduce((sum, p) => sum + (p.total_likes || 0), 0) || 0;
    const productosConLikes = finalStats?.filter(p => (p.total_likes || 0) > 0).length || 0;

    return NextResponse.json({
      success: true,
      message: `Corrección completada: ${productosCorregidos} productos actualizados`,
      data: {
        productos_corregidos: productosCorregidos,
        total_procesados: allProducts.length,
        total_likes_sistema: totalLikesSistema,
        productos_con_likes: productosConLikes,
        errores: errores
      }
    });

  } catch (error) {
    console.error('Error en corrección forzada:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * GET endpoint para verificar el estado del sistema
 * GET /api/products/likes/force-fix
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no está configurado' },
        { status: 500 }
      );
    }

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 1. Verificar que el campo total_likes existe
    const { data: columnCheck, error: columnError } = await supabase
      .from('producto')
      .select('total_likes')
      .limit(1);

    if (columnError) {
      return NextResponse.json({
        success: false,
        error: 'Campo total_likes no existe',
        details: columnError.message,
        solucion: 'Ejecutar el script de instalación en la base de datos'
      }, { status: 500 });
    }

    // 2. Obtener estadísticas
    const { data: stats, error: statsError } = await supabase
      .from('producto')
      .select('total_likes');

    if (statsError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo estadísticas',
        details: statsError.message
      }, { status: 500 });
    }

    // 3. Contar favoritos reales
    const { data: favoritos, error: favoritosError } = await supabase
      .from('favorito')
      .select('producto_id');

    if (favoritosError) {
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo favoritos',
        details: favoritosError.message
      }, { status: 500 });
    }

    // 4. Calcular estadísticas
    const totalProductos = stats.length;
    const totalLikesSistema = stats.reduce((sum, p) => sum + (p.total_likes || 0), 0);
    const productosConLikes = stats.filter(p => (p.total_likes || 0) > 0).length;
    const totalFavoritosReales = favoritos.length;

    // 5. Verificar sincronización
    const productosDesincronizados = stats.filter(p => {
      const favoritosReales = favoritos.filter(f => f.producto_id === p.producto_id).length;
      return (p.total_likes || 0) !== favoritosReales;
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        sistema: {
          campo_total_likes_existe: true,
          total_productos: totalProductos,
          total_likes_sistema: totalLikesSistema,
          total_favoritos_reales: totalFavoritosReales,
          productos_con_likes: productosConLikes,
          productos_desincronizados: productosDesincronizados,
          porcentaje_sincronizacion: totalProductos > 0 ? 
            ((totalProductos - productosDesincronizados) / totalProductos * 100).toFixed(2) + '%' : '0%'
        },
        recomendaciones: [
          productosDesincronizados > 0 ? 
            'Ejecutar POST /api/products/likes/force-fix para sincronizar contadores' : 
            'Sistema sincronizado correctamente',
          totalFavoritosReales === 0 ? 
            'No hay favoritos en la base de datos' : 
            `Hay ${totalFavoritosReales} favoritos en total`
        ]
      }
    });

  } catch (error) {
    console.error('Error verificando sistema de likes:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
