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
    .select('user_id, email, nombre, apellido, es_fundacion, fundacion_verificada')
    .eq('email', data.user.email)
    .single()

  return userData || null
}

// GET - Obtener eventos (todos o de una fundación específica)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fundacion_id = searchParams.get('fundacion_id')
    const estado = searchParams.get('estado') || 'activo'
    const upcoming = searchParams.get('upcoming') === 'true'

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    let query = supabase
      .from('evento_fundacion')
      .select(`
        evento_id,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        ubicacion_detalle,
        tipo_evento,
        imagen_evento,
        capacidad_maxima,
        requiere_registro,
        estado,
        fecha_creacion,
        fundacion:fundacion_id(
          user_id,
          nombre,
          apellido,
          nombre_fundacion,
          foto_perfil,
          fundacion_verificada
        )
      `)
      .eq('estado', estado)

    if (fundacion_id) {
      query = query.eq('fundacion_id', fundacion_id)
    }

    if (upcoming) {
      query = query.gte('fecha_inicio', new Date().toISOString())
    }

    query = query.order('fecha_inicio', { ascending: true })

    const { data: events, error } = await query

    if (error) {
      console.error('Error obteniendo eventos:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Obtener número de registros para cada evento
    const eventsWithRegistrations = await Promise.all(
      (events || []).map(async (event) => {
        const { count } = await supabase
          .from('registro_evento')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', event.evento_id)
          .eq('estado', 'confirmado')

        return {
          ...event,
          registros_count: count || 0
        }
      })
    )

    return NextResponse.json({ events: eventsWithRegistrations })

  } catch (error: any) {
    console.error('Error en GET events:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// POST - Crear un evento (solo fundaciones verificadas)
export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que sea fundación verificada
    if (!user.es_fundacion || !user.fundacion_verificada) {
      return NextResponse.json({ 
        error: 'Solo fundaciones verificadas pueden crear eventos' 
      }, { status: 403 })
    }

    const body = await req.json()
    const {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      ubicacion_detalle,
      tipo_evento,
      imagen_evento,
      capacidad_maxima,
      requiere_registro
    } = body

    // Validaciones
    if (!titulo || !descripcion || !fecha_inicio || !tipo_evento) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos: titulo, descripcion, fecha_inicio, tipo_evento' 
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const { data: event, error } = await supabase
      .from('evento_fundacion')
      .insert({
        fundacion_id: user.user_id,
        titulo,
        descripcion,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        ubicacion_detalle,
        tipo_evento,
        imagen_evento,
        capacidad_maxima,
        requiere_registro: requiere_registro || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creando evento:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, event })

  } catch (error: any) {
    console.error('Error en POST events:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// PATCH - Actualizar un evento
export async function PATCH(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { evento_id, ...updates } = body

    if (!evento_id) {
      return NextResponse.json({ error: 'evento_id es requerido' }, { status: 400 })
    }

    const supabase = getSupabaseClient()

    // Verificar que el evento pertenece a la fundación
    const { data: existingEvent } = await supabase
      .from('evento_fundacion')
      .select('fundacion_id')
      .eq('evento_id', evento_id)
      .single()

    if (!existingEvent || existingEvent.fundacion_id !== user.user_id) {
      return NextResponse.json({ 
        error: 'No tienes permiso para actualizar este evento' 
      }, { status: 403 })
    }

    const { data: event, error } = await supabase
      .from('evento_fundacion')
      .update(updates)
      .eq('evento_id', evento_id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando evento:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, event })

  } catch (error: any) {
    console.error('Error en PATCH events:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// DELETE - Eliminar un evento
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

    // Verificar que el evento pertenece a la fundación
    const { data: existingEvent } = await supabase
      .from('evento_fundacion')
      .select('fundacion_id')
      .eq('evento_id', evento_id)
      .single()

    if (!existingEvent || existingEvent.fundacion_id !== user.user_id) {
      return NextResponse.json({ 
        error: 'No tienes permiso para eliminar este evento' 
      }, { status: 403 })
    }

    const { error } = await supabase
      .from('evento_fundacion')
      .delete()
      .eq('evento_id', evento_id)

    if (error) {
      console.error('Error eliminando evento:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error en DELETE events:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

