import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET() {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            return NextResponse.json({ ok: false, message: 'Supabase no está configurado' }, { status: 500 })
        }
        
        // Verificar conexión con una consulta simple a la tabla usuario
        const { data, error } = await supabase.from('usuario').select('user_id').limit(1)
        if (error) throw error
        return NextResponse.json({ ok: true, message: 'Supabase conectado', sample: data })
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
    }
}


