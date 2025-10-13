import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 QUICK CHECK - Verificando sistema de likes...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client no disponible',
        status: 'ERROR'
      }, { status: 500 })
    }

    const productoId = Number(params.id)
    
    // 1. Verificar si el producto existe
    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('producto_id, titulo, total_likes')
      .eq('producto_id', productoId)
      .single()
    
    if (productoError || !producto) {
      return NextResponse.json({ 
        error: 'Producto no encontrado',
        productoId,
        status: 'ERROR'
      }, { status: 404 })
    }

    // 2. Contar favoritos reales en la tabla favorito
    const { count: favoritosReales, error: countError } = await supabase
      .from('favorito')
      .select('*', { count: 'exact', head: true })
      .eq('producto_id', productoId)

    // 3. Obtener algunos favoritos de ejemplo
    const { data: favoritosEjemplo, error: ejemploError } = await supabase
      .from('favorito')
      .select('favorito_id, usuario_id, fecha_agregado')
      .eq('producto_id', productoId)
      .limit(5)

    const result = {
      status: 'SUCCESS',
      producto: {
        id: producto.producto_id,
        titulo: producto.titulo,
        total_likes_en_tabla: producto.total_likes
      },
      favoritos: {
        cantidad_real: favoritosReales || 0,
        ejemplo: favoritosEjemplo || [],
        error_count: countError?.message || null,
        error_ejemplo: ejemploError?.message || null
      },
      sincronizacion: {
        necesita_actualizacion: (producto.total_likes || 0) !== (favoritosReales || 0),
        diferencia: (favoritosReales || 0) - (producto.total_likes || 0)
      },
      timestamp: new Date().toISOString()
    }

    console.log('📊 Resultado del quick check:', result)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      status: 'ERROR',
      stack: e?.stack
    }, { status: 500 })
  }
}
