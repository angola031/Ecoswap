import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const tipo_transaccion = searchParams.get('tipo_transaccion')
        const min_price = searchParams.get('min_price')
        const max_price = searchParams.get('max_price')
        const ciudad = searchParams.get('ciudad')

        let query = supabaseAdmin
            .from('productos_publicos')
            .select('*')
            .order('fecha_creacion', { ascending: false })

        // Aplicar filtros
        if (category) {
            query = query.eq('categoria_nombre', category)
        }

        if (tipo_transaccion) {
            query = query.eq('tipo_transaccion', tipo_transaccion)
        }

        if (min_price) {
            query = query.gte('precio', parseFloat(min_price))
        }

        if (max_price) {
            query = query.lte('precio', parseFloat(max_price))
        }

        if (ciudad) {
            query = query.eq('ciudad', ciudad)
        }

        if (search) {
            query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%`)
        }

        // Aplicar paginación
        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data: products, error, count } = await query
            .range(from, to)

        if (error) {
            console.error('Error obteniendo productos públicos:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Obtener el total de productos para paginación
        let totalCount = 0
        if (count === null) {
            const { count: totalCountResult } = await supabaseAdmin
                .from('productos_publicos')
                .select('*', { count: 'exact', head: true })
            totalCount = totalCountResult || 0
        } else {
            totalCount = count
        }

        return NextResponse.json({
            products: products || [],
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        })

    } catch (error: any) {
        console.error('Error en API de productos públicos:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}
