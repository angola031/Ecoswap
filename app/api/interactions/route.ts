import { NextRequest, NextResponse } from 'next/server'
import { InteractionSummary, InteractionsResponse, InteractionStats, InteractionFilters } from '@/lib/types/interactions'
import { getInteractions } from '@/lib/interactions-queries'
import { getAuthenticatedUserFromToken, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth-helper'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      return createAuthErrorResponse('Token de autorización requerido')
    }

    const { user, error: authError } = await getAuthenticatedUserFromToken(authHeader)
    
    if (authError || !user) {
      return createAuthErrorResponse(authError || 'Usuario no autorizado')
    }


    const userId = user.user_id

    // Obtener parámetros de consulta
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Construir filtros
    const filters: InteractionFilters = {}
    if (status && status !== 'all') {
      filters.status = status as any
    }
    if (type) {
      filters.type = type as any
    }
    if (search) {
      filters.search = search
    }
    if (dateFrom) {
      filters.dateFrom = dateFrom
    }
    if (dateTo) {
      filters.dateTo = dateTo
    }

    // Usar la función de consulta optimizada
    const result = await getInteractions(userId, filters, page, limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return createSuccessResponse(result.data)

  } catch (error) {
    console.error('Error en API de interacciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
