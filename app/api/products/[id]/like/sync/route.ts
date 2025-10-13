import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔄 SYNC - Sincronizando contador de likes...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client no disponible',
        status: 'ERROR'
      }, { status: 500 })
    }

    const productoId = Number(params.id)
    
    // 1. Contar favoritos reales
    const { count: favoritosReales, error: countError } = await supabase
      .from('favorito')
      .select('*', { count: 'exact', head: true })
      .eq('producto_id', productoId)

    if (countError) {
      return NextResponse.json({ 
        error: 'Error contando favoritos: ' + countError.message,
        status: 'ERROR'
      }, { status: 500 })
    }

    // 2. Obtener el producto actual
    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes')
      .eq('producto_id', productoId)
      .single()
    
    if (productoError || !producto) {
      return NextResponse.json({ 
        error: 'Producto no encontrado',
        status: 'ERROR'
      }, { status: 404 })
    }

    // 3. Actualizar el contador
    const { error: updateError } = await supabase
      .from('producto')
      .update({ 
        total_likes: favoritosReales || 0,
        fecha_actualizacion: new Date().toISOString()
      })
      .eq('producto_id', productoId)

    if (updateError) {
      return NextResponse.json({ 
        error: 'Error actualizando contador: ' + updateError.message,
        status: 'ERROR'
      }, { status: 500 })
    }

    const result = {
      status: 'SUCCESS',
      producto: {
        id: producto.producto_id,
        titulo: producto.titulo
      },
      antes: {
        total_likes_tabla: producto.total_likes
      },
      despues: {
        total_likes_tabla: favoritosReales || 0,
        favoritos_reales: favoritosReales || 0
      },
      sincronizado: true,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Sincronización completada:', result)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      status: 'ERROR',
      stack: e?.stack
    }, { status: 500 })
  }
}
