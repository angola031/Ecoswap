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

// POST - Registrarse a un evento
export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { evento_id, notas } = body

    if (!evento_id) {
      return NextResponse.json({ error: 'evento_id es requerido' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Verificar que el evento existe y requiere registro
    const { data: event, error: eventError } = await supabase
      .from('evento_fundacion')
      .select('evento_id, requiere_registro, capacidad_maxima, fundacion_id')
      .eq('evento_id', evento_id)
      .eq('estado', 'activo')
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado o inactivo' }, { status: 404 })
    }

    if (!event.requiere_registro) {
      return NextResponse.json({ 
        error: 'Este evento no requiere registro' 
      }, { status: 400 })
    }

    // Verificar capacidad si existe
    if (event.capacidad_maxima) {
      const { count } = await supabase
        .from('registro_evento')
        .select('*', { count: 'exact', head: true })
        .eq('evento_id', evento_id)
        .eq('estado', 'confirmado')

      if (count && count >= event.capacidad_maxima) {
        return NextResponse.json({ 
          error: 'El evento ha alcanzado su capacidad máxima' 
        }, { status: 400 })
      }
    }

    // Crear registro
    const { data: registration, error } = await supabase
      .from('registro_evento')
      .insert({
        evento_id,
        usuario_id: user.user_id,
        notas,
        estado: 'confirmado'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ 
          error: 'Ya estás registrado en este evento' 
        }, { status: 400 })
      }
      console.error('Error registrando a evento:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Crear notificación para la fundación
    await supabase
      .from('notificacion')
      .insert({
        usuario_id: event.fundacion_id,
        tipo: 'evento',
        titulo: 'Nuevo registro a evento',
        mensaje: `${user.nombre} ${user.apellido} se ha registrado a tu evento`,
        datos_adicionales: {
          evento_id,
          usuario_id: user.user_id,
          registro_id: registration.registro_id
        }
      })

    return NextResponse.json({ success: true, registration })

  } catch (error: any) {
    console.error('Error en POST event registration:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// DELETE - Cancelar registro a un evento
export async function DELETE(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const evento_id = searchParams.get('evento_id')

    if (!evento_id) {
      return NextResponse.json({ error: 'evento_id es requerido' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Actualizar estado a cancelado (no eliminamos el registro)
    const { error } = await supabase
      .from('registro_evento')
      .update({ estado: 'cancelado' })
      .eq('evento_id', evento_id)
      .eq('usuario_id', user.user_id)

    if (error) {
      console.error('Error cancelando registro:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error en DELETE event registration:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// GET - Obtener mis registros
export async function GET(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabase = getSupabaseClient()

    const { data: registrations, error } = await supabase
      .from('registro_evento')
      .select(`
        registro_id,
        fecha_registro,
        estado,
        notas,
        evento:evento_id(
          evento_id,
          titulo,
          descripcion,
          fecha_inicio,
          fecha_fin,
          ubicacion,
          tipo_evento,
          imagen_evento,
          fundacion:fundacion_id(
            nombre_fundacion,
            foto_perfil
          )
        )
      `)
      .eq('usuario_id', user.user_id)
      .order('fecha_registro', { ascending: false })

    if (error) {
      console.error('Error obteniendo registros:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ registrations })

  } catch (error: any) {
    console.error('Error en GET my registrations:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

