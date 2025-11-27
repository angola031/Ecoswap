import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
import { REQUIRED_FOUNDATION_DOCUMENT_KEYS } from '@/types/foundation'

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

// GET - Obtener lista de fundaciones pendientes de verificación (solo admins)
export async function GET(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.es_admin) {
      return NextResponse.json({ error: 'Solo administradores pueden acceder' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    // Soportar tanto ?estado= como ?filter= (usado por el dashboard)
    const estado = searchParams.get('filter') || searchParams.get('estado') // 'pending', 'verified', 'all'

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    let query = supabase
      .from('usuario')
      .select(`
        user_id,
        nombre,
        apellido,
        email,
        telefono,
        es_fundacion,
        nombre_fundacion,
        nit_fundacion,
        tipo_fundacion,
        descripcion_fundacion,
        pagina_web_fundacion,
        documento_fundacion,
        documentos_fundacion,
        fundacion_verificada,
        fecha_verificacion_fundacion,
        fecha_registro
      `)
      .eq('es_fundacion', true)
      .order('fecha_registro', { ascending: false })

    if (estado === 'pendiente' || estado === 'pending') {
      query = query.eq('fundacion_verificada', false)
    } else if (estado === 'verificada' || estado === 'verified') {
      query = query.eq('fundacion_verificada', true)
    }

    const { data: fundaciones, error } = await query

    if (error) {
      console.error('Error obteniendo fundaciones:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ fundaciones: fundaciones || [] })

  } catch (error: any) {
    console.error('Error en GET foundation/verify:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

// PATCH - Verificar o rechazar una fundación (solo admins)
export async function PATCH(req: NextRequest) {
  try {
    const user = await authUser(req)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!user.es_admin) {
      return NextResponse.json({ error: 'Solo administradores pueden verificar fundaciones' }, { status: 403 })
    }

    const body = await req.json()
    const { fundacion_id, user_id, accion, motivo, document_key, document_action, comentario } = body

    const targetFoundationId = fundacion_id ?? user_id

    if (!targetFoundationId) {
      return NextResponse.json({ error: 'fundacion_id es requerido' }, { status: 400 })
    }

    const isDocumentAction = document_key && document_action

    if (!isDocumentAction && (!accion || !['verificar', 'rechazar'].includes(accion))) {
      return NextResponse.json({
        error: 'Acción inválida. Debe ser "verificar" o "rechazar"'
      }, { status: 400 })
    }

    if (isDocumentAction && !['aprobar', 'rechazar'].includes(document_action)) {
      return NextResponse.json({
        error: 'document_action inválida. Debe ser "aprobar" o "rechazar"'
      }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Verificar que la fundación existe
    const { data: fundacion, error: fundacionError } = await supabase
      .from('usuario')
      .select('user_id, nombre_fundacion, es_fundacion, fundacion_verificada')
      .eq('user_id', targetFoundationId)
      .single()

    if (fundacionError || !fundacion) {
      return NextResponse.json({ error: 'Fundación no encontrada' }, { status: 404 })
    }

    if (!fundacion.es_fundacion) {
      return NextResponse.json({ error: 'Este usuario no es una fundación' }, { status: 400 })
    }

    if (isDocumentAction) {
      const docKey = document_key as string

      const { data: currentDocsData, error: docsError } = await supabase
        .from('usuario')
        .select('documentos_fundacion, nombre_fundacion')
        .eq('user_id', targetFoundationId)
        .single()

      if (docsError) {
        return NextResponse.json({ error: docsError.message }, { status: 400 })
      }

      const currentDocs = currentDocsData?.documentos_fundacion || {}

      if (!currentDocs[docKey] || (typeof currentDocs[docKey] === 'object' && !currentDocs[docKey].url)) {
        return NextResponse.json({ error: 'Documento no encontrado o sin archivo' }, { status: 404 })
      }

      const currentEntry = currentDocs[docKey]
      const updatedEntry = typeof currentEntry === 'string'
        ? { url: currentEntry }
        : currentEntry

      if (document_action === 'rechazar' && !comentario) {
        return NextResponse.json({ error: 'Debes proporcionar un comentario al rechazar un documento' }, { status: 400 })
      }

      const newEntry = {
        ...updatedEntry,
        estado: document_action === 'aprobar' ? 'aprobado' : 'rechazado',
        comentario_admin: document_action === 'rechazar' ? comentario : null,
        revisado_por: user.user_id,
        fecha_revision: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      }

      const updatedDocs = {
        ...currentDocs,
        [docKey]: newEntry
      }

      const { error: updateError } = await supabase
        .from('usuario')
        .update({ documentos_fundacion: updatedDocs })
        .eq('user_id', targetFoundationId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }

      const allRequiredApproved = REQUIRED_FOUNDATION_DOCUMENT_KEYS.every(requiredKey => {
        const doc = updatedDocs[requiredKey]
        if (!doc) return false
        const normalized = typeof doc === 'string' ? { url: doc, estado: 'pendiente' } : doc
        return normalized.estado === 'aprobado'
      })

      if (allRequiredApproved) {
        const { error: verifyError } = await supabase
          .from('usuario')
          .update({
            fundacion_verificada: true,
            fecha_verificacion_fundacion: new Date().toISOString()
          })
          .eq('user_id', targetFoundationId)

        if (!verifyError) {
          await supabase
            .from('notificacion')
            .insert({
              usuario_id: targetFoundationId,
              tipo: 'fundacion_verificada',
              titulo: '🎉 ¡Fundación verificada!',
              mensaje: 'Tus documentos obligatorios fueron aprobados. Tu fundación ya es verificada.',
              datos_adicionales: {
                verificada_automaticamente: true,
                motivo: 'Documentos requeridos aprobados'
              }
            })
        }
      }

      return NextResponse.json({
        success: true,
        documentos_fundacion: updatedDocs,
        auto_verificada: allRequiredApproved
      })
    }

    // Actualizar estado de verificación completa
    const updateData: any = {}
    
    if (accion === 'verificar') {
      updateData.fundacion_verificada = true
      updateData.fecha_verificacion_fundacion = new Date().toISOString()
    } else {
      // Si rechaza, quitar el estado de fundación
      updateData.es_fundacion = false
      updateData.fundacion_verificada = false
      updateData.fecha_verificacion_fundacion = null
    }

    const { data: updatedFundacion, error: updateError } = await supabase
      .from('usuario')
      .update(updateData)
      .eq('user_id', targetFoundationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error actualizando fundación:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Crear notificación para la fundación
    try {
      await supabase
        .from('notificacion')
        .insert({
          usuario_id: targetFoundationId,
          tipo: accion === 'verificar' ? 'fundacion_verificada' : 'fundacion_rechazada',
          titulo: accion === 'verificar' 
            ? '✅ Tu fundación ha sido verificada'
            : '❌ Tu solicitud de fundación fue rechazada',
          mensaje: accion === 'verificar'
            ? `¡Felicitaciones! Tu fundación ha sido verificada por un administrador. Ahora tienes acceso a beneficios exclusivos.`
            : `Tu solicitud de fundación fue rechazada. ${motivo ? 'Motivo: ' + motivo : 'Contacta con soporte para más información.'}`,
          metadata: {
            verificado_por: user.user_id,
            admin_nombre: `${user.nombre} ${user.apellido}`,
            fecha_verificacion: new Date().toISOString(),
            motivo: motivo || null
          },
          leida: false
        })

      console.log(`✅ Notificación enviada a fundación ${fundacion_id}`)
    } catch (notifError) {
      console.error('Error creando notificación:', notifError)
      // No fallar si la notificación falla
    }

    // Registrar actividad de admin
    try {
      await supabase
        .from('actividad_admin')
        .insert({
          admin_id: user.user_id,
          accion: accion === 'verificar' ? 'VERIFICAR_FUNDACION' : 'RECHAZAR_FUNDACION',
          modulo: 'Fundaciones',
          detalles: {
            fundacion_id: targetFoundationId,
            nombre_fundacion: fundacion.nombre_fundacion,
            motivo: motivo || null
          }
        })
    } catch (actError) {
      console.error('Error registrando actividad:', actError)
      // No fallar si el registro falla
    }

    console.log(`✅ Fundación ${targetFoundationId} ${accion === 'verificar' ? 'verificada' : 'rechazada'} por admin ${user.user_id}`)

    return NextResponse.json({ 
      success: true, 
      message: accion === 'verificar' ? 'Fundación verificada exitosamente' : 'Fundación rechazada',
      fundacion: updatedFundacion 
    })

  } catch (error: any) {
    console.error('Error en PATCH foundation/verify:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

