import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    
    const supabase = getSupabaseClient()
    if (!supabase) {
        console.error('❌ API Products: Supabase no está configurado')
        return null
    }
    
    const { data } = await supabase.auth.getUser(token)
    return data?.user || null
}

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Products: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }
        
        const user = await authUser(req)
        if (!user) {
            console.error('❌ API Products: Usuario no autenticado')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        
        const body = await req.json().catch(() => ({}))

        const {
            categoria_id,
            categoria_nombre,
            ubicacion_id,
            titulo,
            descripcion,
            estado, // 'usado' | 'para_repuestos'
            tipo_transaccion, // 'intercambio' | 'venta' | 'donacion'
            precio,
            precio_negociable,
            condiciones_intercambio,
            que_busco_cambio,
            fecha_vencimiento,
            etiquetas, // array de strings o string separado por comas
            especificaciones // objeto { clave: valor }
        } = body || {}

        if (!titulo || !descripcion || !tipo_transaccion) {
            return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
        }

        // Resolver usuario y verificar verificación
        const { data: u } = await supabase
            .from('usuario')
            .select('user_id, verificado, activo')
            .eq('email', user.email)
            .single()
        if (!u || !u.activo) return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 })
        if (!u.verificado) return NextResponse.json({ error: 'Cuenta no verificada. Verifica tu identidad para publicar productos.' }, { status: 403 })

        // Enfoque híbrido: si llega ubicacion_id, copiar snapshot (ciudad/departamento/lat/long)
        let ciudad_snapshot: string | null = null
        let departamento_snapshot: string | null = null
        let latitud_snapshot: number | null = null
        let longitud_snapshot: number | null = null

        if (ubicacion_id) {
            const { data: ub } = await supabase
                .from('ubicacion')
                .select('ciudad, departamento, latitud, longitud')
                .eq('ubicacion_id', ubicacion_id)
                .single()
            if (ub) {
                ciudad_snapshot = ub.ciudad || null
                departamento_snapshot = ub.departamento || null
                latitud_snapshot = (ub.latitud as any) ?? null
                longitud_snapshot = (ub.longitud as any) ?? null
            }
        }

        // Resolver categoria_id si solo llega categoria_nombre
        let resolvedCategoriaId: number | null = categoria_id || null
        try {
            if (!resolvedCategoriaId && categoria_nombre && typeof categoria_nombre === 'string') {
                const nombreCat = categoria_nombre.trim()
                if (nombreCat.length > 0) {
                    // Intentar insertar; si ya existe por UNIQUE(nombre), ignorar error duplicado
                    const insertRes = await supabase
                        .from('categoria')
                        .insert({ nombre: nombreCat })
                        .select('categoria_id, nombre')
                        .single()
                    if (insertRes.data?.categoria_id) {
                        resolvedCategoriaId = insertRes.data.categoria_id
                    } else {
                        // Buscar existente
                        const { data: existing } = await supabase
                            .from('categoria')
                            .select('categoria_id')
                            .eq('nombre', nombreCat)
                            .single()
                        resolvedCategoriaId = existing?.categoria_id ?? null
                    }
                }
            }
        } catch (catErr) {
            console.warn('⚠️ API Products: no se pudo resolver categoria:', catErr)
        }

        // Para tipo 'intercambio', asegurar que que_busco_cambio tenga un valor válido si viene
        // Si tipo es 'intercambio' y que_busco_cambio está vacío/null, usar valor por defecto
        let queBuscoCambioFinal = que_busco_cambio
        if (tipo_transaccion === 'intercambio') {
            if (!queBuscoCambioFinal || queBuscoCambioFinal.trim() === '') {
                queBuscoCambioFinal = 'Productos de interés'
            }
        }

        const payload: any = {
            user_id: u.user_id,
            categoria_id: resolvedCategoriaId || null,
            ubicacion_id: ubicacion_id || null,
            titulo,
            descripcion,
            estado: estado || 'usado',
            tipo_transaccion,
            // Permitir precio cuando es venta, o cuando es intercambio pero viene precio (caso 'both')
            precio: (tipo_transaccion === 'venta' || (tipo_transaccion === 'intercambio' && precio)) ? precio : null,
            precio_negociable: !!precio_negociable,
            condiciones_intercambio: condiciones_intercambio || null,
            que_busco_cambio: tipo_transaccion === 'intercambio' ? queBuscoCambioFinal : null,
            estado_publicacion: 'activo',
            estado_validacion: 'pending', // Todos los productos nuevos requieren validación
            fecha_vencimiento: fecha_vencimiento || null,
            ciudad_snapshot,
            departamento_snapshot,
            latitud_snapshot,
            longitud_snapshot
        }

        
        const { data: created, error } = await supabase
            .from('producto')
            .insert(payload)
            .select()
            .single()
            
        if (error) {
            console.error('❌ API Products: Error insertando producto:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        
        // Guardar etiquetas normalizadas si vienen
        try {
            const tagsArray: string[] = Array.isArray(etiquetas)
                ? etiquetas
                : (typeof etiquetas === 'string' ? etiquetas.split(',') : [])
            const cleanTags = tagsArray
                .map((t: string) => (t || '').trim())
                .filter((t: string) => t.length > 0)
            if (cleanTags.length > 0) {
                // Insertar catálogo
                const unique = Array.from(new Set(cleanTags))
                await supabase.from('tag').insert(unique.map(n => ({ nombre: n }))).select()
                    .then(async (res) => {
                        if (res.error && !String(res.error.message).includes('duplicate')) throw res.error
                        // Obtener ids
                        const { data: existing } = await supabase
                            .from('tag')
                            .select('tag_id, nombre')
                            .in('nombre', unique)
                        const tagIds = (existing || []).map((r: any) => r.tag_id)
                        if (tagIds.length > 0) {
                            await supabase.from('producto_tag').insert(
                                tagIds.map((id: number) => ({ producto_id: created.producto_id, tag_id: id }))
                            )
                        }
                    })
            }
        } catch (tagErr) {
            console.warn('⚠️ API Products: no se guardaron etiquetas:', tagErr)
        }

        // Guardar especificaciones normalizadas si vienen
        try {
            if (especificaciones && typeof especificaciones === 'object') {
                const entries = Object.entries(especificaciones)
                    .filter(([k, v]) => String(k).trim().length > 0 && String(v).trim().length > 0)
                    .map(([k, v]) => ({ producto_id: created.producto_id, clave: String(k).trim(), valor: String(v).trim() }))
                if (entries.length > 0) {
                    await supabase.from('producto_especificacion').insert(entries)
                }
            }
        } catch (specErr) {
            console.warn('⚠️ API Products: no se guardaron especificaciones:', specErr)
        }

        const response = { ok: true, producto: created }
        
        return NextResponse.json(response)
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


