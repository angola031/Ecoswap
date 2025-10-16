// Script para probar la consulta de validación de usuario específico
require('dotenv').config({ path: '.env.local' })

async function testUserValidation() {
    try {
        console.log('🧪 Probando consulta de validación de usuario...')
        
        const userId = 36 // ID del usuario que mencionaste
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        console.log(`📡 Consultando validación para usuario ID: ${userId}`)
        console.log(`🌐 URL base: ${baseUrl}`)
        
        // Simular una consulta directa a la API
        const apiUrl = `${baseUrl}/api/admin/verificaciones/${userId}`
        console.log(`🔗 URL de API: ${apiUrl}`)
        
        // Para pruebas locales, podrías usar fetch aquí
        console.log('\n📋 Consulta SQL equivalente:')
        console.log(`
SELECT 
    validacion_id,
    usuario_id,
    estado,
    motivo_rechazo,
    fecha_solicitud,
    fecha_revision,
    fecha_aprobacion,
    tipo_validacion,
    documentos_adjuntos
FROM validacion_usuario 
WHERE usuario_id = ${userId} 
AND tipo_validacion = 'identidad'
LIMIT 1;
        `)
        
        console.log('\n📋 Consulta con información del usuario:')
        console.log(`
SELECT 
    v.validacion_id,
    v.usuario_id,
    v.estado,
    v.motivo_rechazo,
    v.fecha_solicitud,
    v.fecha_revision,
    v.fecha_aprobacion,
    v.tipo_validacion,
    u.email,
    u.nombre,
    u.apellido,
    u.verificado,
    u.activo
FROM validacion_usuario v
LEFT JOIN usuario u ON v.usuario_id = u.user_id
WHERE v.usuario_id = ${userId} 
AND v.tipo_validacion = 'identidad'
LIMIT 1;
        `)
        
        console.log('\n✅ Script de prueba completado')
        console.log('💡 Para probar la API, asegúrate de tener un token de admin válido')
        
    } catch (error) {
        console.error('❌ Error en prueba:', error.message)
    }
}

// Ejecutar prueba
testUserValidation()



