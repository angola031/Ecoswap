import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function authUser(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return null
    const { data } = await supabaseAdmin.auth.getUser(token)
    return data?.user || null
}

async function userInChat(userId: number, chatId: number) {
    // CHAT -> INTERCAMBIO -> usuarios
    const { data: chat } = await supabaseAdmin
        .from('chat')
        .select('intercambio_id, activo')
        .eq('chat_id', chatId)
        .single()
    if (!chat || chat.activo === false) return false
    const { data: it } = await supabaseAdmin
        .from('intercambio')
        .select('usuario_propone_id, usuario_recibe_id')
        .eq('intercambio_id', chat.intercambio_id)
        .single()
    if (!it) return false
    return it.usuario_propone_id === userId || it.usuario_recibe_id === userId
}

export async function GET(req: NextRequest, { params }: { params: { chatId: string } }) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const chatId = Number(params.chatId)
        if (!chatId) return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 })

        // Resolve usuario_id from USUARIO by email
        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id')
            .eq('email', user.email)
            .single()
        if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const allowed = await userInChat(u.user_id, chatId)
        if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const url = new URL(req.url)
        const limit = Math.min(Number(url.searchParams.get('limit') || '50'), 200)
        const beforeId = url.searchParams.get('beforeId')
        const sinceId = url.searchParams.get('since')

        let query = supabaseAdmin
            .from('mensaje')
            .select(`
                mensaje_id, 
                chat_id, 
                usuario_id, 
                contenido, 
                tipo, 
                archivo_url, 
                leido, 
                fecha_envio,
                fecha_lectura,
                usuario!inner (
                    user_id,
                    nombre,
                    apellido,
                    foto_perfil,
                    activo
                )
            `)
            .eq('chat_id', chatId)
            .order('mensaje_id', { ascending: false })
            .limit(limit)
        
        if (sinceId) {
            // Para polling: obtener mensajes más recientes que sinceId
            query = query.gt('mensaje_id', Number(sinceId))
        } else if (beforeId) {
            // Para paginación: obtener mensajes anteriores a beforeId
            query = query.lt('mensaje_id', Number(beforeId))
        }
        const { data: msgs, error } = await query
        if (error) {
            console.error('❌ [API] Error obteniendo mensajes:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        
        // Transformar los mensajes al formato esperado por el frontend
        const transformedMessages = (msgs || []).reverse().map((msg: any) => ({
          mensaje_id: msg.mensaje_id,
          usuario_id: msg.usuario_id,
          contenido: msg.contenido || '',
          tipo: msg.tipo || 'texto',
          archivo_url: msg.archivo_url || null,
          leido: msg.leido || false,
          fecha_envio: msg.fecha_envio,
          fecha_lectura: msg.fecha_lectura,
          usuario: {
            user_id: msg.usuario?.user_id,
            nombre: msg.usuario?.nombre || 'Usuario',
            apellido: msg.usuario?.apellido || '',
            foto_perfil: msg.usuario?.foto_perfil || null,
            activo: msg.usuario?.activo || false
          }
        }))
        
        
        return NextResponse.json({ items: transformedMessages })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: { chatId: string } }) {
    try {
        const user = await authUser(req)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const chatId = Number(params.chatId)
        if (!chatId) return NextResponse.json({ error: 'Invalid chatId' }, { status: 400 })

        const { data: u } = await supabaseAdmin
            .from('usuario')
            .select('user_id, activo')
            .eq('email', user.email)
            .single()
        if (!u || !u.activo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        const allowed = await userInChat(u.user_id, chatId)
        if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const body = await req.json().catch(() => ({}))
        const { contenido, tipo, archivo_url } = body || {}
        if ((!contenido || typeof contenido !== 'string') && !archivo_url) {
            return NextResponse.json({ error: 'Contenido o archivo requerido' }, { status: 400 })
        }

        const payload: any = {
            chat_id: chatId,
            usuario_id: u.user_id,
            contenido: contenido || null,
            tipo: tipo && ['texto', 'imagen', 'ubicacion'].includes(tipo) ? tipo : (archivo_url ? 'imagen' : 'texto'),
            archivo_url: archivo_url || null,
            leido: false
        }

        const { data: inserted, error } = await supabaseAdmin
            .from('mensaje')
            .insert(payload)
            .select()
            .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })

        await supabaseAdmin.from('chat').update({ ultimo_mensaje: new Date().toISOString() }).eq('chat_id', chatId)

        return NextResponse.json({ ok: true, message: inserted })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}



