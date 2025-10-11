import { NextRequest, NextResponse } from 'next/server'

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
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Evitar duplicados: si ya existe, devolver ok
    const { data: exists } = await supabase
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    if (!exists) {
      const { error: insertErr } = await supabase
        .from('favorito')
        .insert({ usuario_id: userId, producto_id: productoId })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 })

      // El trigger automáticamente actualizará el contador de likes
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    
    const userId = await getAuthUserId(req)
    
    if (!userId) {
      return NextResponse.json({ liked: false })
    }

    const { data, error } = await supabase
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    
    const liked = !!data
    
    return NextResponse.json({ liked })
  } catch (e: any) {
    console.error('❌ ERROR in API Like GET:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    
    const userId = await getAuthUserId(req)
    
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar si el favorito existe antes de eliminarlo
    const { data: existingFavorito } = await supabase
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()
    

    const { error } = await supabase
      .from('favorito')
      .delete()
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
    
    if (error) {
      console.error('❌ ERROR API DELETE: Error eliminando favorito:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // El trigger automáticamente actualizará el contador de likes

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('❌ ERROR API DELETE: Error general:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

