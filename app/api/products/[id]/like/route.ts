import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  
  try {
    const { data } = await supabaseAdmin.auth.getUser(token)
    const authUserId = data?.user?.id
    if (!authUserId) return null
    
    // Buscar el usuario por auth_user_id
    const { data: usuario } = await supabaseAdmin
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
    const { data: exists } = await supabaseAdmin
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    if (!exists) {
      const { error: insertErr } = await supabaseAdmin
        .from('favorito')
        .insert({ usuario_id: userId, producto_id: productoId })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 })

      // El trigger automáticamente actualizará el contador de likes
      console.log(`✅ Like agregado para producto ${productoId} por usuario ${userId}`)
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
    console.log('🔍 DEBUG API Like GET:', { productoId, userId })
    
    if (!userId) {
      console.log('🔍 DEBUG: No userId found, returning liked: false')
      return NextResponse.json({ liked: false })
    }

    const { data, error } = await supabaseAdmin
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    console.log('🔍 DEBUG: Favorito query result:', { data, error })
    
    const liked = !!data
    console.log('🔍 DEBUG: Returning liked:', liked)
    
    return NextResponse.json({ liked })
  } catch (e: any) {
    console.error('❌ ERROR in API Like GET:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    console.log('🔍 DEBUG API DELETE: Iniciando eliminación de like para producto:', productoId)
    
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    
    const userId = await getAuthUserId(req)
    console.log('🔍 DEBUG API DELETE: Usuario ID obtenido:', userId)
    
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar si el favorito existe antes de eliminarlo
    const { data: existingFavorito } = await supabaseAdmin
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()
    
    console.log('🔍 DEBUG API DELETE: Favorito existente:', existingFavorito)

    const { error } = await supabaseAdmin
      .from('favorito')
      .delete()
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
    
    if (error) {
      console.error('❌ ERROR API DELETE: Error eliminando favorito:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // El trigger automáticamente actualizará el contador de likes
    console.log(`✅ Like removido exitosamente para producto ${productoId} por usuario ${userId}`)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('❌ ERROR API DELETE: Error general:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

