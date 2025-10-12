import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ [Test Proposals] Supabase no está configurado')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    // Probar conexión básica a la tabla propuesta
    const { data: propuestas, error } = await supabase
      .from('propuesta')
      .select('propuesta_id, chat_id, tipo_propuesta, estado, fecha_creacion')
      .limit(5)

    if (error) {
      console.error('❌ [Test Proposals] Error en consulta:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      }, { status: 500 })
    }


    // Probar consulta con joins
    const { data: propuestasConJoins, error: joinError } = await supabase
      .from('propuesta')
      .select(`
        propuesta_id,
        chat_id,
        tipo_propuesta,
        estado,
        usuario_propone_id,
        usuario_recibe_id,
        usuario_propone:usuario!propuesta_usuario_propone_id_fkey (
          user_id,
          nombre,
          apellido
        ),
        usuario_recibe:usuario!propuesta_usuario_recibe_id_fkey (
          user_id,
          nombre,
          apellido
        )
      `)
      .limit(3)

    if (joinError) {
      console.error('❌ [Test Proposals] Error en consulta con joins:', joinError)
      return NextResponse.json({ 
        success: false, 
        error: joinError.message,
        details: joinError,
        basicQuery: propuestas
      }, { status: 500 })
    }


    // Probar consulta de chats
    const { data: chats, error: chatError } = await supabase
      .from('chat')
      .select(`
        chat_id,
        intercambio_id,
        intercambio (
          usuario_propone_id,
          usuario_recibe_id
        )
      `)
      .limit(3)

    if (chatError) {
      console.error('❌ [Test Proposals] Error en consulta de chats:', chatError)
    } else {
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: {
        propuestas: propuestas?.length || 0,
        propuestasConJoins: propuestasConJoins?.length || 0,
        chats: chats?.length || 0,
        sampleProposals: propuestas,
        sampleProposalsWithJoins: propuestasConJoins,
        sampleChats: chats
      }
    })

  } catch (error) {
    console.error('❌ [Test Proposals] Error general:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor',
      details: error 
    }, { status: 500 })
  }
}
