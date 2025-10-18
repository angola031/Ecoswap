import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-client'

// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 API Reset Password: Iniciando...')
    
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }
    
    // Usar cliente admin con service role key
    const supabase = getSupabaseAdminClient()
    if (!supabase) {
      console.error('❌ API Reset Password: No se pudo crear cliente admin')
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }
    
    console.log('✅ API Reset Password: Cliente admin creado correctamente')
    console.log('📧 API Reset Password: Enviando email a:', email)
    
    // URL de redirección hardcodeada para Vercel
    const siteUrl = 'https://ecoswap-lilac.vercel.app'
    const redirectUrl = `${siteUrl}/auth/callback?next=/auth/reset-password`
    
    console.log('🔗 API Reset Password: URL de redirección:', redirectUrl)
    
    // Enviar email de restablecimiento usando service role key
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirectUrl
      }
    )
    
    if (error) {
      console.error('❌ API Reset Password: Error enviando email:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    console.log('✅ API Reset Password: Email enviado exitosamente')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email de restablecimiento enviado correctamente' 
    })
    
  } catch (error) {
    console.error('❌ API Reset Password: Error interno:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
