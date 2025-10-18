import { NextRequest, NextResponse } from 'next/server'
import { InteractionStats } from '@/lib/types/interactions'
import { getInteractionStats } from '@/lib/interactions-queries'
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

    // Usar la función de consulta optimizada
    const stats = await getInteractionStats(userId)

    return createSuccessResponse(stats)

  } catch (error) {
    console.error('Error en API de estadísticas de interacciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}