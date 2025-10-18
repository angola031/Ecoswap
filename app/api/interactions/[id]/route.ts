import { NextRequest, NextResponse } from 'next/server'
import { InteractionDetail } from '@/lib/types/interactions'
import { getInteractionDetail } from '@/lib/interactions-queries'
import { getAuthenticatedUserFromToken, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth-helper'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interactionId = params.id

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
    const result = await getInteractionDetail(interactionId, userId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return createSuccessResponse(result.data)

  } catch (error) {
    console.error('Error en API de detalle de interacción:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
