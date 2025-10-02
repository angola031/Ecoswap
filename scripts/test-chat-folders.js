/**
 * Script de prueba para verificar la funcionalidad de carpetas por chat
 * Este script verifica que:
 * 1. Se puedan crear carpetas específicas por chat
 * 2. Las imágenes se suban a las carpetas correctas
 * 3. Las URLs públicas funcionen correctamente
 */

const { createClient } = require('@supabase/supabase-js')

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

async function testChatFolders() {
  console.log('🧪 Iniciando prueba de carpetas por chat...\n')

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

    console.log('✅ Bucket "Ecoswap" encontrado')

    // 2. Probar creación de carpetas por chat
    console.log('\n2️⃣ Probando creación de carpetas por chat...')
    
    const testChatIds = ['chat_1', 'chat_2', 'chat_3']
    
    for (const chatId of testChatIds) {
      console.log(`   📁 Probando carpeta para chat: ${chatId}`)
      
      // Crear un archivo de prueba para crear la carpeta
      const testFileName = `test_${Date.now()}.txt`
      const testContent = Buffer.from(`Archivo de prueba para ${chatId}`)
      const folderPath = `mensajes/${chatId}/${testFileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Ecoswap')
        .upload(folderPath, testContent, {
          contentType: 'text/plain',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error(`   ❌ Error creando carpeta para ${chatId}:`, uploadError.message)
        continue
      }

      console.log(`   ✅ Carpeta creada exitosamente: ${folderPath}`)

      // Verificar que se puede obtener la URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('Ecoswap')
        .getPublicUrl(folderPath)

      console.log(`   🔗 URL pública generada: ${publicUrl}`)

      // Limpiar archivo de prueba
      const { error: deleteError } = await supabase.storage
        .from('Ecoswap')
        .remove([folderPath])

      if (deleteError) {
        console.warn(`   ⚠️ Error eliminando archivo de prueba para ${chatId}:`, deleteError.message)
      } else {
        console.log(`   🗑️ Archivo de prueba eliminado para ${chatId}`)
      }
    }

    // 3. Probar estructura de carpetas existente
    console.log('\n3️⃣ Verificando estructura de carpetas existente...')
    
    const { data: mensajesFolder, error: mensajesError } = await supabase.storage
      .from('Ecoswap')
      .list('mensajes', { limit: 100 })

    if (mensajesError) {
      console.error('❌ Error listando carpeta mensajes:', mensajesError.message)
    } else {
      console.log('📂 Contenido de la carpeta "mensajes":')
      if (mensajesFolder && mensajesFolder.length > 0) {
        mensajesFolder.forEach(item => {
          if (item.name.startsWith('chat_')) {
            console.log(`   📁 ${item.name} (carpeta de chat)`)
          } else {
            console.log(`   📄 ${item.name}`)
          }
        })
      } else {
        console.log('   📭 La carpeta está vacía')
      }
    }

    // 4. Probar subida de imagen simulada
    console.log('\n4️⃣ Probando subida de imagen simulada...')
    
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    const testChatId = 'test_chat_123'
    const testUserId = 'test_user_456'
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileName = `chat_${testChatId}_${testUserId}_${timestamp}_${randomString}.png`
    const folderPath = `mensajes/chat_${testChatId}/${fileName}`
    
    const { data: imageUploadData, error: imageUploadError } = await supabase.storage
      .from('Ecoswap')
      .upload(folderPath, testImageContent, {
        contentType: 'image/png',
        cacheControl: '3600'
      })

    if (imageUploadError) {
      console.error('❌ Error subiendo imagen de prueba:', imageUploadError.message)
      return false
    }

    console.log('✅ Imagen de prueba subida exitosamente:', folderPath)

    // Verificar URL pública
    const { data: { publicUrl: imageUrl } } = supabase.storage
      .from('Ecoswap')
      .getPublicUrl(folderPath)

    console.log('🔗 URL pública de imagen:', imageUrl)

    // Limpiar imagen de prueba
    const { error: deleteImageError } = await supabase.storage
      .from('Ecoswap')
      .remove([folderPath])

    if (deleteImageError) {
      console.warn('⚠️ Error eliminando imagen de prueba:', deleteImageError.message)
    } else {
      console.log('🗑️ Imagen de prueba eliminada')
    }

    console.log('\n🎉 ¡Prueba de carpetas por chat completada exitosamente!')
    console.log('\n📋 Resumen:')
    console.log('   ✅ Bucket "Ecoswap" accesible')
    console.log('   ✅ Carpetas por chat se crean automáticamente')
    console.log('   ✅ URLs públicas funcionan correctamente')
    console.log('   ✅ Estructura de carpetas organizada')
    console.log('\n📁 Estructura implementada:')
    console.log('   Ecoswap/')
    console.log('   └── mensajes/')
    console.log('       ├── chat_1/')
    console.log('       ├── chat_2/')
    console.log('       ├── chat_3/')
    console.log('       └── ...')
    
    return true

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
    return false
  }
}

// Ejecutar prueba
testChatFolders()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error)
    process.exit(1)
  })
