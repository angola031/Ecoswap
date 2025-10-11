import { NextRequest, NextResponse } from 'next/server'

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data } = await supabaseAdmin.auth.getUser(token)
    return data?.user || null
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const intercambioId = Number(params.id)
        if (!intercambioId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

        const body = await req.json().catch(() => ({}))
        const { action, motivo } = body || {}
        if (!['aceptar', 'rechazar', 'cancelar', 'completado'].includes(action)) {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
        }

        // Resolver usuario actual
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, activo')
            .eq('email', user.email)
            .single()
        if (!u || !u.activo) return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 })

        // Traer intercambio
        const { data: it } = await supabaseAdmin
            .from('intercambio')
            .select('*')
            .eq('intercambio_id', intercambioId)
            .single()
        if (!it) return NextResponse.json({ error: 'Intercambio no existe' }, { status: 404 })

        const isProponente = it.usuario_propone_id === u.user_id
        const isReceptor = it.usuario_recibe_id === u.user_id
        if (!isProponente && !isReceptor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // Reglas de acción
        if (action === 'aceptar' && !isReceptor) return NextResponse.json({ error: 'Solo el receptor puede aceptar' }, { status: 403 })
        if (action === 'rechazar' && !isReceptor) return NextResponse.json({ error: 'Solo el receptor puede rechazar' }, { status: 403 })

        if (action === 'aceptar') {
            const { error: e1 } = await supabaseAdmin
                .from('intercambio')
                .update({ estado: 'aceptado', fecha_respuesta: new Date().toISOString(), motivo_rechazo: null })
                .eq('intercambio_id', intercambioId)
            if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })

            await supabaseAdmin.from('notificacion').insert([
                { usuario_id: it.usuario_propone_id, tipo: 'intercambio', titulo: 'Intercambio aceptado', mensaje: 'Tu propuesta fue aceptada.', es_push: true, es_email: false },
                { usuario_id: it.usuario_recibe_id, tipo: 'intercambio', titulo: 'Has aceptado un intercambio', mensaje: 'Aceptaste la propuesta.', es_push: true, es_email: false }
            ])
        }

        if (action === 'rechazar') {
            const { error: e1 } = await supabaseAdmin
                .from('intercambio')
                .update({ estado: 'rechazado', fecha_respuesta: new Date().toISOString(), motivo_rechazo: motivo || null })
                .eq('intercambio_id', intercambioId)
            if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })

            await supabaseAdmin.from('notificacion').insert([
                { usuario_id: it.usuario_propone_id, tipo: 'intercambio', titulo: 'Intercambio rechazado', mensaje: motivo ? `Motivo: ${motivo}` : 'Tu propuesta fue rechazada.', es_push: true, es_email: false },
                { usuario_id: it.usuario_recibe_id, tipo: 'intercambio', titulo: 'Has rechazado un intercambio', mensaje: motivo ? `Motivo: ${motivo}` : 'Has rechazado la propuesta.', es_push: false, es_email: false }
            ])
        }

        if (action === 'cancelar') {
            // Cualquiera de los dos puede cancelar si está pendiente o aceptado
            if (!['pendiente', 'aceptado'].includes(it.estado)) return NextResponse.json({ error: 'No se puede cancelar en este estado' }, { status: 400 })
            const { error: e1 } = await supabaseAdmin
                .from('intercambio')
                .update({ estado: 'cancelado' })
                .eq('intercambio_id', intercambioId)
            if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })

            const otro = isProponente ? it.usuario_recibe_id : it.usuario_propone_id
            await supabaseAdmin.from('notificacion').insert([
                { usuario_id: otro, tipo: 'intercambio', titulo: 'Intercambio cancelado', mensaje: 'La otra parte canceló el intercambio.', es_push: true, es_email: false }
            ])
        }

        if (action === 'completado') {
            // Cualquiera de los dos puede marcar completado si fue aceptado
            if (it.estado !== 'aceptado') return NextResponse.json({ error: 'El intercambio debe estar aceptado' }, { status: 400 })
            const { error: e1 } = await supabaseAdmin
                .from('intercambio')
                .update({ estado: 'completado', fecha_completado: new Date().toISOString() })
                .eq('intercambio_id', intercambioId)
            if (e1) return NextResponse.json({ error: e1.message }, { status: 400 })

            // Actualizar estado de productos a 'intercambiado'
            if (it.producto_solicitado_id) {
                await supabaseAdmin.from('producto').update({ estado_publicacion: 'intercambiado' }).eq('producto_id', it.producto_solicitado_id)
            }
            if (it.producto_ofrecido_id) {
                await supabaseAdmin.from('producto').update({ estado_publicacion: 'intercambiado' }).eq('producto_id', it.producto_ofrecido_id)
            }

            await supabaseAdmin.from('notificacion').insert([
                { usuario_id: it.usuario_propone_id, tipo: 'intercambio', titulo: 'Intercambio completado', mensaje: '¡El intercambio fue completado!', es_push: true, es_email: false },
                { usuario_id: it.usuario_recibe_id, tipo: 'intercambio', titulo: 'Intercambio completado', mensaje: '¡El intercambio fue completado!', es_push: true, es_email: false }
            ])

            // Incrementar conteo de intercambios y otorgar insignia Eco Warrior (20+)
            const participantes = [it.usuario_propone_id, it.usuario_recibe_id]
            for (const uid of participantes) {
                // Incremento seguro: obtener total y sumar 1
                const { data: stats } = await supabaseAdmin
                    .from('intercambio')
                    .select('intercambio_id', { head: false, count: 'exact' })
                    .or(`usuario_propone_id.eq.${uid},usuario_recibe_id.eq.${uid}`)
                    .eq('estado', 'completado')
                const total = (stats as any)?.length ?? 0
                await supabaseAdmin.from('usuario').update({ total_intercambios: total }).eq('user_id', uid)

                if (total >= 20) {
                    const { data: ins } = await supabaseAdmin
                        .from('insignia')
                        .select('insignia_id')
                        .eq('nombre', 'Eco Warrior')
                        .single()
                    if (ins?.insignia_id) {
                        await supabaseAdmin
                            .from('usuario_insignia')
                            .upsert({ usuario_id: uid, insignia_id: ins.insignia_id })
                    }
                }
            }
        }

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


