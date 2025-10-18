import { NextRequest, NextResponse } from 'next/server'
import { getSystemEvents } from '@/lib/interactions-queries'
import { getAuthenticatedUserFromToken, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth-helper'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


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
    const limit = parseInt(searchParams.get('limit') || '20')

    // Usar la función de consulta optimizada
    const result = await getSystemEvents(userId, limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return createSuccessResponse({ events: result.data })

  } catch (error) {
    console.error('Error en API de eventos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
