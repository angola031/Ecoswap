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
        console.log('🛒 API Products: Iniciando creación de producto')
        
        const user = await authUser(req)
        if (!user) {
            console.error('❌ API Products: Usuario no autenticado')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.log('✅ API Products: Usuario autenticado:', user.email)
        
        const body = await req.json().catch(() => ({}))
        console.log('📦 API Products: Datos recibidos:', body)

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
            estado_validacion: 'pending', // Todos los productos nuevos requieren validación
            fecha_vencimiento: fecha_vencimiento || null
        }

        console.log('💾 API Products: Insertando producto en BD:', payload)
        
        const { data: created, error } = await supabaseAdmin
            .from('producto')
            .insert(payload)
            .select()
            .single()
            
        if (error) {
            console.error('❌ API Products: Error insertando producto:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        console.log('✅ API Products: Producto creado exitosamente:', created)
        
        const response = { ok: true, producto: created }
        console.log('📤 API Products: Enviando respuesta:', response)
        
        return NextResponse.json(response)
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


