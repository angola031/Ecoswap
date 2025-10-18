import { NextRequest, NextResponse } from 'next/server'
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


    return createSuccessResponse({
      message: 'Authentication successful',
      user: {
        id: user.user_id,
        name: user.nombre,
        lastName: user.apellido,
        email: user.email,
        verified: user.verificado,
        active: user.activo
      }
    })

  } catch (error) {
    console.error('❌ ERROR: Unexpected error in test-auth:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
