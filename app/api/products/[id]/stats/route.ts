import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Products Stats: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }

        const productId = params.id

        if (!productId) {
            return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
        }

        // Sumar visualizaciones según el esquema actual (estadistica_producto por día) + columna producto.visualizaciones
        const { data: prodRow } = await supabase
            .from('producto')
            .select('visualizaciones')
            .eq('producto_id', Number(productId))
            .single()

        const baseViews = Number((prodRow as any)?.visualizaciones ?? 0)

        const { data: dailyRows } = await supabase
            .from('estadistica_producto')
            .select('visualizaciones_dia')
            .eq('producto_id', Number(productId))

        const sumDailyViews = Array.isArray(dailyRows)
            ? dailyRows.reduce((acc: number, r: any) => acc + Number(r?.visualizaciones_dia ?? 0), 0)
            : 0

        // Likes desde la tabla favorito
        const { count: likesCount } = await supabase
            .from('favorito')
            .select('favorito_id', { count: 'exact', head: true })
            .eq('producto_id', Number(productId))

        // Evitar doble conteo: si mantenemos un contador en producto.visualizaciones,
        // úsalo como fuente principal. Si está en 0 (no usado), caer a la suma diaria.
        const totalViews = baseViews > 0 ? baseViews : sumDailyViews

        return NextResponse.json({
            stats: {
                views: totalViews,
                likes: likesCount ?? 0,
                interactions: (likesCount ?? 0),
                lastActivity: null
            }
        })

    } catch (error: any) {
        console.error('Error en API de estadísticas:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}
