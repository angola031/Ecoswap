import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserFromToken, createAuthErrorResponse, createSuccessResponse } from '@/lib/auth-helper'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 DEBUG: Testing authentication endpoint')
    console.log('🔍 DEBUG: Environment variables:')
    console.log('  - SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('  - SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')

    // Verificar autenticación
    const authHeader = req.headers.get('authorization')
    console.log('🔍 DEBUG: Authorization header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      console.log('❌ ERROR: No authorization header provided')
      return createAuthErrorResponse('Token de autorización requerido')
    }

    console.log('🔍 DEBUG: Token starts with Bearer:', authHeader.startsWith('Bearer '))
    console.log('🔍 DEBUG: Token length:', authHeader.length)

    console.log('🔍 DEBUG: Validating token...')
    const { user, error: authError } = await getAuthenticatedUserFromToken(authHeader)
    
    if (authError || !user) {
      console.log('❌ ERROR: Authentication failed:', authError)
      return createAuthErrorResponse(authError || 'Usuario no autorizado')
    }

    console.log('✅ DEBUG: User authenticated successfully')
    console.log('✅ DEBUG: User ID:', user.user_id)
    console.log('✅ DEBUG: User email:', user.email)

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
