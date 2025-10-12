require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createMorePendingValidations() {
    console.log('🔍 Creando más validaciones pendientes...\n')

    try {
        // 1. Buscar usuarios clientes
        console.log('1. Buscando usuarios clientes...')
        const { data: clients, error: clientsError } = await supabase
            .from('usuario')
            .select('user_id, email, nombre, apellido, pediente_validacion')
            .eq('es_admin', false)
            .order('user_id')

        if (clientsError) {
            console.error('❌ Error obteniendo clientes:', clientsError)
            return
        }

        console.log(`✅ Clientes encontrados: ${clients?.length || 0}`)
        clients?.forEach(client => {
            console.log(`   - ID: ${client.user_id}, Email: ${client.email}, Pendiente: ${client.pediente_validacion}`)
        })

        // 2. Crear validaciones pendientes para clientes que no las tengan
        console.log('\n2. Creando validaciones pendientes...')
        
        const clientsToValidate = clients?.filter(c => !c.pediente_validacion) || []
        console.log(`📋 Clientes sin validación pendiente: ${clientsToValidate.length}`)

        for (const client of clientsToValidate.slice(0, 3)) { // Crear máximo 3
            console.log(`\n   Creando validación para: ${client.email}`)
            
            const { data: newValidation, error: createError } = await supabase
                .from('validacion_usuario')
                .insert({
                    usuario_id: client.user_id,
                    tipo_validacion: 'identidad',
                    estado: 'pendiente',
                    documentos_adjuntos: {
                        cedula_frente: `validacion/${client.user_id}/cedula_frente.jpg`,
                        cedula_reverso: `validacion/${client.user_id}/cedula_reverso.jpg`,
                        selfie_validacion: `validacion/${client.user_id}/selfie.jpg`
                    },
                    fecha_solicitud: new Date().toISOString()
                })
                .select()

            if (createError) {
                console.error(`❌ Error creando validación para ${client.email}:`, createError)
            } else {
                console.log(`✅ Validación creada: ID ${newValidation[0].validacion_id}`)
                
                // Actualizar el usuario para marcar como pendiente de validación
                await supabase
                    .from('usuario')
                    .update({ pediente_validacion: true })
                    .eq('user_id', client.user_id)
                
                console.log(`✅ Usuario ${client.email} marcado como pendiente de validación`)
            }
        }

        // 3. Verificar validaciones pendientes finales
        console.log('\n3. Verificando validaciones pendientes finales...')
        const { data: finalPendingValidations, error: finalError } = await supabase
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

        if (finalError) {
            console.error('❌ Error obteniendo validaciones finales:', finalError)
        } else {
            console.log(`✅ Validaciones pendientes finales: ${finalPendingValidations?.length || 0}`)
            finalPendingValidations?.forEach((validation, index) => {
                console.log(`   ${index + 1}. ID: ${validation.validacion_id}`)
                console.log(`      Usuario: ${validation.usuario?.email}`)
                console.log(`      Nombre: ${validation.usuario?.nombre} ${validation.usuario?.apellido}`)
                console.log(`      Estado: ${validation.estado}`)
                console.log(`      Fecha: ${validation.fecha_solicitud}`)
                console.log('')
            })
        }

        console.log('\n🎉 ¡Validaciones pendientes creadas!')
        console.log('📋 Ahora el dashboard debería mostrar:')
        console.log('   - Interfaz de verificación de identidad')
        console.log('   - Lista de solicitudes pendientes')
        console.log('   - Botones para aprobar/rechazar')
        console.log('   - Opción de revisar documentos')

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

createMorePendingValidations()
