import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
    try {
        const { data, error } = await supabaseServer.from('pg_catalog.pg_tables').select('schemaname').limit(1)
        if (error) throw error
        return NextResponse.json({ ok: true, message: 'Supabase conectado', sample: data })
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
    }
}


