import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint para verificar la sincronización de likes
 * GET /api/products/likes/verify
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación (opcional)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Query para verificar sincronización
    const { data, error } = await supabase
      .from('producto')
      .select(`
        producto_id,
        titulo,
        total_likes,
        favorito!inner(count)
      `)
      .not('total_likes', 'is', null);

    if (error) {
      console.error('Error en verificación de likes:', error);
      return NextResponse.json(
        { error: 'Error al verificar sincronización', details: error.message },
        { status: 500 }
      );
    }

    // Query alternativa para contar favoritos reales
    const { data: favoritosReales, error: favoritosError } = await supabase
      .from('favorito')
      .select('producto_id')
      .not('producto_id', 'is', null);

    if (favoritosError) {
      console.error('Error al contar favoritos reales:', favoritosError);
      return NextResponse.json(
        { error: 'Error al contar favoritos reales', details: favoritosError.message },
        { status: 500 }
      );
    }

    // Contar favoritos por producto
    const favoritosPorProducto = favoritosReales.reduce((acc: Record<number, number>, fav) => {
      acc[fav.producto_id] = (acc[fav.producto_id] || 0) + 1;
      return acc;
    }, {});

    // Verificar sincronización
    const productosDesincronizados = data.filter(producto => {
      const favoritosReales = favoritosPorProducto[producto.producto_id] || 0;
      return producto.total_likes !== favoritosReales;
    });

    const productosSincronizados = data.filter(producto => {
      const favoritosReales = favoritosPorProducto[producto.producto_id] || 0;
      return producto.total_likes === favoritosReales;
    });

    return NextResponse.json({
      success: true,
      data: {
        verificacion: {
          total_productos_verificados: data.length,
          productos_sincronizados: productosSincronizados.length,
          productos_desincronizados: productosDesincronizados.length,
          porcentaje_sincronizacion: data.length > 0 ? 
            ((productosSincronizados.length / data.length) * 100).toFixed(2) + '%' : '0%'
        },
        productos_desincronizados: productosDesincronizados.map(producto => ({
          producto_id: producto.producto_id,
          titulo: producto.titulo,
          contador_sistema: producto.total_likes,
          favoritos_reales: favoritosPorProducto[producto.producto_id] || 0,
          diferencia: producto.total_likes - (favoritosPorProducto[producto.producto_id] || 0)
        })),
        estadisticas_generales: {
          total_favoritos_sistema: data.reduce((sum, p) => sum + (p.total_likes || 0), 0),
          total_favoritos_reales: favoritosReales.length,
          diferencia_total: data.reduce((sum, p) => sum + (p.total_likes || 0), 0) - favoritosReales.length
        }
      }
    });

  } catch (error) {
    console.error('Error en verificación de likes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint para corregir productos desincronizados
 * POST /api/products/likes/verify
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { producto_ids } = await request.json();

    let productosACorregir = [];
    
    if (producto_ids && Array.isArray(producto_ids)) {
      // Corregir productos específicos
      productosACorregir = producto_ids;
    } else {
      // Corregir todos los productos desincronizados
      const { data: todosProductos } = await supabase
        .from('producto')
        .select('producto_id');
      
      productosACorregir = todosProductos?.map(p => p.producto_id) || [];
    }

    let productosCorregidos = 0;
    let errores = [];

    for (const productoId of productosACorregir) {
      try {
        // Contar favoritos reales para este producto
        const { count: favoritosReales, error: countError } = await supabase
          .from('favorito')
          .select('*', { count: 'exact', head: true })
          .eq('producto_id', productoId);

        if (countError) {
          errores.push({
            producto_id: productoId,
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
          .eq('producto_id', productoId);

        if (updateError) {
          errores.push({
            producto_id: productoId,
            error: updateError.message
          });
        } else {
          productosCorregidos++;
        }

      } catch (error) {
        errores.push({
          producto_id: productoId,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Corrección completada: ${productosCorregidos} productos actualizados`,
      data: {
        productos_corregidos: productosCorregidos,
        total_procesados: productosACorregir.length,
        errores: errores
      }
    });

  } catch (error) {
    console.error('Error en corrección de likes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
