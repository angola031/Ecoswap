import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Home Stats: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }

        // Obtener total de usuarios activos
        const { count: totalUsers, error: usersError } = await supabase
            .from('usuario')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true)

        if (usersError) {
            console.error('❌ API Home Stats: Error obteniendo usuarios:', usersError)
            return NextResponse.json({ error: usersError.message }, { status: 400 })
        }

        // Obtener total de productos activos y aprobados
        const { count: totalProducts, error: productsError } = await supabase
            .from('producto')
            .select('*', { count: 'exact', head: true })
            .eq('estado_publicacion', 'activo')
            .eq('estado_validacion', 'approved')

        if (productsError) {
            console.error('❌ API Home Stats: Error obteniendo productos:', productsError)
            return NextResponse.json({ error: productsError.message }, { status: 400 })
        }

        // Obtener total de intercambios completados
        const { count: totalExchanges, error: exchangesError } = await supabase
            .from('intercambio')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'completado')

        if (exchangesError) {
            console.error('❌ API Home Stats: Error obteniendo intercambios:', exchangesError)
            return NextResponse.json({ error: exchangesError.message }, { status: 400 })
        }

        // Obtener usuarios activos en los últimos 30 días
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

        const { count: activeUsers, error: activeUsersError } = await supabase
            .from('usuario')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true)
            .not('ultima_conexion', 'is', null)
            .gte('ultima_conexion', thirtyDaysAgoISO)

        if (activeUsersError) {
            console.error('❌ API Home Stats: Error obteniendo usuarios activos:', activeUsersError)
            return NextResponse.json({ error: activeUsersError.message }, { status: 400 })
        }

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers || 0,
                totalProducts: totalProducts || 0,
                totalExchanges: totalExchanges || 0,
                activeUsers: activeUsers || 0
            }
        })

    } catch (error: any) {
        console.error('❌ API Home Stats: Error:', error)
        return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
    }
}
