import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Obtener notificaciones para administradores
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const isAdmin = searchParams.get('isAdmin') === 'true'
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        let query = supabase
            .from('notificacion')
            .select(`
                *,
                usuario:user_id (
                    user_id,
                    nombre,
                    apellido,
                    email,
                    foto_perfil
                )
            `)
            .order('fecha_creacion', { ascending: false })
            .range(offset, offset + limit - 1)

        // Si es para administradores, solo mostrar notificaciones de admin
        if (isAdmin) {
            query = query.eq('es_admin', true)
        }

        const { data: notifications, error } = await query

        if (error) {
            console.error('❌ Error obteniendo notificaciones:', error)
            return NextResponse.json({ error: 'Error obteniendo notificaciones' }, { status: 500 })
        }

        return NextResponse.json({ notifications })

    } catch (error) {
        console.error('❌ Error en GET /api/notifications:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}

// POST - Crear nueva notificación
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { 
            userId, 
            titulo, 
            mensaje, 
            tipo = 'info', 
            esAdmin = false,
            urlAccion,
            datosAdicionales 
        } = body

        // Validar datos requeridos
        if (!userId || !titulo || !mensaje) {
            return NextResponse.json({ 
                error: 'Faltan datos requeridos: userId, titulo, mensaje' 
            }, { status: 400 })
        }

        // Crear la notificación
        const { data: notification, error } = await supabase
            .from('notificacion')
            .insert({
                usuario_id: userId,
                titulo,
                mensaje,
                tipo,
                datos_adicionales: additionalData || null,
                leida: false,
                fecha_creacion: new Date().toISOString(),
                es_push: true,
                es_email: false
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Error creando notificación:', error)
            return NextResponse.json({ error: 'Error creando notificación' }, { status: 500 })
        }

        console.log('✅ Notificación creada:', notification)

        return NextResponse.json({ notification })

    } catch (error) {
        console.error('❌ Error en POST /api/notifications:', error)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
