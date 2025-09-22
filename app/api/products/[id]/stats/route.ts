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

        // Obtener estadísticas del producto
        const { data: stats, error } = await supabaseAdmin.rpc('get_product_stats', {
            p_producto_id: parseInt(productId)
        })

        if (error) {
            console.error('Error obteniendo estadísticas:', error)
            return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 400 })
        }

        const productStats = stats?.[0] || {
            total_vistas: 0,
            total_likes: 0,
            total_interacciones: 0,
            ultima_actividad: null
        }

        return NextResponse.json({ 
            stats: {
                views: productStats.total_vistas,
                likes: productStats.total_likes,
                interactions: productStats.total_interacciones,
                lastActivity: productStats.ultima_actividad
            }
        })

    } catch (error: any) {
        console.error('Error en API de estadísticas:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}
