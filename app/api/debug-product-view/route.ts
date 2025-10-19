import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Endpoint de debug para verificar por qué no se actualiza la tabla visualizacion_producto
 * POST /api/debug-product-view
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

    console.log('🔍 Debug: Verificando visualización para producto:', producto_id, 'usuario:', usuario_id);

    // 1. Verificar que el producto existe
    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('producto_id, titulo, user_id, estado_publicacion, estado_validacion')
      .eq('producto_id', producto_id)
      .single();

    if (productoError || !producto) {
      return NextResponse.json({
        success: false,
        error: 'Producto no encontrado',
        details: productoError?.message
      }, { status: 404 });
    }

    console.log('✅ Producto encontrado:', producto.titulo);

    // 2. Verificar si el usuario es el dueño
    const isOwner = producto.user_id === usuario_id;
    console.log('🔍 ¿Es el dueño?:', isOwner);

    // 3. Verificar estado del producto
    const isActive = producto.estado_publicacion === 'activo' && producto.estado_validacion === 'approved';
    console.log('🔍 ¿Producto activo?:', isActive);

    // 4. Verificar datos antes de la inserción
    const { data: visualizacionAntes, error: antesError } = await supabase
      .from('visualizacion_producto')
      .select('*')
      .eq('usuario_id', usuario_id)
      .eq('producto_id', producto_id)
      .single();

    console.log('🔍 Visualización antes:', visualizacionAntes ? 'existe' : 'no existe');

    // 5. Intentar insertar/actualizar
    let resultadoInsercion = null;
    let errorInsercion = null;

    if (!isOwner) {
      try {
        let insertResult = null;
        let insertError = null;
        
        try {
          // Primero intentar insertar
          const { data: insertData, error: insertErr } = await supabase
            .from('visualizacion_producto')
            .insert({
              usuario_id: usuario_id,
              producto_id: producto_id,
              fecha_visualizacion: new Date().toISOString()
            })
            .select();
          
          insertResult = insertData;
          insertError = insertErr;
          
          // Si hay error de conflicto, actualizar
          if (insertError && insertError.code === '23505') {
            console.log('🔍 Conflicto detectado, actualizando...');
            const { data: updateData, error: updateErr } = await supabase
              .from('visualizacion_producto')
              .update({
                fecha_visualizacion: new Date().toISOString()
              })
              .eq('usuario_id', usuario_id)
              .eq('producto_id', producto_id)
              .select();
            
            insertResult = updateData;
            insertError = updateErr;
          }
        } catch (error) {
          insertError = error;
        }

        resultadoInsercion = insertResult;
        errorInsercion = insertError;
        
        console.log('🔍 Resultado inserción:', insertResult ? 'éxito' : 'error');
        console.log('🔍 Error inserción:', insertError?.message || 'ninguno');
      } catch (error) {
        errorInsercion = error;
        console.log('🔍 Error capturado:', error);
      }
    }

    // 6. Verificar datos después de la inserción
    const { data: visualizacionDespues, error: despuesError } = await supabase
      .from('visualizacion_producto')
      .select('*')
      .eq('usuario_id', usuario_id)
      .eq('producto_id', producto_id)
      .single();

    console.log('🔍 Visualización después:', visualizacionDespues ? 'existe' : 'no existe');

    return NextResponse.json({
      success: true,
      debug: {
        producto: {
          id: producto.producto_id,
          titulo: producto.titulo,
          propietario_id: producto.user_id,
          estado_publicacion: producto.estado_publicacion,
          estado_validacion: producto.estado_validacion
        },
        usuario: {
          id: usuario_id
        },
        verificaciones: {
          es_propietario: isOwner,
          producto_activo: isActive,
          deberia_registrar: !isOwner && isActive
        },
        visualizacion_antes: visualizacionAntes,
        resultado_insercion: resultadoInsercion,
        error_insercion: errorInsercion?.message || null,
        visualizacion_despues: visualizacionDespues
      }
    });

  } catch (error) {
    console.error('❌ Error en debug de visualización:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
