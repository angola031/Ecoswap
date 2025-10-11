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
        const { puntuacion, comentario, aspectos_destacados, recomendaria, es_publica } = body || {}

        if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
            return NextResponse.json({ error: 'Puntuación inválida (1-5)' }, { status: 400 })
        }

        // Resolver usuario actual en tabla USUARIO
        const { data: u, error: eu } = await supabaseAdmin
            .from('usuario')
            .select('user_id, activo')
            .eq('email', user.email)
            .single()
        if (eu) return NextResponse.json({ error: eu.message }, { status: 500 })
        if (!u || !u.activo) return NextResponse.json({ error: 'Cuenta inactiva' }, { status: 403 })

        // Traer intercambio y validar participación
        const { data: it, error: eit } = await supabaseAdmin
            .from('intercambio')
            .select('*')
            .eq('intercambio_id', intercambioId)
            .single()
        if (eit) return NextResponse.json({ error: eit.message }, { status: 500 })
        if (!it) return NextResponse.json({ error: 'Intercambio no existe' }, { status: 404 })

        const isProponente = it.usuario_propone_id === u.user_id
        const isReceptor = it.usuario_recibe_id === u.user_id
        if (!isProponente && !isReceptor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        if (it.estado !== 'completado') {
            return NextResponse.json({ error: 'Solo se puede calificar un intercambio completado' }, { status: 400 })
        }

        const calificadorId = u.user_id
        const calificadoId = isProponente ? it.usuario_recibe_id : it.usuario_propone_id

        // Upsert de calificación (permite actualizar si ya existe)
        const { error: ec } = await supabaseAdmin
            .from('calificacion')
            .upsert({
                intercambio_id: intercambioId,
                calificador_id: calificadorId,
                calificado_id: calificadoId,
                puntuacion,
                comentario: comentario || null,
                aspectos_destacados: aspectos_destacados || null,
                recomendaria: typeof recomendaria === 'boolean' ? recomendaria : null,
                es_publica: typeof es_publica === 'boolean' ? es_publica : true
            }, { onConflict: 'intercambio_id,calificador_id' })
        if (ec) return NextResponse.json({ error: ec.message }, { status: 400 })

        // Recalcular calificacion_promedio del usuario calificado
        const { data: stats, error: es } = await supabaseAdmin
            .from('calificacion')
            .select('puntuacion', { count: 'exact', head: false })
            .eq('calificado_id', calificadoId)
        if (!es && stats) {
            const total = stats.length
            const sum = stats.reduce((acc: number, r: any) => acc + (r.puntuacion || 0), 0)
            const promedio = total > 0 ? Math.round((sum / total) * 100) / 100 : 0
            await supabaseAdmin
                .from('usuario')
                .update({ calificacion_promedio: promedio })
                .eq('user_id', calificadoId)

            // Otorgar insignias basadas en calificación
            // 5 Stars: calificación perfecta con mínimo 10 reseñas
            if (promedio === 5 && total >= 10) {
                const { data: ins } = await supabaseAdmin
                    .from('insignia')
                    .select('insignia_id')
                    .eq('nombre', '5 Stars')
                    .single()
                if (ins?.insignia_id) {
                    await supabaseAdmin
                        .from('usuario_insignia')
                        .upsert({ usuario_id: calificadoId, insignia_id: ins.insignia_id })
                }
            }

            // Confiable: verificado + 0 reportes + 5+ intercambios
            const [{ data: usr }, { data: reportes }, { data: intercambiosCount }] = await Promise.all([
                supabaseAdmin.from('usuario').select('verificado').eq('user_id', calificadoId).single(),
                supabaseAdmin.from('reporte').select('reporte_id', { head: false, count: 'exact' }).eq('reportado_usuario_id', calificadoId).eq('estado', 'resuelto'),
                supabaseAdmin.from('intercambio').select('intercambio_id', { head: false, count: 'exact' }).or(`usuario_propone_id.eq.${calificadoId},usuario_recibe_id.eq.${calificadoId}`).eq('estado', 'completado')
            ])
            const numReportes = (reportes as any)?.length ?? 0
            const numIntercambios = (intercambiosCount as any)?.length ?? 0
            if (usr?.verificado && numReportes === 0 && numIntercambios >= 5) {
                const { data: ins2 } = await supabaseAdmin
                    .from('insignia')
                    .select('insignia_id')
                    .eq('nombre', 'Confiable')
                    .single()
                if (ins2?.insignia_id) {
                    await supabaseAdmin
                        .from('usuario_insignia')
                        .upsert({ usuario_id: calificadoId, insignia_id: ins2.insignia_id })
                }
            }
        }

        // Notificar al calificado
        await supabaseAdmin.from('notificacion').insert({
            usuario_id: calificadoId,
            tipo: 'calificacion',
            titulo: 'Has recibido una calificación',
            mensaje: 'Un usuario te ha calificado después de un intercambio.',
            es_push: true,
            es_email: false
        })

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


