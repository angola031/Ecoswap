import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'




const supabase = getSupabaseClient()

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data } = await supabase.auth.getUser(token)
    return data?.user || null
}

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const chatId = Number(params.chatId)
        if (!chatId) return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 })

        const { data: u } = await supabase
            .from('usuario')
            .select('user_id')
            .eq('email', user.email)
            .single()
        if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // Marcar como leídos los mensajes de otros usuarios en este chat
        const { error } = await supabase
            .from('mensaje')
            .update({ leido: true, fecha_lectura: new Date().toISOString() })
            .eq('chat_id', chatId)
            .neq('usuario_id', u.user_id)
            .eq('leido', false)

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}



