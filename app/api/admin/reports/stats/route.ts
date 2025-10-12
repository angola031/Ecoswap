import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Middleware para verificar admin
async function requireAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return { ok: false, error: 'Unauthorized' as const }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data?.user) return { ok: false, error: 'Unauthorized' as const }

    // Verificar admin por DB
    let isAdmin = false
    if (data.user.email) {
        const { data: dbUser } = await supabase
            .from('usuario')
            .select('user_id, es_admin')
            .eq('email', data.user.email)
            .single()
        if (dbUser?.es_admin) isAdmin = true
        else if (dbUser?.user_id) {
            const { data: roles } = await supabase
                .from('usuario_rol')
                .select('rol_id, activo')
                .eq('usuario_id', dbUser.user_id)
                .eq('activo', true)
            if (roles && roles.length > 0) {
                const ids = roles.map(r => r.rol_id)
                const { data: roleNames } = await supabase
                    .from('rol_usuario')
                    .select('rol_id, nombre, activo')
                    .in('rol_id', ids)
                isAdmin = !!(roleNames || []).find(r => r.activo && ['super_admin', 'admin_validacion', 'admin_soporte', 'moderador'].includes((r.nombre || '').toString()))
            }
        }
    }

    if (!isAdmin) return { ok: false, error: 'Forbidden' as const }
    return { ok: true, user: data.user }
}

export async function GET(req: NextRequest) {
    const guard = await requireAdmin(req)
    if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.error === 'Forbidden' ? 403 : 401 })

    try {
        const supabase = getSupabaseClient()
        
        // Estadísticas generales de reportes
        const [
            { count: totalReportes },
            { count: reportesPendientes },
            { count: reportesResueltos },
            { count: reportesDesestimados },
            { count: usuariosSuspendidos },
            { count: usuariosBaneados }
        ] = await Promise.all([
            supabase
                .from('reporte')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('reporte')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'pendiente'),
            supabase
                .from('reporte')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'resuelto'),
            supabase
                .from('reporte')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'desestimado'),
            supabase
                .from('usuario')
                .select('*', { count: 'exact', head: true })
                .eq('activo', false)
                .not('motivo_suspension', 'is', null),
            supabase
                .from('usuario')
                .select('*', { count: 'exact', head: true })
                .eq('activo', false)
                .eq('motivo_suspension', 'baneado')
        ])

        // Usuarios con más reportes
        const { data: usuariosProblematicos } = await supabase
            .from('reporte')
            .select(`
                reportado_usuario_id,
                usuario_reportado:reportado_usuario_id (
                    user_id,
                    nombre,
                    apellido,
                    email,
                    activo
                )
            `)
            .eq('estado', 'pendiente')

        // Contar reportes por usuario
        const reportesPorUsuario = (usuariosProblematicos || []).reduce((acc: Record<number, any>, report) => {
            const userId = report.reportado_usuario_id
            if (!acc[userId]) {
                acc[userId] = {
                    usuario: report.usuario_reportado,
                    totalReportes: 0,
                    reportesRecientes: []
                }
            }
            acc[userId].totalReportes += 1
            return acc
        }, {})

        // Convertir a array y ordenar por cantidad de reportes
        const usuariosConMasReportes = Object.values(reportesPorUsuario)
            .sort((a: any, b: any) => b.totalReportes - a.totalReportes)
            .slice(0, 10)

        // Reportes por tipo
        const { data: reportesPorTipo } = await supabase
            .from('reporte')
            .select('tipo, estado')
            .eq('estado', 'pendiente')

        const tiposReporte = (reportesPorTipo || []).reduce((acc: Record<string, number>, report) => {
            acc[report.tipo] = (acc[report.tipo] || 0) + 1
            return acc
        }, {})

        // Reportes recientes (últimos 7 días)
        const sieteDiasAtras = new Date()
        sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7)

        const { data: reportesRecientes } = await supabase
            .from('reporte')
            .select(`
                reporte_id,
                tipo,
                fecha_reporte,
                usuario_reportado:reportado_usuario_id (
                    nombre,
                    apellido
                )
            `)
            .gte('fecha_reporte', sieteDiasAtras.toISOString())
            .order('fecha_reporte', { ascending: false })
            .limit(20)

        return NextResponse.json({
            estadisticas: {
                totalReportes: totalReportes || 0,
                reportesPendientes: reportesPendientes || 0,
                reportesResueltos: reportesResueltos || 0,
                reportesDesestimados: reportesDesestimados || 0,
                usuariosSuspendidos: usuariosSuspendidos || 0,
                usuariosBaneados: usuariosBaneados || 0
            },
            usuariosProblematicos: usuariosConMasReportes,
            tiposReporte,
            reportesRecientes: reportesRecientes || []
        })

    } catch (error) {
        console.error('Error obteniendo estadísticas de reportes:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

