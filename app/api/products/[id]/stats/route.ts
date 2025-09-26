import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const productId = params.id

        if (!productId) {
            return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
        }

        // Sumar visualizaciones según el esquema actual (estadistica_producto por día) + columna producto.visualizaciones
        const { data: prodRow } = await supabaseAdmin
            .from('producto')
            .select('visualizaciones')
            .eq('producto_id', Number(productId))
            .single()

        const baseViews = Number((prodRow as any)?.visualizaciones ?? 0)

        const { data: dailyRows } = await supabaseAdmin
            .from('estadistica_producto')
            .select('visualizaciones_dia')
            .eq('producto_id', Number(productId))

        const sumDailyViews = Array.isArray(dailyRows)
            ? dailyRows.reduce((acc: number, r: any) => acc + Number(r?.visualizaciones_dia ?? 0), 0)
            : 0

        // Likes desde la tabla favorito
        const { count: likesCount } = await supabaseAdmin
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
