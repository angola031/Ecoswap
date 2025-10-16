import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
    try {
        // Verificar que las variables de entorno estén disponibles
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            console.error('❌ NEXT_PUBLIC_SUPABASE_URL faltante')
            return NextResponse.json({ error: 'Configuración del servidor incompleta: URL faltante' }, { status: 500 })
        }

        if (!process.env.ROLE_KEY) {
            console.error('❌ ROLE_KEY faltante')
            return NextResponse.json({ error: 'Configuración del servidor incompleta: ROLE_KEY faltante. Verifica las variables de entorno en Vercel.' }, { status: 500 })
        }

        console.log('✅ Variables de entorno verificadas correctamente')

        const supabase = getSupabaseClient()
        
        // Crear cliente administrativo con ROLE_KEY para operaciones que requieren permisos elevados
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const { data: userInfo, error: userErr } = await supabase.auth.getUser(token)
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
        const { data: dbUser, error: dbErr } = await supabase
            .from('usuario')
            .select('user_id, email')
            .eq('user_id', userId)
            .single()

        if (dbErr || !dbUser || dbUser.email !== userInfo.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Helper para subir archivos
        const uploadOne = async (file: File, filename: string) => {
            try {
                const ab = await file.arrayBuffer()
                const buffer = Buffer.from(ab)
                const path = `validacion/${userId}/${filename}`
                
                console.log(`📤 Subiendo archivo: ${path}`)
                
                // Usar upsert: true para sobrescribir archivos existentes
                const { error: upErr } = await supabase.storage
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
                
                console.log(`✅ Archivo subido exitosamente: ${path}`)
                return path
            } catch (error) {
                console.error(`❌ Error en uploadOne para ${filename}:`, error)
                throw new Error(`Error procesando ${filename}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            }
        }

        const paths: Record<string, string> = {}
        paths.cedula_frente = await uploadOne(cedulaFrente, 'cedula_frente.jpg')
        paths.cedula_reverso = await uploadOne(cedulaReverso, 'cedula_reverso.jpg')
        paths.selfie_validacion = await uploadOne(selfie, 'selfie_validacion.jpg')

        // Verificar si ya existe una validación para este usuario
        const { data: existingValidation, error: validationCheckError } = await supabaseAdmin
            .from('validacion_usuario')
            .select('validacion_id, estado')
            .eq('usuario_id', Number(userId))
            .eq('tipo_validacion', 'identidad')
            .single()

        // Si no hay datos pero tampoco hay error, significa que no existe la validación
        if (validationCheckError && validationCheckError.code !== 'PGRST116') {
            console.error('❌ Error verificando validación existente:', validationCheckError)
            return NextResponse.json({ error: 'Error verificando validación existente' }, { status: 500 })
        }

        const documentos_adjuntos = paths

        if (existingValidation) {
            // Si existe, actualizar la validación existente usando cliente administrativo
            
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

        } else {
            // Si no existe, crear una nueva validación usando cliente administrativo
            
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

        }

        // Actualizar el usuario para marcar que tiene validación pendiente usando cliente administrativo
        const { error: userUpdateError } = await supabaseAdmin
            .from('usuario')
            .update({ 
                pediente_validacion: true
            })
            .eq('user_id', userId)

        if (userUpdateError) {
            console.error('❌ Error actualizando usuario:', userUpdateError)
            // No fallar el proceso completo por este error
        }

        console.log('✅ Verificación completada exitosamente')
        return NextResponse.json({ 
            ok: true, 
            paths,
            message: 'Archivos subidos y validación creada exitosamente'
        })
    } catch (e: any) {
        console.error('❌ Error general en API de verificación:', e)
        
        // Asegurar que siempre devolvemos JSON válido
        const errorMessage = e?.message || 'Error interno del servidor'
        const errorDetails = {
            error: errorMessage,
            timestamp: new Date().toISOString(),
            path: '/api/upload/verification'
        }
        
        return NextResponse.json(errorDetails, { status: 500 })
    }
}


