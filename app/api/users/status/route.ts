import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ API Users Status: Supabase no está configurado')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Obtener el token de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar la sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Obtener usuarios activos (en línea)
    const { data: activeUsers, error: usersError } = await supabase
      .from('usuario')
      .select(`
        user_id,
        nombre,
        apellido,
        email,
        foto_perfil,
        activo,
        ultima_conexion,
        es_admin
      `)
      .eq('activo', true)
      .order('ultima_conexion', { ascending: false })

    if (usersError) {
      console.error('Error obteniendo usuarios activos:', usersError)
      return NextResponse.json({ error: 'Error obteniendo usuarios' }, { status: 500 })
    }

    // Formatear respuesta
    const formattedUsers = activeUsers?.map(user => ({
      id: user.user_id,
      name: `${user.nombre} ${user.apellido}`.trim(),
      email: user.email,
      avatar: user.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      isOnline: user.activo,
      lastSeen: user.ultima_conexion,
      isAdmin: user.es_admin
    })) || []

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length
    })

  } catch (error) {
    console.error('Error en API de estado de usuarios:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Endpoint para actualizar el estado de un usuario específico
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ API Users Status PATCH: Supabase no está configurado')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar la sesión
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive debe ser un booleano' }, { status: 400 })
    }

    // Actualizar estado del usuario
    const { error: updateError } = await supabase
      .from('usuario')
      .update({ 
        activo: isActive,
        ultima_conexion: new Date().toISOString()
      })
      .eq('email', user.email)

    if (updateError) {
      console.error('Error actualizando estado del usuario:', updateError)
      return NextResponse.json({ error: 'Error actualizando estado' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Usuario marcado como ${isActive ? 'activo' : 'inactivo'}`
    })

  } catch (error) {
    console.error('Error actualizando estado de usuario:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
