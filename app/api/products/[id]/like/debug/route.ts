import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 DEBUG - Verificando configuración...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client no disponible',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Presente' : 'Ausente'
      }, { status: 500 })
    }

    const productoId = Number(params.id)
    
    // Verificar autenticación
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    
    const debugInfo: any = {
      productoId,
      isProductIdValid: !isNaN(productoId) && productoId > 0,
      hasAuthHeader: !!auth,
      hasToken: !!token,
      tokenLength: token.length,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    if (token) {
      try {
        const { data, error } = await supabase.auth.getUser(token)
        debugInfo.authUser = data?.user?.id || null
        debugInfo.authError = error?.message || null
      } catch (authError: any) {
        debugInfo.authError = authError.message
      }
    }

    return NextResponse.json(debugInfo)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      stack: e?.stack 
    }, { status: 500 })
  }
}
