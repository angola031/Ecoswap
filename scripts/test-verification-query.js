const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVerificationQuery() {
    console.log('🔍 Probando la consulta exacta del componente...\n')

    try {
        // 1. Probar la consulta exacta del componente
        console.log('1. Ejecutando consulta del componente...')
        const { data: validationsData, error: validationsError } = await supabase
            .from('validacion_usuario')
            .select(`
                validacion_id,
                usuario_id,
                tipo_validacion,
                estado,
                fecha_solicitud,
                notas_admin,
                motivo_rechazo,
                documentos_adjuntos,
                usuario:usuario_id (
                    user_id,
                    nombre,
                    apellido,
                    email,
                    telefono,
                    verificado,
                    fecha_registro
                )
            `)
            .eq('tipo_validacion', 'identidad')
            .in('estado', ['pendiente', 'en_revision'])
            .order('fecha_solicitud', { ascending: false })

        if (validationsError) {
            console.error('❌ Error en la consulta:', validationsError)
            return
        }

        console.log(`✅ Validaciones encontradas: ${validationsData?.length || 0}`)
        
        if (validationsData && validationsData.length > 0) {
            console.log('📋 Datos de validaciones:')
            validationsData.forEach((validation, index) => {
                console.log(`\n   ${index + 1}. Validación ID: ${validation.validacion_id}`)
                console.log(`      Usuario ID: ${validation.usuario_id}`)
                console.log(`      Estado: ${validation.estado}`)
                console.log(`      Fecha: ${validation.fecha_solicitud}`)
                console.log(`      Documentos: ${JSON.stringify(validation.documentos_adjuntos, null, 2)}`)
                
                if (validation.usuario) {
                    console.log(`      Usuario: ${validation.usuario.email}`)
                    console.log(`      Nombre: ${validation.usuario.nombre} ${validation.usuario.apellido}`)
                } else {
                    console.log(`      ❌ Usuario no encontrado en JOIN`)
                }
            })

            // 2. Probar transformación de datos
            console.log('\n2. Probando transformación de datos...')
            const transformedData = validationsData.map(item => {
                const documentos = item.documentos_adjuntos || {}
                const bucketName = 'Ecoswap'
                
                const getStorageUrl = (path) => {
                    if (!path) return null
                    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
                    const timestamp = Date.now()
                    return `${data.publicUrl}?t=${timestamp}`
                }
                
                return {
                    validacion_id: item.validacion_id,
                    user_id: item.usuario?.user_id || item.usuario_id,
                    nombre: item.usuario?.nombre || '',
                    apellido: item.usuario?.apellido || '',
                    email: item.usuario?.email || '',
                    telefono: item.usuario?.telefono || '',
                    cedula_frente_url: getStorageUrl(documentos.cedula_frente),
                    cedula_reverso_url: getStorageUrl(documentos.cedula_reverso),
                    selfie_validacion_url: getStorageUrl(documentos.selfie_validacion),
                    fecha_subida: item.fecha_solicitud,
                    estado_verificacion: item.estado,
                    observaciones: item.notas_admin
                }
            })

            console.log('✅ Datos transformados:')
            transformedData.forEach((item, index) => {
                console.log(`\n   ${index + 1}. ID: ${item.validacion_id}`)
                console.log(`      Email: ${item.email}`)
                console.log(`      Nombre: ${item.nombre} ${item.apellido}`)
                console.log(`      Estado: ${item.estado_verificacion}`)
                console.log(`      Cédula Frente: ${item.cedula_frente_url ? '✅' : '❌'}`)
                console.log(`      Cédula Reverso: ${item.cedula_reverso_url ? '✅' : '❌'}`)
                console.log(`      Selfie: ${item.selfie_validacion_url ? '✅' : '❌'}`)
            })

        } else {
            console.log('⚠️ No se encontraron validaciones pendientes')
        }

        // 3. Verificar si hay algún problema con el JOIN
        console.log('\n3. Verificando usuarios individualmente...')
        const { data: allUsers, error: usersError } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido')
            .in('user_id', [18, 21]) // IDs de las validaciones pendientes

        if (usersError) {
            console.error('❌ Error obteniendo usuarios:', usersError)
        } else {
            console.log('✅ Usuarios encontrados:')
            allUsers?.forEach(user => {
                console.log(`   - ID: ${user.user_id}, Email: ${user.email}`)
            })
        }

        console.log('\n🎯 Conclusión:')
        if (validationsData && validationsData.length > 0) {
            console.log('✅ La consulta funciona correctamente')
            console.log('✅ Los datos se transforman correctamente')
            console.log('💡 El problema podría estar en el frontend o en la renderización')
        } else {
            console.log('⚠️ No hay validaciones pendientes para mostrar')
        }

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

testVerificationQuery()
