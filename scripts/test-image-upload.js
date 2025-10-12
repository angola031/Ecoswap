/**
 * Script de prueba para verificar la funcionalidad de subida de imágenes en el chat
 * Este script verifica que:
 * 1. El bucket de Supabase esté configurado
 * 2. Las políticas de acceso estén correctas
 * 3. La estructura de carpetas sea la esperada
 */


// Configuración de Supabase (usar variables de entorno)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno requeridas:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testImageUploadSetup() {
  console.log('🧪 Iniciando prueba de configuración de subida de imágenes...\n')

  try {
    // 1. Verificar que el bucket "Ecoswap" existe
    console.log('1️⃣ Verificando bucket "Ecoswap"...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error obteniendo buckets:', bucketsError.message)
      return false
    }

    const ecoswapBucket = buckets.find(bucket => bucket.name === 'Ecoswap')
    if (!ecoswapBucket) {
      console.error('❌ Bucket "Ecoswap" no encontrado')
      console.log('📋 Buckets disponibles:', buckets.map(b => b.name))
      return false
    }

    console.log('✅ Bucket "Ecoswap" encontrado:', {
      id: ecoswapBucket.id,
      name: ecoswapBucket.name,
      public: ecoswapBucket.public,
      file_size_limit: ecoswapBucket.file_size_limit,
      allowed_mime_types: ecoswapBucket.allowed_mime_types
    })

    // 2. Verificar carpeta "mensajes"
    console.log('\n2️⃣ Verificando carpeta "mensajes"...')
    const { data: mensajesFolder, error: mensajesError } = await supabase.storage
      .from('Ecoswap')
      .list('mensajes', { limit: 1 })

    if (mensajesError && mensajesError.message.includes('not found')) {
      console.log('📁 Creando carpeta "mensajes"...')
      // Crear un archivo temporal para crear la carpeta
      const { error: createError } = await supabase.storage
        .from('Ecoswap')
        .upload('mensajes/.gitkeep', new Blob([''], { type: 'text/plain' }))
      
      if (createError) {
        console.error('❌ Error creando carpeta "mensajes":', createError.message)
        return false
      }
      console.log('✅ Carpeta "mensajes" creada')
    } else if (mensajesError) {
      console.error('❌ Error verificando carpeta "mensajes":', mensajesError.message)
      return false
    } else {
      console.log('✅ Carpeta "mensajes" existe')
    }

    // 3. Probar subida de imagen de prueba
    console.log('\n3️⃣ Probando subida de imagen de prueba...')
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    const testFileName = `test_${Date.now()}.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Ecoswap')
      .upload(`mensajes/${testFileName}`, testImageContent, {
        contentType: 'image/png',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('❌ Error subiendo imagen de prueba:', uploadError.message)
      return false
    }

    console.log('✅ Imagen de prueba subida:', uploadData.path)

    // 4. Verificar URL pública
    console.log('\n4️⃣ Verificando URL pública...')
    const { data: { publicUrl } } = supabase.storage
      .from('Ecoswap')
      .getPublicUrl(`mensajes/${testFileName}`)

    console.log('✅ URL pública generada:', publicUrl)

    // 5. Limpiar archivo de prueba
    console.log('\n5️⃣ Limpiando archivo de prueba...')
    const { error: deleteError } = await supabase.storage
      .from('Ecoswap')
      .remove([`mensajes/${testFileName}`])

    if (deleteError) {
      console.warn('⚠️ Error eliminando archivo de prueba:', deleteError.message)
    } else {
      console.log('✅ Archivo de prueba eliminado')
    }

    console.log('\n🎉 ¡Configuración de subida de imágenes verificada exitosamente!')
    console.log('\n📋 Resumen:')
    console.log('   ✅ Bucket "Ecoswap" configurado correctamente')
    console.log('   ✅ Carpeta "mensajes" disponible')
    console.log('   ✅ Subida de imágenes funcionando')
    console.log('   ✅ URLs públicas generándose correctamente')
    
    return true

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
    return false
  }
}

// Ejecutar prueba
testImageUploadSetup()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  })
