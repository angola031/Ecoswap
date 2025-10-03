import { NextRequest, NextResponse } from 'next/server'
import { acceptExchange } from '@/lib/interactions-queries'
import { getAuthenticatedUserFromToken, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth-helper'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exchangeId = params.id
    const body = await req.json()
    const { location, date, time, notes } = body || {}

    if (!location || !date || !time) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

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
    const result = await acceptExchange(exchangeId, userId, {
      location,
      date,
      time,
      notes
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return createSuccessResponse({ ok: true, data: result.data }, 201)

  } catch (error) {
    console.error('Error en API de aceptar intercambio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
