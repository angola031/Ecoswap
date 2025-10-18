import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  
  try {
    const { data } = await supabase.auth.getUser(token)
    const authUserId = data?.user?.id
    if (!authUserId) return null
    
    // Buscar el usuario por auth_user_id
    const { data: usuario } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    return usuario?.user_id ?? null
  } catch (error) {
    console.error('Error obteniendo user_id:', error)
    return null
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const productoId = Number(params.id)
    
    if (!productoId) {
      return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    }
    
    const userId = await getAuthUserId(req)
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Verificar si el usuario ya vio el producto
    const { data: existingView } = await supabase
      .from('visualizacion_producto')
      .select('visualizacion_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()
    

    if (existingView) {
      return NextResponse.json({ 
        message: 'Usuario ya había visto este producto',
        newView: false,
        alreadyViewed: true
      })
    }

    // Usar la función de la base de datos para registrar la visualización
    const { data: result, error } = await supabase
      .rpc('register_product_view', {
        p_usuario_id: userId,
        p_producto_id: productoId
      })

    if (error) {
      console.error('❌ ERROR API VIEW: Error registrando visualización:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }


    return NextResponse.json({ 
      message: 'Visualización registrada exitosamente',
      newView: result,
      alreadyViewed: false
    })

  } catch (e: any) {
    console.error('❌ ERROR API VIEW: Error general:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const productoId = Number(params.id)
    
    if (!productoId) {
      return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    }
    
    const userId = await getAuthUserId(req)
    
    // Obtener contador de visualizaciones únicas
    const { data: uniqueViews, error: viewsError } = await supabase
      .rpc('get_unique_views_count', {
        p_producto_id: productoId
      })

    if (viewsError) {
      console.error('❌ ERROR API VIEW GET: Error obteniendo contador:', viewsError)
      return NextResponse.json({ error: viewsError.message }, { status: 500 })
    }

    // Verificar si el usuario actual ya vio el producto
    let hasUserViewed = false
    if (userId) {
      const { data: userViewed, error: userError } = await supabase
        .rpc('has_user_viewed_product', {
          p_usuario_id: userId,
          p_producto_id: productoId
        })
      
      if (!userError) {
        hasUserViewed = userViewed
      }
    }

    console.log('🔍 DEBUG API VIEW GET: Estadísticas:', {
      productoId,
      uniqueViews,
      hasUserViewed,
      userId
    })

    return NextResponse.json({ 
      uniqueViews: uniqueViews || 0,
      hasUserViewed: hasUserViewed,
      userId: userId
    })

  } catch (e: any) {
    console.error('❌ ERROR API VIEW GET: Error general:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
