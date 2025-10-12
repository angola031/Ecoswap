import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

// POST - Crear notificación para administradores sobre verificación de identidad
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { 
            userId, 
            userName, 
            userEmail,
            verificationType = 'identity_verification',
            additionalData 
        } = body

        // Validar datos requeridos
        if (!userId || !userName) {
            return NextResponse.json({ 
                error: 'Faltan datos requeridos: userId, userName' 
            }, { status: 400 })
        }


        // Obtener todos los administradores activos
        const supabase = getSupabaseClient()
        if (!supabase) {
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }
        
        const { data: admins, error: adminsError } = await supabase
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                es_admin
            `)
            .eq('es_admin', true)
            .eq('activo', true)

        if (adminsError) {
            console.error('❌ Error obteniendo administradores:', adminsError)
            return NextResponse.json({ error: 'Error obteniendo administradores' }, { status: 500 })
        }

        if (!admins || admins.length === 0) {
            return NextResponse.json({ error: 'No hay administradores activos' }, { status: 404 })
        }


        // Crear notificaciones para cada administrador
        const notifications = admins.map(admin => ({
            usuario_id: admin.user_id,
            titulo: 'Nueva Verificación de Identidad',
            mensaje: `${userName} (${userEmail}) ha subido documentos para verificación de identidad y está esperando revisión.`,
            tipo: 'verificacion_identidad',
            datos_adicionales: {
                userId,
                userName,
                userEmail,
                verificationType,
                additionalData
            },
            leida: false,
            fecha_creacion: new Date().toISOString(),
            es_push: true,
            es_email: false
        }))

        // Insertar todas las notificaciones
        const { data: createdNotifications, error: insertError } = await supabase
            .from('notificacion')
            .insert(notifications)
            .select()

        if (insertError) {
            console.error('❌ Error creando notificaciones:', insertError)
            return NextResponse.json({ error: 'Error creando notificaciones' }, { status: 500 })
        }


        return NextResponse.json({ 
            success: true,
            notifications_created: createdNotifications?.length || 0,
            admins_notified: admins.length,
            message: `Notificaciones enviadas a ${admins.length} administradores`
        })

    } catch (error) {
        console.error('❌ Error en POST /api/notifications/admin:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
