import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const { data: userInfo, error: userErr } = await supabaseAdmin.auth.getUser(token)
        if (userErr || !userInfo?.user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const form = await req.formData()
        const userId = form.get('userId') as string | null
        const cedulaFrente = form.get('cedula_frente') as File | null
        const cedulaReverso = form.get('cedula_reverso') as File | null
        const selfie = form.get('selfie_validacion') as File | null

        if (!userId || !cedulaFrente || !cedulaReverso || !selfie) {
            return NextResponse.json({ error: 'Faltan archivos o userId' }, { status: 400 })
        }

        // Validar pertenencia del usuario
        const { data: dbUser, error: dbErr } = await supabaseAdmin
            .from('usuario')
            .select('user_id, email')
            .eq('user_id', userId)
            .single()

        if (dbErr || !dbUser || dbUser.email !== userInfo.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Helper para subir
        const uploadOne = async (file: File, filename: string) => {
            const ab = await file.arrayBuffer()
            const buffer = Buffer.from(ab)
            const path = `validacion/${userId}/${filename}`
            const { error: upErr } = await supabaseAdmin.storage
                .from('Ecoswap')
                .upload(path, buffer, { upsert: true, contentType: file.type || 'image/jpeg' })
            if (upErr) throw new Error(upErr.message)
            return path
        }

        const paths: Record<string, string> = {}
        paths.cedula_frente = await uploadOne(cedulaFrente, 'cedula_frente.jpg')
        paths.cedula_reverso = await uploadOne(cedulaReverso, 'cedula_reverso.jpg')
        paths.selfie_validacion = await uploadOne(selfie, 'selfie_validacion.jpg')

        // Registrar/actualizar solicitud en VALIDACION_USUARIO (estado pendiente)
        const documentos_adjuntos = paths
        await supabaseAdmin
            .from('validacion_usuario')
            .upsert({
                usuario_id: Number(userId),
                tipo_validacion: 'identidad',
                estado: 'pendiente',
                documentos_adjuntos,
                motivo_rechazo: null,
                fecha_solicitud: new Date().toISOString(),
                fecha_revision: null,
                fecha_aprobacion: null,
                fecha_expiracion: null
            }, { onConflict: 'usuario_id,tipo_validacion' })

        // Actualizar el usuario para marcar que tiene validación pendiente
        await supabaseAdmin
            .from('usuario')
            .update({ 
                pediente_validacion: true,
                fecha_subida_verificacion: new Date().toISOString()
            })
            .eq('user_id', userId)

        return NextResponse.json({ ok: true, paths })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


