import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Categorías: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }

        // Obtener todas las categorías activas
        const { data: categorias, error } = await supabase
            .from('categoria')
            .select('categoria_id, nombre, descripcion, icono')
            .eq('activa', true)
            .order('nombre', { ascending: true })

        if (error) {
            console.error('❌ API Categorías: Error obteniendo categorías:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({
            categorias: categorias || []
        })

    } catch (error: any) {
        console.error('❌ API Categorías: Error:', error)
        return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
    }
}
