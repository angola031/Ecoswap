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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })

    // Obtener la lista de usuarios que le dieron like al producto
    const { data: likes, error } = await supabaseAdmin
      .from('favorito')
      .select(`
        favorito_id,
        fecha_agregado,
        usuario:usuario_id (
          user_id,
          nombre,
          apellido,
          foto_perfil,
          calificacion_promedio,
          total_intercambios
        )
      `)
      .eq('producto_id', productoId)
      .order('fecha_agregado', { ascending: false })

    if (error) {
      console.error('Error obteniendo likes del producto:', error)
      return NextResponse.json({ error: 'Error al obtener likes' }, { status: 500 })
    }

    // Formatear la respuesta
    const formattedLikes = likes?.map(like => {
      const usuarioData = Array.isArray(like.usuario) ? like.usuario[0] : like.usuario
      return {
        id: like.favorito_id,
        fecha_agregado: like.fecha_agregado,
        usuario: {
          id: usuarioData?.user_id,
          nombre: usuarioData?.nombre,
          apellido: usuarioData?.apellido,
          foto_perfil: usuarioData?.foto_perfil,
          calificacion_promedio: usuarioData?.calificacion_promedio,
          total_intercambios: usuarioData?.total_intercambios
        }
      }
    }) || []

    return NextResponse.json({ 
      likes: formattedLikes,
      total: formattedLikes.length
    })

  } catch (e: any) {
    console.error('Error en API de likes:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar si ya existe el like
    const { data: exists } = await supabaseAdmin
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    if (exists) {
      return NextResponse.json({ error: 'Ya has dado like a este producto' }, { status: 400 })
    }

    // Agregar el like
    const { error: insertErr } = await supabaseAdmin
      .from('favorito')
      .insert({ usuario_id: userId, producto_id: productoId })

    if (insertErr) {
      console.error('Error agregando like:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Like agregado exitosamente',
      success: true 
    })

  } catch (e: any) {
    console.error('Error en API de likes POST:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Remover el like
    const { error } = await supabaseAdmin
      .from('favorito')
      .delete()
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)

    if (error) {
      console.error('Error removiendo like:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Like removido exitosamente',
      success: true 
    })

  } catch (e: any) {
    console.error('Error en API de likes DELETE:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
