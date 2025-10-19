import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint de prueba para simular la visualización de un producto
 * POST /api/test-product-view
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase no está configurado'
      }, { status: 500 });
    }

    const { producto_id, usuario_id } = await request.json();

    if (!producto_id || !usuario_id) {
      return NextResponse.json({
        success: false,
        error: 'producto_id y usuario_id son requeridos'
      }, { status: 400 });
    }

    console.log('🔍 Simulando visualización de producto:', producto_id, 'por usuario:', usuario_id);

    // 1. Obtener información del producto
    const { data: product, error: productError } = await supabase
      .from('producto')
      .select(`
        producto_id,
        titulo,
        user_id,
        visualizaciones,
        estado_publicacion,
        estado_validacion
      `)
      .eq('producto_id', producto_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({
        success: false,
        error: 'Producto no encontrado',
        details: productError?.message
      }, { status: 404 });
    }

    console.log('✅ Producto encontrado:', product.titulo);

    // 2. Verificar si el usuario es el dueño
    const isOwner = product.user_id === usuario_id;
    console.log('🔍 ¿Es el dueño?:', isOwner, '(product.user_id:', product.user_id, 'vs usuario_id:', usuario_id, ')');

    // 3. Verificar que el producto esté activo
    const isActive = product.estado_publicacion === 'activo' && product.estado_validacion === 'approved';
    console.log('🔍 ¿Producto activo?:', isActive);

    // 4. Simular la lógica del endpoint original
    if (!isOwner && isActive) {
      console.log('🔍 Registrando visualización...');
      
      // Incrementar contador de visualizaciones del producto
      const { error: updateError } = await supabase
        .from('producto')
        .update({ visualizaciones: (product.visualizaciones || 0) + 1 })
        .eq('producto_id', Number(producto_id));

      if (updateError) {
        console.error('❌ Error actualizando visualizaciones del producto:', updateError);
      } else {
        console.log('✅ Visualizaciones del producto actualizadas');
      }

      // Registrar la visualización del usuario
      const { data: insertData, error: insertError } = await supabase
        .from('visualizacion_producto')
        .insert({
          usuario_id: usuario_id,
          producto_id: Number(producto_id),
          fecha_visualizacion: new Date().toISOString()
        })
        .onConflict('usuario_id, producto_id')
        .update({
          fecha_visualizacion: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('❌ Error registrando visualización:', insertError);
      } else {
        console.log('✅ Visualización registrada/actualizada:', insertData);
      }

      // Verificar el resultado
      const { data: visualizacionFinal, error: finalError } = await supabase
        .from('visualizacion_producto')
        .select('*')
        .eq('usuario_id', usuario_id)
        .eq('producto_id', producto_id)
        .single();

      return NextResponse.json({
        success: true,
        message: 'Visualización procesada',
        data: {
          producto: {
            id: product.producto_id,
            titulo: product.titulo,
            visualizaciones_antes: product.visualizaciones,
            visualizaciones_despues: (product.visualizaciones || 0) + 1
          },
          usuario: {
            id: usuario_id,
            es_propietario: isOwner
          },
          visualizacion: visualizacionFinal,
          acciones_realizadas: [
            'Contador de visualizaciones incrementado',
            'Visualización registrada/actualizada en tabla visualizacion_producto'
          ]
        }
      });

    } else {
      return NextResponse.json({
        success: true,
        message: 'Visualización no registrada',
        data: {
          producto: {
            id: product.producto_id,
            titulo: product.titulo
          },
          usuario: {
            id: usuario_id,
            es_propietario: isOwner
          },
          razon: isOwner ? 'Usuario es el propietario del producto' : 'Producto no está activo',
          acciones_realizadas: ['Ninguna - no se registra visualización']
        }
      });
    }

  } catch (error) {
    console.error('❌ Error en test de visualización:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
