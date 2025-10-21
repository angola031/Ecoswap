import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Configuraciones para evitar DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Endpoint para obtener validaciones directas de la tabla validacion_intercambio
 * GET /api/intercambios/[id]/validations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    const intercambioId = Number(params.id)
    if (!intercambioId || Number.isNaN(intercambioId)) {
      return NextResponse.json({ error: 'ID de intercambio inválido' }, { status: 400 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    console.log('🔍 [Validations API] Consultando validaciones para intercambio:', intercambioId)

    // Consulta directa a la tabla validacion_intercambio
    const { data: validations, error: validationsError } = await supabase
      .from('validacion_intercambio')
      .select('usuario_id, es_exitoso, fecha_validacion')
      .eq('intercambio_id', intercambioId)
      .order('fecha_validacion', { ascending: false })

    if (validationsError) {
      console.error('❌ [Validations API] Error consultando validaciones:', validationsError)
      return NextResponse.json({ error: 'Error consultando validaciones' }, { status: 500 })
    }

    console.log('✅ [Validations API] Validaciones encontradas:', validations?.length || 0)

    return NextResponse.json(validations || [])
  } catch (error) {
    console.error('❌ [Validations API] Error interno:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
