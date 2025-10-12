import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  
  if (!token) {
    return null
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token)
    
    if (error || !data?.user) {
      return null
    }
    
    const authUserId = data.user.id
    
    // Buscar el usuario en la tabla usuario por auth_user_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    if (usuarioError || !usuario) {
      return null
    }
    
    return usuario.user_id
  } catch (error) {
    console.error('Error obteniendo user_id:', error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ API Users Me: Supabase no está configurado')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    const userId = await getAuthUserId(req)
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Obtener información completa del usuario
    const { data: user, error } = await supabase
      .from('usuario')
      .select('user_id, nombre, apellido, email, foto_perfil, activo, ultima_conexion')
      .eq('user_id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error en GET /api/users/me:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
