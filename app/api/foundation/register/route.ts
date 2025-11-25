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

  // Obtener usuario de la base de datos
  const { data: userData } = await supabase
    .from('usuario')
    .select('user_id, email, nombre, apellido, es_admin')
    .eq('email', data.user.email)
    .single()

  return userData || null
}

// POST - Registrar como fundación o actualizar información de fundación
export async function POST(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      nombre_fundacion,
      nit_fundacion,
      tipo_fundacion,
      descripcion_fundacion,
      pagina_web_fundacion,
      documento_fundacion
    } = body

    // Validaciones
    if (!nombre_fundacion || nombre_fundacion.trim().length < 3) {
      return NextResponse.json({ 
        error: 'El nombre de la fundación es requerido (mínimo 3 caracteres)' 
      }, { status: 400 })
    }

    if (!nit_fundacion || nit_fundacion.trim().length < 5) {
      return NextResponse.json({ 
        error: 'El NIT es requerido (mínimo 5 caracteres)' 
      }, { status: 400 })
    }

    if (!tipo_fundacion) {
      return NextResponse.json({ 
        error: 'El tipo de fundación es requerido' 
      }, { status: 400 })
    }

    const tiposValidos = ['proteccion_ninos', 'educacion_ninos', 'salud_ninos', 'nutricion_ninos', 'derechos_ninos']
    if (!tiposValidos.includes(tipo_fundacion)) {
      return NextResponse.json({ 
        error: 'Tipo de fundación no válido. Solo se permiten fundaciones relacionadas con niños' 
      }, { status: 400 })
    }

    if (!descripcion_fundacion || descripcion_fundacion.trim().length < 20) {
      return NextResponse.json({ 
        error: 'La descripción es requerida (mínimo 20 caracteres)' 
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Verificar que el NIT no esté ya registrado
    const { data: existingNit } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('nit_fundacion', nit_fundacion.trim())
      .neq('user_id', user.user_id)
      .single()

    if (existingNit) {
      return NextResponse.json({ 
        error: 'Este NIT ya está registrado con otra cuenta' 
      }, { status: 400 })
    }

    // Actualizar usuario como fundación
    const { data: updatedUser, error: updateError } = await supabase
      .from('usuario')
      .update({
        es_fundacion: true,
        nombre_fundacion: nombre_fundacion.trim(),
        nit_fundacion: nit_fundacion.trim(),
        tipo_fundacion,
        descripcion_fundacion: descripcion_fundacion.trim(),
        pagina_web_fundacion: pagina_web_fundacion?.trim() || null,
        documento_fundacion: documento_fundacion || null,
        fundacion_verificada: false, // Debe ser verificada por admin
        fecha_verificacion_fundacion: null
      })
      .eq('user_id', user.user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando usuario como fundación:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Crear notificación para administradores
    try {
      const { data: admins } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('es_admin', true)

      if (admins && admins.length > 0) {
        const notificaciones = admins.map(admin => ({
          usuario_id: admin.user_id,
          tipo: 'nueva_fundacion',
          titulo: '🏛️ Nueva fundación registrada',
          mensaje: `${nombre_fundacion} se ha registrado como fundación y requiere verificación`,
          metadata: {
            fundacion_id: user.user_id,
            nombre_fundacion,
            nit_fundacion: nit_fundacion.trim(),
            tipo_fundacion
          },
          leida: false
        }))

        await supabase
          .from('notificacion')
          .insert(notificaciones)
      }
    } catch (notifError) {
      console.error('Error creando notificaciones para admins:', notifError)
      // No fallar si las notificaciones fallan
    }

    console.log('✅ Fundación registrada:', {
      user_id: user.user_id,
      nombre_fundacion,
      nit_fundacion: nit_fundacion.trim()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Fundación registrada exitosamente. Será verificada por un administrador.',
      user: updatedUser 
    })

  } catch (error: any) {
    console.error('Error en POST foundation/register:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// GET - Obtener información de fundación del usuario actual
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

    const { data: userData, error } = await supabase
      .from('usuario')
      .select(`
        user_id,
        es_fundacion,
        nombre_fundacion,
        nit_fundacion,
        tipo_fundacion,
        descripcion_fundacion,
        pagina_web_fundacion,
        fundacion_verificada,
        fecha_verificacion_fundacion
      `)
      .eq('user_id', user.user_id)
      .single()

    if (error) {
      console.error('Error obteniendo información de fundación:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      foundation: userData 
    })

  } catch (error: any) {
    console.error('Error en GET foundation/register:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

