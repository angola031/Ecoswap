const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testNotificationAlerts() {
    console.log('🔔 Probando sistema de alertas de notificaciones...\n')

    try {
        // 1. Buscar un usuario cliente para enviar notificación
        console.log('1. Buscando usuario cliente para prueba...')
        const { data: clientUser, error: clientError } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido')
            .eq('es_admin', false)
            .limit(1)
            .single()

        if (clientError || !clientUser) {
            console.error('❌ Error obteniendo usuario cliente:', clientError)
            return
        }

        console.log(`✅ Usuario cliente encontrado: ${clientUser.email} (ID: ${clientUser.user_id})`)

        // 2. Crear notificación de prueba
        console.log('\n2. Creando notificación de prueba...')
        const { data: notification, error: notificationError } = await supabase
            .from('notificacion')
            .insert({
                usuario_id: clientUser.user_id,
                titulo: '🔔 Notificación de Prueba',
                mensaje: 'Esta es una notificación de prueba para verificar que el sistema de alertas funciona correctamente.',
                tipo: 'sistema',
                datos_adicionales: {
                    test: true,
                    timestamp: new Date().toISOString(),
                    message: 'Notificación de prueba del sistema de alertas'
                },
                leida: false,
                fecha_creacion: new Date().toISOString(),
                es_push: true,
                es_email: false
            })
            .select()

        if (notificationError) {
            console.error('❌ Error creando notificación:', notificationError)
            return
        }

        console.log('✅ Notificación de prueba creada exitosamente')
        console.log(`   - ID: ${notification[0].notificacion_id}`)
        console.log(`   - Usuario: ${clientUser.email}`)
        console.log(`   - Título: ${notification[0].titulo}`)
        console.log(`   - Mensaje: ${notification[0].mensaje}`)

        // 3. Crear notificación de verificación rechazada
        console.log('\n3. Creando notificación de verificación rechazada...')
        const { data: rejectionNotification, error: rejectionError } = await supabase
            .from('notificacion')
            .insert({
                usuario_id: clientUser.user_id,
                titulo: '❌ Verificación de Identidad Rechazada',
                mensaje: 'Tu verificación de identidad ha sido rechazada. Motivo: Documentos no son claros, por favor sube imágenes de mejor calidad. Por favor, revisa y vuelve a subir los documentos.',
                tipo: 'verificacion_identidad',
                datos_adicionales: {
                    status: 'rejected',
                    motivo_rechazo: 'Documentos no son claros, por favor sube imágenes de mejor calidad',
                    validacion_id: 999,
                    fecha_revision: new Date().toISOString(),
                    url_accion: '/verificacion-identidad'
                },
                leida: false,
                fecha_creacion: new Date().toISOString(),
                es_push: true,
                es_email: false
            })
            .select()

        if (rejectionError) {
            console.error('❌ Error creando notificación de rechazo:', rejectionError)
        } else {
            console.log('✅ Notificación de rechazo creada exitosamente')
            console.log(`   - ID: ${rejectionNotification[0].notificacion_id}`)
            console.log(`   - Usuario: ${clientUser.email}`)
            console.log(`   - Título: ${rejectionNotification[0].titulo}`)
        }

        // 4. Verificar notificaciones no leídas del usuario
        console.log('\n4. Verificando notificaciones no leídas...')
        const { data: unreadNotifications, error: unreadError } = await supabase
            .from('notificacion')
            .select('notificacion_id, titulo, mensaje, tipo, fecha_creacion')
            .eq('usuario_id', clientUser.user_id)
            .eq('leida', false)
            .order('fecha_creacion', { ascending: false })

        if (unreadError) {
            console.error('❌ Error obteniendo notificaciones no leídas:', unreadError)
        } else {
            console.log(`✅ Notificaciones no leídas: ${unreadNotifications?.length || 0}`)
            unreadNotifications?.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.titulo}`)
                console.log(`      Fecha: ${notif.fecha_creacion}`)
                console.log(`      Tipo: ${notif.tipo}`)
            })
        }

        console.log('\n🎯 Instrucciones para probar:')
        console.log(`1. Inicia sesión como: ${clientUser.email}`)
        console.log('2. Ve a la página principal')
        console.log('3. Deberías ver:')
        console.log('   - Badge rojo con número en el botón de notificaciones')
        console.log('   - Botón de notificaciones parpadeando (animate-pulse)')
        console.log('   - Icono de campana rebotando (animate-bounce)')
        console.log('   - Toast/popup de notificación en la esquina superior derecha')
        console.log('   - Sonido de notificación (si el navegador lo permite)')
        console.log('   - Barra roja en la parte superior diciendo "¡Tienes una nueva notificación!"')
        console.log('4. Haz clic en "Ver detalles" en el toast para ir a la página de notificaciones')
        console.log('5. En la página de notificaciones, deberías ver las notificaciones con el nuevo diseño')

        console.log('\n✅ Sistema de alertas de notificaciones configurado correctamente!')

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

testNotificationAlerts()
