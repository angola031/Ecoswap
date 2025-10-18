import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function PUT(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const jwt = authHeader.split(' ')[1]
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
        }

        const authClient = createClient(supabaseUrl, supabaseAnonKey)
        const { data: userData, error: userErr } = await authClient.auth.getUser(jwt)
        if (userErr || !userData?.user?.email) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
        }

        const body = await req.json()
        const {
            nombre,
            apellido,
            telefono,
            fecha_nacimiento,
            biografia,
            foto_perfil,
            ubicacion,
            configuracion
        } = body || {}

        const admin = getSupabaseAdminClient()
        if (!admin) {
            return NextResponse.json({ error: 'Admin client no disponible' }, { status: 500 })
        }

        // Localizar usuario por email
        const { data: dbUser, error: fetchErr } = await admin
            .from('usuario')
            .select('user_id')
            .eq('email', userData.user.email)
            .single()
        if (fetchErr || !dbUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Actualizar usuario
        const updatePayload: any = {
            nombre: nombre ?? null,
            apellido: apellido ?? null,
            telefono: telefono ?? null,
            fecha_nacimiento: fecha_nacimiento ?? null,
            biografia: biografia ?? null
        }
        if (foto_perfil) updatePayload.foto_perfil = foto_perfil

        const { error: updateUserErr } = await admin
            .from('usuario')
            .update(updatePayload)
            .eq('user_id', dbUser.user_id)
        if (updateUserErr) {
            return NextResponse.json({ error: updateUserErr.message }, { status: 400 })
        }

        // Actualizar o insertar ubicación principal
        if (ubicacion) {
            const { data: principal } = await admin
                .from('ubicacion')
                .select('ubicacion_id')
                .eq('user_id', dbUser.user_id)
                .eq('es_principal', true)
                .single()

            if (principal) {
                await admin
                    .from('ubicacion')
                    .update({
                        ciudad: ubicacion.ciudad ?? null,
                        departamento: ubicacion.departamento ?? null,
                        pais: ubicacion.pais ?? 'Colombia'
                    })
                    .eq('ubicacion_id', principal.ubicacion_id)
            } else if (ubicacion.ciudad || ubicacion.departamento) {
                await admin
                    .from('ubicacion')
                    .insert({
                        user_id: dbUser.user_id,
                        pais: ubicacion.pais ?? 'Colombia',
                        ciudad: ubicacion.ciudad ?? null,
                        departamento: ubicacion.departamento ?? null,
                        es_principal: true
                    })
            }
        }

        // Actualizar configuración
        if (configuracion) {
            const { data: existingConfig } = await admin
                .from('configuracion_usuario')
                .select('usuario_id')
                .eq('usuario_id', dbUser.user_id)
                .single()

            if (existingConfig) {
                await admin
                    .from('configuracion_usuario')
                    .update({
                        notif_nuevas_propuestas: configuracion.notif_nuevas_propuestas,
                        notif_mensajes: configuracion.notif_mensajes,
                        notif_actualizaciones: configuracion.notif_actualizaciones,
                        notif_newsletter: configuracion.notif_newsletter,
                        perfil_publico: configuracion.perfil_publico,
                        mostrar_ubicacion_exacta: configuracion.mostrar_ubicacion_exacta,
                        mostrar_telefono: configuracion.mostrar_telefono,
                        recibir_mensajes_desconocidos: configuracion.recibir_mensajes_desconocidos,
                        distancia_maxima_km: configuracion.distancia_maxima_km,
                        fecha_actualizacion: new Date().toISOString()
                    })
                    .eq('usuario_id', dbUser.user_id)
            } else {
                await admin
                    .from('configuracion_usuario')
                    .insert({
                        usuario_id: dbUser.user_id,
                        notif_nuevas_propuestas: configuracion.notif_nuevas_propuestas,
                        notif_mensajes: configuracion.notif_mensajes,
                        notif_actualizaciones: configuracion.notif_actualizaciones,
                        notif_newsletter: configuracion.notif_newsletter,
                        perfil_publico: configuracion.perfil_publico,
                        mostrar_ubicacion_exacta: configuracion.mostrar_ubicacion_exacta,
                        mostrar_telefono: configuracion.mostrar_telefono,
                        recibir_mensajes_desconocidos: configuracion.recibir_mensajes_desconocidos,
                        distancia_maxima_km: configuracion.distancia_maxima_km
                    })
            }
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Error en PUT /api/users/profile:', e)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}


