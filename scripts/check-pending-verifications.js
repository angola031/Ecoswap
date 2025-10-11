require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPendingVerifications() {
    console.log('🔍 Verificando solicitudes de verificación pendientes...\n')

    try {
        // 1. Buscar todas las validaciones
        console.log('1. Buscando todas las validaciones...')
        const { data: allValidations, error: allError } = await supabase
            .from('validacion_usuario')
            .select(`
                validacion_id,
                usuario_id,
                tipo_validacion,
                estado,
                fecha_solicitud,
                documentos_adjuntos,
                notas_admin,
                motivo_rechazo,
                usuario:usuario_id (
                    user_id,
                    email,
                    nombre,
                    apellido
                )
            `)
            .order('fecha_solicitud', { ascending: false })

        if (allError) {
            console.error('❌ Error obteniendo validaciones:', allError)
            return
        }

        console.log(`✅ Total de validaciones: ${allValidations?.length || 0}`)
        
        if (allValidations && allValidations.length > 0) {
            console.log('📋 Lista de validaciones:')
            allValidations.forEach((validation, index) => {
                console.log(`   ${index + 1}. ID: ${validation.validacion_id}`)
                console.log(`      Usuario: ${validation.usuario?.email}`)
                console.log(`      Nombre: ${validation.usuario?.nombre} ${validation.usuario?.apellido}`)
                console.log(`      Tipo: ${validation.tipo_validacion}`)
                console.log(`      Estado: ${validation.estado}`)
                console.log(`      Fecha: ${validation.fecha_solicitud}`)
                console.log(`      Documentos: ${validation.documentos_adjuntos ? 'Sí' : 'No'}`)
                if (validation.notas_admin) {
                    console.log(`      Notas: ${validation.notas_admin}`)
                }
                if (validation.motivo_rechazo) {
                    console.log(`      Motivo rechazo: ${validation.motivo_rechazo}`)
                }
                console.log('')
            })
        }

        // 2. Buscar validaciones pendientes específicamente
        console.log('2. Buscando validaciones pendientes...')
        const { data: pendingValidations, error: pendingError } = await supabase
            .from('validacion_usuario')
            .select(`
                validacion_id,
                usuario_id,
                estado,
                fecha_solicitud,
                documentos_adjuntos,
                usuario:usuario_id (
                    user_id,
                    email,
                    nombre,
                    apellido,
                    telefono
                )
            `)
            .eq('tipo_validacion', 'identidad')
            .in('estado', ['pendiente', 'en_revision'])
            .order('fecha_solicitud', { ascending: false })

        if (pendingError) {
            console.error('❌ Error obteniendo validaciones pendientes:', pendingError)
            return
        }

        console.log(`✅ Validaciones pendientes: ${pendingValidations?.length || 0}`)
        
        if (!pendingValidations || pendingValidations.length === 0) {
            console.log('⚠️ No hay validaciones pendientes')
            console.log('💡 Esto explica por qué no se muestra la interfaz de verificación')
            
            // 3. Crear una validación pendiente para pruebas
            console.log('\n3. Creando validación pendiente para pruebas...')
            
            // Buscar un usuario cliente
            const { data: clientUser, error: clientError } = await supabase
                .from('usuario')
                .select('user_id, email, nombre, apellido')
                .eq('es_admin', false)
                .limit(1)
                .single()

            if (clientError || !clientUser) {
                console.log('❌ No se encontró usuario cliente para crear validación')
                return
            }

            console.log(`✅ Usuario cliente encontrado: ${clientUser.email}`)

            // Crear validación pendiente
            const { data: newValidation, error: createError } = await supabase
                .from('validacion_usuario')
                .insert({
                    usuario_id: clientUser.user_id,
                    tipo_validacion: 'identidad',
                    estado: 'pendiente',
                    documentos_adjuntos: {
                        cedula_frente: `validacion/${clientUser.user_id}/cedula_frente.jpg`,
                        cedula_reverso: `validacion/${clientUser.user_id}/cedula_reverso.jpg`,
                        selfie_validacion: `validacion/${clientUser.user_id}/selfie.jpg`
                    },
                    fecha_solicitud: new Date().toISOString()
                })
                .select()

            if (createError) {
                console.error('❌ Error creando validación:', createError)
            } else {
                console.log('✅ Validación pendiente creada:', newValidation[0].validacion_id)
                console.log('📧 Usuario:', clientUser.email)
            }

        } else {
            console.log('📋 Validaciones pendientes encontradas:')
            pendingValidations.forEach((validation, index) => {
                console.log(`   ${index + 1}. ID: ${validation.validacion_id}`)
                console.log(`      Usuario: ${validation.usuario?.email}`)
                console.log(`      Estado: ${validation.estado}`)
                console.log(`      Fecha: ${validation.fecha_solicitud}`)
                console.log('')
            })
        }

        // 4. Verificar usuarios con pediente_validacion = true
        console.log('4. Verificando usuarios con validación pendiente...')
        const { data: usersPendingValidation, error: usersError } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido, pediente_validacion, verificado')
            .eq('pediente_validacion', true)
            .order('user_id')

        if (usersError) {
            console.error('❌ Error obteniendo usuarios con validación pendiente:', usersError)
        } else {
            console.log(`✅ Usuarios con validación pendiente: ${usersPendingValidation?.length || 0}`)
            usersPendingValidation?.forEach(user => {
                console.log(`   - ${user.email}: Verificado=${user.verificado}, Pendiente=${user.pediente_validacion}`)
            })
        }

        console.log('\n🎯 Resumen:')
        if (pendingValidations && pendingValidations.length > 0) {
            console.log('✅ Hay validaciones pendientes - la interfaz debería mostrarse')
        } else {
            console.log('⚠️ No hay validaciones pendientes - por eso no se muestra la interfaz')
            console.log('💡 Se creó una validación pendiente para pruebas')
        }

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

checkPendingVerifications()
