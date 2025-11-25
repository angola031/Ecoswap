import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

async function authUser(req: NextRequest) {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  
  const { data } = await supabase.auth.getUser(token)
  if (!data?.user) return null

  const { data: userData } = await supabase
    .from('usuario')
    .select('user_id, email, nombre, apellido')
    .eq('email', data.user.email)
    .single()

  return userData || null
}

// GET - Verificar si el usuario es admin
export async function GET(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Verificar si el usuario es administrador
    const { data: adminData, error } = await supabase
      .from('administrador')
      .select('admin_id, rol, activo')
      .eq('user_id', user.user_id)
      .eq('activo', true)
      .single()

    if (error || !adminData) {
      return NextResponse.json({ error: 'No autorizado - No es administrador' }, { status: 403 })
    }

    return NextResponse.json({ 
      isAdmin: true, 
      admin: adminData 
    })

  } catch (error: any) {
    console.error('Error en check admin:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

