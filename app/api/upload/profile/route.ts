import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const MAX_BYTES = 2 * 1024 * 1024 // 2MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const accessToken = authHeader.split(' ')[1]
        // Validar usuario a partir del token
        const { data: userInfo, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)
        if (userErr || !userInfo?.user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const form = await req.formData()
        const file = form.get('file') as File | null
        const userId = form.get('userId') as string | null

        if (!file || !userId) {
            return NextResponse.json({ error: 'file and userId are required' }, { status: 400 })
        }

        // Validaciones de archivo
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de archivo no permitido (usa JPG o PNG)' }, { status: 400 })
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'El archivo supera 2MB. Reduce o comprime la imagen.' }, { status: 400 })
        }

        // Verificar que el userId pertenezca al email del token
        const { data: dbUser, error: dbErr } = await supabaseAdmin
            .from('usuario')
            .select('user_id, email')
            .eq('user_id', userId)
            .single()

        if (dbErr || !dbUser || dbUser.email !== userInfo.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const path = `usuarios/${userId}/perfil.jpg`
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabaseAdmin.storage
            .from('Ecoswap')
            .upload(path, buffer, { upsert: true, contentType: file.type || 'image/jpeg' })

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 400 })
        }

        const { data: urlData } = supabaseAdmin.storage.from('Ecoswap').getPublicUrl(path)
        const publicUrl = urlData?.publicUrl || null

        // Actualizar foto_perfil
        await supabaseAdmin
            .from('usuario')
            .update({ foto_perfil: publicUrl })
            .eq('user_id', userId)

        return NextResponse.json({ ok: true, path, publicUrl })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


