require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testImageUpdates() {
    console.log('🔍 Probando actualización de imágenes en el dashboard...\n')

    try {
        // 1. Buscar una validación pendiente
        console.log('1. Buscando validación pendiente...')
        const { data: validations, error: validationsError } = await supabase
            .from('validacion_usuario')
            .select(`
                validacion_id,
                usuario_id,
                tipo_validacion,
                estado,
                fecha_solicitud,
                documentos_adjuntos,
                usuario:usuario_id (
                    user_id,
                    nombre,
                    apellido,
                    email
                )
            `)
            .eq('tipo_validacion', 'identidad')
            .eq('estado', 'pendiente')
            .order('fecha_solicitud', { ascending: false })
            .limit(1)

        if (validationsError) {
            console.error('❌ Error obteniendo validaciones:', validationsError)
            return
        }

        if (!validations || validations.length === 0) {
            console.log('❌ No hay validaciones pendientes')
            return
        }

        const validation = validations[0]
        console.log('✅ Validación pendiente encontrada:', validation)

        // 2. Generar URLs de las imágenes como lo hace el dashboard
        console.log('\n2. Generando URLs de imágenes...')
        const documentos = validation.documentos_adjuntos || {}
        const bucketName = 'Ecoswap'

        const getStorageUrl = (path) => {
            if (!path) return null
            const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
            const timestamp = Date.now()
            return `${data.publicUrl}?t=${timestamp}`
        }

        const urls = {
            cedula_frente: getStorageUrl(documentos.cedula_frente),
            cedula_reverso: getStorageUrl(documentos.cedula_reverso),
            selfie_validacion: getStorageUrl(documentos.selfie_validacion)
        }

        console.log('📷 URLs generadas:')
        console.log('   - Cédula frente:', urls.cedula_frente)
        console.log('   - Cédula reverso:', urls.cedula_reverso)
        console.log('   - Selfie:', urls.selfie_validacion)

        // 3. Simular actualización de archivos (como cuando el usuario resube)
        console.log('\n3. Simulando actualización de archivos...')
        const newDocumentosAdjuntos = {
            cedula_frente: `validacion/${validation.usuario_id}/cedula_frente_${Date.now()}.jpg`,
            cedula_reverso: `validacion/${validation.usuario_id}/cedula_reverso_${Date.now()}.jpg`,
            selfie_validacion: `validacion/${validation.usuario_id}/selfie_${Date.now()}.jpg`
        }

        console.log('📁 Nuevos archivos:', newDocumentosAdjuntos)

        // Actualizar la validación con nuevos archivos
        const { error: updateError } = await supabase
            .from('validacion_usuario')
            .update({
                documentos_adjuntos: newDocumentosAdjuntos,
                fecha_solicitud: new Date().toISOString()
            })
            .eq('validacion_id', validation.validacion_id)

        if (updateError) {
            console.error('❌ Error actualizando validación:', updateError)
            return
        }

        console.log('✅ Validación actualizada con nuevos archivos')

        // 4. Generar nuevas URLs
        console.log('\n4. Generando nuevas URLs después de la actualización...')
        const newUrls = {
            cedula_frente: getStorageUrl(newDocumentosAdjuntos.cedula_frente),
            cedula_reverso: getStorageUrl(newDocumentosAdjuntos.cedula_reverso),
            selfie_validacion: getStorageUrl(newDocumentosAdjuntos.selfie_validacion)
        }

        console.log('📷 Nuevas URLs generadas:')
        console.log('   - Cédula frente:', newUrls.cedula_frente)
        console.log('   - Cédula reverso:', newUrls.cedula_reverso)
        console.log('   - Selfie:', newUrls.selfie_validacion)

        // 5. Verificar que las URLs son diferentes
        console.log('\n5. Verificando que las URLs son diferentes...')
        const urlsChanged = 
            urls.cedula_frente !== newUrls.cedula_frente ||
            urls.cedula_reverso !== newUrls.cedula_reverso ||
            urls.selfie_validacion !== newUrls.selfie_validacion

        if (urlsChanged) {
            console.log('✅ Las URLs se actualizaron correctamente')
        } else {
            console.log('❌ Las URLs no se actualizaron')
        }

        // 6. Probar acceso a las URLs
        console.log('\n6. Probando acceso a las URLs...')
        for (const [tipo, url] of Object.entries(newUrls)) {
            if (url) {
                try {
                    const response = await fetch(url, { method: 'HEAD' })
                    if (response.ok) {
                        console.log(`✅ ${tipo}: URL accesible (${response.status})`)
                    } else {
                        console.log(`⚠️ ${tipo}: URL no accesible (${response.status})`)
                    }
                } catch (error) {
                    console.log(`❌ ${tipo}: Error accediendo a URL - ${error.message}`)
                }
            }
        }

        console.log('\n🎉 Prueba de actualización de imágenes completada!')
        console.log(`📧 Usuario: ${validation.usuario?.email}`)
        console.log(`🔍 Validación ID: ${validation.validacion_id}`)
        console.log('\n📋 Instrucciones para verificar en el dashboard:')
        console.log('1. Ve al dashboard de administrador: /admin/verificaciones')
        console.log('2. Busca la validación para:', validation.usuario?.email)
        console.log('3. Haz clic en "Revisar"')
        console.log('4. Haz clic en "Refrescar" para actualizar las imágenes')
        console.log('5. Las imágenes deberían mostrar las URLs actualizadas')

    } catch (error) {
        console.error('❌ Error general:', error)
    }
}

testImageUpdates()
