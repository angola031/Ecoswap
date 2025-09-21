const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAdminAuth() {
    console.log('🔍 Debugging admin authentication...\n')

    try {
        // 1. Verificar administradores en la base de datos
        console.log('1. Verificando administradores en la BD...')
        const { data: admins, error: adminsError } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido, es_admin, activo')
            .eq('es_admin', true)
            .order('user_id')

        if (adminsError) {
            console.error('❌ Error obteniendo administradores:', adminsError)
            return
        }

        console.log(`✅ Administradores encontrados: ${admins?.length || 0}`)
        admins?.forEach(admin => {
            console.log(`   - ID: ${admin.user_id}`)
            console.log(`     Email: ${admin.email}`)
            console.log(`     Nombre: ${admin.nombre} ${admin.apellido}`)
            console.log(`     Es Admin: ${admin.es_admin}`)
            console.log(`     Activo: ${admin.activo}`)
            console.log('')
        })

        // 2. Verificar usuarios con email ecoswap03@gmail.com
        console.log('2. Verificando usuario ecoswap03@gmail.com...')
        const { data: ecoswapAdmin, error: ecoswapError } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido, es_admin, activo')
            .eq('email', 'ecoswap03@gmail.com')
            .single()

        if (ecoswapError) {
            console.error('❌ Error obteniendo ecoswap03@gmail.com:', ecoswapError)
        } else {
            console.log('✅ Usuario ecoswap03@gmail.com encontrado:')
            console.log(`   - ID: ${ecoswapAdmin.user_id}`)
            console.log(`   - Email: ${ecoswapAdmin.email}`)
            console.log(`   - Nombre: ${ecoswapAdmin.nombre} ${ecoswapAdmin.apellido}`)
            console.log(`   - Es Admin: ${ecoswapAdmin.es_admin}`)
            console.log(`   - Activo: ${ecoswapAdmin.activo}`)
        }

        // 3. Verificar si hay usuarios activos y administradores
        console.log('\n3. Verificando usuarios activos y administradores...')
        const { data: activeAdmins, error: activeError } = await supabase
            .from('usuario')
            .select('user_id, email, es_admin, activo')
            .eq('es_admin', true)
            .eq('activo', true)

        if (activeError) {
            console.error('❌ Error obteniendo administradores activos:', activeError)
        } else {
            console.log(`✅ Administradores activos: ${activeAdmins?.length || 0}`)
            activeAdmins?.forEach(admin => {
                console.log(`   - ${admin.email} (ID: ${admin.user_id})`)
            })
        }

        // 4. Verificar validaciones pendientes
        console.log('\n4. Verificando validaciones pendientes...')
        const { data: pendingValidations, error: pendingError } = await supabase
            .from('validacion_usuario')
            .select(`
                validacion_id,
                usuario_id,
                estado,
                fecha_solicitud,
                usuario:usuario_id (
                    email,
                    nombre,
                    apellido
                )
            `)
            .eq('tipo_validacion', 'identidad')
            .in('estado', ['pendiente', 'en_revision'])
            .order('fecha_solicitud', { ascending: false })

        if (pendingError) {
            console.error('❌ Error obteniendo validaciones pendientes:', pendingError)
        } else {
            console.log(`✅ Validaciones pendientes: ${pendingValidations?.length || 0}`)
            pendingValidations?.forEach((validation, index) => {
                console.log(`   ${index + 1}. ID: ${validation.validacion_id}`)
                console.log(`      Usuario: ${validation.usuario?.email}`)
                console.log(`      Nombre: ${validation.usuario?.nombre} ${validation.usuario?.apellido}`)
                console.log(`      Estado: ${validation.estado}`)
                console.log(`      Fecha: ${validation.fecha_solicitud}`)
                console.log('')
            })
        }

        console.log('\n🎯 Diagnóstico:')
        if (activeAdmins && activeAdmins.length > 0) {
            console.log('✅ Hay administradores activos disponibles')
            console.log('💡 Para acceder al dashboard, usa una de estas cuentas:')
            activeAdmins.forEach(admin => {
                console.log(`   - ${admin.email}`)
            })
        } else {
            console.log('⚠️ No hay administradores activos')
            console.log('💡 Necesitas crear o activar un administrador')
        }

        if (pendingValidations && pendingValidations.length > 0) {
            console.log('✅ Hay validaciones pendientes para revisar')
        } else {
            console.log('⚠️ No hay validaciones pendientes')
        }

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

debugAdminAuth()
