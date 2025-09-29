import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  
  if (!token) return null
  
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return null
    
    // Obtener user_id del usuario autenticado
    const { data: usuario } = await supabaseAdmin
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', data.user.id)
      .single()
    
    return usuario?.user_id || null
  } catch (error) {
    console.error('Error obteniendo user_id:', error)
    return null
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = Number(params.userId)
    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario inválido' }, { status: 400 })
    }

    // Verificar autenticación
    const authUserId = await getAuthUserId(req)
    if (!authUserId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    // Obtener información del usuario
    const { data: usuario, error } = await supabaseAdmin
      .from('usuario')
      .select(`
        user_id,
        nombre,
        apellido,
        foto_perfil,
        email,
        calificacion_promedio,
        total_intercambios,
        fecha_registro,
        activo
      `)
      .eq('user_id', userId)
      .single()

    if (error || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      user_id: usuario.user_id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      foto_perfil: usuario.foto_perfil,
      email: usuario.email,
      calificacion_promedio: usuario.calificacion_promedio,
      total_intercambios: usuario.total_intercambios,
      fecha_registro: usuario.fecha_registro,
      activo: usuario.activo
    })

  } catch (error: any) {
    console.error('Error en API de usuario:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
