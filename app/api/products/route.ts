import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data } = await supabaseAdmin.auth.getUser(token)
    return data?.user || null
}

export async function POST(req: NextRequest) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await req.json().catch(() => ({}))

        const {
            categoria_id,
            ubicacion_id,
            titulo,
            descripcion,
            estado, // 'usado' | 'para_repuestos'
            tipo_transaccion, // 'intercambio' | 'venta' | 'donacion'
            precio,
            precio_negociable,
            condiciones_intercambio,
            que_busco_cambio,
            fecha_vencimiento
        } = body || {}

        if (!titulo || !descripcion || !tipo_transaccion) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
        }

        // Resolver usuario y verificar verificación
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, verificado, activo')
            .eq('email', user.email)
            .single()
        if (!u || !u.activo) return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 })
        if (!u.verificado) return NextResponse.json({ error: 'Cuenta no verificada. Verifica tu identidad para publicar productos.' }, { status: 403 })

        const payload: any = {
            user_id: u.user_id,
            categoria_id: categoria_id || null,
            ubicacion_id: ubicacion_id || null,
            titulo,
            descripcion,
            estado: estado || 'usado',
            tipo_transaccion,
            precio: tipo_transaccion === 'venta' ? precio : null,
            precio_negociable: !!precio_negociable,
            condiciones_intercambio: condiciones_intercambio || null,
            que_busco_cambio: tipo_transaccion === 'intercambio' ? (que_busco_cambio || null) : null,
            estado_publicacion: 'activo',
            fecha_vencimiento: fecha_vencimiento || null
        }

        const { data: created, error } = await supabaseAdmin
            .from('producto')
            .insert(payload)
            .select()
            .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true, producto: created })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


