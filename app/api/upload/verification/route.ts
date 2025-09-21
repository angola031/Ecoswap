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

        // Helper para subir archivos
        const uploadOne = async (file: File, filename: string) => {
            const ab = await file.arrayBuffer()
            const buffer = Buffer.from(ab)
            const path = `validacion/${userId}/${filename}`
            
            console.log(`📤 Subiendo archivo: ${path}`)
            
            // Usar upsert: true para sobrescribir archivos existentes
            const { error: upErr } = await supabaseAdmin.storage
                .from('Ecoswap')
                .upload(path, buffer, { 
                    upsert: true, 
                    contentType: file.type || 'image/jpeg',
                    cacheControl: '3600'
                })
                
            if (upErr) {
                console.error(`❌ Error subiendo archivo ${path}:`, upErr)
                throw new Error(`Error subiendo ${filename}: ${upErr.message}`)
            }
            
            console.log(`✅ Archivo subido correctamente: ${path}`)
            return path
        }

        const paths: Record<string, string> = {}
        paths.cedula_frente = await uploadOne(cedulaFrente, 'cedula_frente.jpg')
        paths.cedula_reverso = await uploadOne(cedulaReverso, 'cedula_reverso.jpg')
        paths.selfie_validacion = await uploadOne(selfie, 'selfie_validacion.jpg')

        // Verificar si ya existe una validación para este usuario
        const { data: existingValidation } = await supabaseAdmin
            .from('validacion_usuario')
            .select('validacion_id, estado')
            .eq('usuario_id', Number(userId))
            .eq('tipo_validacion', 'identidad')
            .single()

        const documentos_adjuntos = paths

        if (existingValidation) {
            // Si existe, actualizar la validación existente
            console.log(`📝 Actualizando validación existente ${existingValidation.validacion_id} para usuario ${userId}`)
            
            const { error: updateError } = await supabaseAdmin
                .from('validacion_usuario')
                .update({
                    estado: 'pendiente',
                    documentos_adjuntos,
                    motivo_rechazo: null,
                    notas_admin: null,
                    fecha_solicitud: new Date().toISOString(),
                    fecha_revision: null,
                    fecha_aprobacion: null,
                    fecha_expiracion: null,
                    admin_validador_id: null
                })
                .eq('validacion_id', existingValidation.validacion_id)

            if (updateError) {
                console.error('❌ Error actualizando validación existente:', updateError)
                throw new Error('Error actualizando validación existente')
            }

            console.log(`✅ Validación ${existingValidation.validacion_id} actualizada correctamente`)
        } else {
            // Si no existe, crear una nueva validación
            console.log(`📝 Creando nueva validación para usuario ${userId}`)
            
            const { error: insertError } = await supabaseAdmin
                .from('validacion_usuario')
                .insert({
                    usuario_id: Number(userId),
                    tipo_validacion: 'identidad',
                    estado: 'pendiente',
                    documentos_adjuntos,
                    motivo_rechazo: null,
                    fecha_solicitud: new Date().toISOString(),
                    fecha_revision: null,
                    fecha_aprobacion: null,
                    fecha_expiracion: null
                })

            if (insertError) {
                console.error('❌ Error creando nueva validación:', insertError)
                throw new Error('Error creando nueva validación')
            }

            console.log(`✅ Nueva validación creada correctamente`)
        }

        // Actualizar el usuario para marcar que tiene validación pendiente
        await supabaseAdmin
            .from('usuario')
            .update({ 
                pediente_validacion: true
            })
            .eq('user_id', userId)

        return NextResponse.json({ ok: true, paths })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


