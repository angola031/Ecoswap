import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    
    const supabase = getSupabaseClient()
    const { data } = await supabase.auth.getUser(token)
    return data?.user || null
}

export async function POST(req: NextRequest) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const supabase = getSupabaseClient()
        const body = await req.json().catch(() => ({}))
        const { producto_id } = body || {}
        if (!producto_id) return NextResponse.json({ error: 'producto_id requerido' }, { status: 400 })

        const { data: u } = await supabase
            .from('usuario')
            .select('user_id, verificado, activo')
            .eq('email', user.email)
            .single()
        if (!u || !u.activo) return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 })
        if (!u.verificado) return NextResponse.json({ error: 'Cuenta no verificada. Verifica tu identidad para comprar/obtener productos.' }, { status: 403 })

        const { data: prod } = await supabase
            .from('producto')
            .select('producto_id, user_id, estado_publicacion, tipo_transaccion, precio')
            .eq('producto_id', producto_id)
            .single()
        if (!prod) return NextResponse.json({ error: 'Producto no existe' }, { status: 400 })
        if (prod.estado_publicacion !== 'activo') return NextResponse.json({ error: 'Producto no disponible' }, { status: 400 })
        if (prod.user_id === u.user_id) return NextResponse.json({ error: 'No puedes comprar/obtener tu propio producto' }, { status: 400 })

        // Aquí iría la lógica de pago/reserva. Por ahora, solo respuesta de validación OK
        return NextResponse.json({ ok: true, producto: { id: prod.producto_id, tipo: prod.tipo_transaccion, precio: prod.precio } })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}



