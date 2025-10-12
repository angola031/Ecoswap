import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ Supabase client no disponible')
      return null
    }
    
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) {
      console.log('❌ No hay token de autorización')
      return null
    }
    
    // Verificar que el token sea válido
    const { data, error } = await supabase.auth.getUser(token)
    if (error) {
      console.error('❌ Error obteniendo usuario:', error.message)
      return null
    }
    
    const authUserId = data?.user?.id
    if (!authUserId) {
      console.log('❌ No hay auth_user_id')
      return null
    }
    
    // Buscar el usuario por auth_user_id usando el cliente normal
    // Esto funcionará si RLS está deshabilitado en la tabla usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    if (usuarioError) {
      console.error('❌ Error buscando usuario:', usuarioError.message)
      return null
    }
    
    return usuario?.user_id ?? null
  } catch (error) {
    console.error('❌ Error general en getAuthUserId:', error)
    return null
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 POST /api/products/like - Iniciando...')
    
    // Usar cliente normal de Supabase
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ Supabase client no disponible')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const productoId = Number(params.id)
    console.log('📦 Producto ID:', productoId)
    
    if (!productoId || isNaN(productoId)) {
      console.error('❌ Producto ID inválido:', params.id)
      return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    }
    
    const userId = await getAuthUserId(req)
    console.log('👤 User ID:', userId)
    
    if (!userId) {
      console.error('❌ Usuario no autenticado')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Evitar duplicados: si ya existe, devolver ok
    const { data: exists, error: existsError } = await supabase
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    if (existsError) {
      console.error('❌ Error verificando favorito existente:', existsError.message)
      return NextResponse.json({ error: 'Error verificando favorito' }, { status: 500 })
    }

    if (!exists) {
      console.log('➕ Creando nuevo favorito...')
      console.log('📝 Datos a insertar:', { usuario_id: userId, producto_id: productoId })
      
      const { data: insertData, error: insertErr } = await supabase
        .from('favorito')
        .insert({ usuario_id: userId, producto_id: productoId })
        .select('favorito_id')
        .single()
        
      if (insertErr) {
        console.error('❌ Error insertando favorito:', insertErr.message)
        console.error('❌ Detalles del error:', insertErr)
        return NextResponse.json({ 
          error: insertErr.message, 
          details: insertErr,
          userId,
          productoId 
        }, { status: 400 })
      }
      console.log('✅ Favorito creado exitosamente:', insertData)
      
      // Actualizar contador de likes en la tabla producto
      console.log('📊 Actualizando contador de likes...')
      
      // Primero contar los favoritos actuales
      const { count: likesCount, error: countError } = await supabase
        .from('favorito')
        .select('*', { count: 'exact', head: true })
        .eq('producto_id', productoId)
      
      if (!countError && likesCount !== null) {
        // Actualizar el contador con el valor real
        const { error: updateError } = await supabase
          .from('producto')
          .update({ 
            total_likes: likesCount,
            fecha_actualizacion: new Date().toISOString()
          })
          .eq('producto_id', productoId)
        
        if (updateError) {
          console.error('⚠️ Error actualizando contador de likes:', updateError.message)
        } else {
          console.log(`✅ Contador de likes actualizado a: ${likesCount}`)
        }
      } else {
        console.error('⚠️ Error contando likes:', countError?.message)
      }
    } else {
      console.log('ℹ️ Favorito ya existe:', exists)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('❌ Error general en POST:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Usar cliente normal de Supabase
    const supabase = getSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

    const productoId = Number(params.id)
    if (!productoId || isNaN(productoId)) {
      console.error('❌ Producto ID inválido:', params.id)
      return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    }
    
    // Para GET, no requerimos autenticación - solo devolvemos si está liked
    const userId = await getAuthUserId(req)
    
    if (!userId) {
      // Usuario no autenticado - no puede tener likes
      return NextResponse.json({ liked: false })
    }

    const { data, error } = await supabase
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    if (error) {
      console.error('❌ Error consultando favorito:', error)
      return NextResponse.json({ liked: false })
    }
    
    const liked = !!data
    
    return NextResponse.json({ liked })
  } catch (e: any) {
    console.error('❌ ERROR in API Like GET:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Usar cliente normal de Supabase
    const supabase = getSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

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

    // Actualizar contador de likes después de eliminar
    console.log('📊 Actualizando contador de likes después de eliminar...')
    
    const { count: likesCount, error: countError } = await supabase
      .from('favorito')
      .select('*', { count: 'exact', head: true })
      .eq('producto_id', productoId)
    
    if (!countError && likesCount !== null) {
      const { error: updateError } = await supabase
        .from('producto')
        .update({ 
          total_likes: likesCount,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('producto_id', productoId)
      
      if (updateError) {
        console.error('⚠️ Error actualizando contador de likes:', updateError.message)
      } else {
        console.log(`✅ Contador de likes actualizado a: ${likesCount}`)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('❌ ERROR API DELETE: Error general:', e)
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

