import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabase-client'

// Forzar runtime de Node en Vercel (evita Edge Runtime incompatibles con algunos SDKs)
export const runtime = 'nodejs'
// Evitar caching y asegurar ejecución dinámica
export const dynamic = 'force-dynamic'

// Valida el resultado de un intercambio por parte del usuario autenticado
// Estados resultantes cuando hay dos validaciones:
// - ambos es_exitoso = true  => intercambio.estado = 'completado'
// - uno true y otro false    => intercambio.estado = 'pendiente_revision' (envío a revisión de administradores)
// - ambos false               => intercambio.estado = 'fallido'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }
    // Cliente admin con SERVICE ROLE (Vercel) para operaciones con RLS
    // Si no está disponible, seguimos con el cliente normal (modo local)
    const admin = getSupabaseAdminClient() || supabase

    const intercambioId = Number(params.id)
    if (!intercambioId || Number.isNaN(intercambioId)) {
      return NextResponse.json({ error: 'Intercambio inválido' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { isValid, rating, comment, aspects } = body || {}

    if (typeof isValid !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos: isValid requerido' }, { status: 400 })
    }

    // Usuario autenticado - verificar token Bearer del header
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError)
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener user_id interno
    const { data: dbUser, error: userErr } = await admin
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userErr || !dbUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const usuarioId = dbUser.user_id

    // Registrar/actualizar validación del intercambio por este usuario
    // Primero verificar si ya existe una validación de este usuario
    const { data: existingVal, error: checkErr } = await admin
      .from('validacion_intercambio')
      .select('validacion_id')
      .eq('intercambio_id', intercambioId)
      .eq('usuario_id', usuarioId)
      .single()

    let upsertVal: any = null
    let upsertErr: any = null

    if (existingVal) {
      // Actualizar validación existente
      const { data, error } = await admin
        .from('validacion_intercambio')
        .update({
          es_exitoso: isValid,
          calificacion: typeof rating === 'number' ? rating : null,
          comentario: typeof comment === 'string' ? comment : null,
          aspectos_destacados: typeof aspects === 'string' ? aspects : null,
          fecha_validacion: new Date().toISOString()
        })
        .eq('validacion_id', existingVal.validacion_id)
        .select()
        .single()
      
      upsertVal = data
      upsertErr = error
    } else {
      // Crear nueva validación
      const { data, error } = await admin
        .from('validacion_intercambio')
        .insert({
          intercambio_id: intercambioId,
          usuario_id: usuarioId,
          es_exitoso: isValid,
          calificacion: typeof rating === 'number' ? rating : null,
          comentario: typeof comment === 'string' ? comment : null,
          aspectos_destacados: typeof aspects === 'string' ? aspects : null,
          fecha_validacion: new Date().toISOString()
        })
        .select()
        .single()
      
      upsertVal = data
      upsertErr = error
    }

    if (upsertErr) {
      return NextResponse.json({ error: 'No se pudo registrar la validación' }, { status: 500 })
    }

    // Obtener ambas validaciones (si existen)
    const { data: bothVals, error: valsErr } = await admin
      .from('validacion_intercambio')
      .select('usuario_id, es_exitoso')
      .eq('intercambio_id', intercambioId)

    if (valsErr) {
      return NextResponse.json({ error: 'No se pudo consultar validaciones' }, { status: 500 })
    }

    let adminReview = false
    let newEstado: string | null = null

    if (bothVals && bothVals.length >= 2) {
      const a = bothVals[0]?.es_exitoso === true
      const b = bothVals[1]?.es_exitoso === true

      if (a && b) {
        newEstado = 'completado'
      } else if (a !== b) {
        newEstado = 'pendiente_revision'
        adminReview = true
      } else {
        newEstado = 'fallido'
      }
    }

    // Actualizar estado del intercambio si corresponde
    if (newEstado) {
      const { error: updErr } = await admin
        .from('intercambio')
        .update({ estado: newEstado, fecha_actualizacion: new Date().toISOString() })
        .eq('intercambio_id', intercambioId)

      if (updErr) {
        // No bloquear la respuesta por este error, pero informarlo
        console.warn('No se pudo actualizar estado del intercambio:', updErr)
      }
    }

    // Crear ticket de soporte cuando hay discrepancia (pendiente_revision)
    let createdTicket: any = null
    if (adminReview) {
      try {
        // Construir una descripción con trazabilidad básica
        const detalle = {
          motivo: 'Discrepancia en validación de intercambio',
          intercambio_id: intercambioId,
          validaciones: bothVals || [],
        }

        const { data: ticket, error: ticketErr } = await admin
          .from('ticket_soporte')
          .insert({
            usuario_id: usuarioId, // quien reporta la discrepancia (validador actual)
            admin_asignado_id: null,
            asunto: `Discrepancia de validación en intercambio #${intercambioId}`,
            categoria: 'problema_intercambio',
            prioridad: 'alta',
            estado: 'abierto',
            descripcion: `Uno de los usuarios marcó exitoso y el otro no. Intercambio #${intercambioId}.`,
            intercambio_relacionado_id: intercambioId,
            archivos_adjuntos: null,
            producto_relacionado_id: null,
            tags: null
          })
          .select()
          .single()

        if (!ticketErr && ticket) {
          createdTicket = ticket
          // Registrar mensaje interno con el detalle estructurado si se desea
          await admin.from('mensaje_soporte').insert({
            ticket_id: ticket.ticket_id,
            remitente_id: usuarioId,
            tipo_remitente: 'usuario',
            contenido: JSON.stringify(detalle),
            es_interno: true
          })
        }
      } catch (e) {
        console.warn('No se pudo crear ticket de soporte para discrepancia:', e)
      }
    }

    return NextResponse.json({
      ok: true,
      data: upsertVal,
      adminReview,
      intercambioEstado: newEstado,
      ticket: createdTicket
    })
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
