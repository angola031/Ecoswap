import { NextRequest, NextResponse } from 'next/server'
import { cancelExchange } from '@/lib/interactions-queries'
import { getAuthenticatedUserFromToken, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth-helper'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exchangeId = params.id
    const body = await req.json()
    const { reason } = body || {}

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
    const result = await cancelExchange(exchangeId, userId, reason)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return createSuccessResponse({ ok: true, data: result.data })

  } catch (error) {
    console.error('Error en API de cancelar intercambio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
