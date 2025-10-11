import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    
    // Verificar que el cliente admin esté disponible
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Cliente admin de Supabase no disponible',
        details: 'SUPABASE_SERVICE_ROLE_KEY no configurado'
      }, { status: 500 })
    }

    // Probar listado de buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ [API] Error listando buckets:', bucketsError)
      return NextResponse.json({ 
        error: 'Error conectando con Supabase Storage',
        details: bucketsError.message 
      }, { status: 500 })
    }
    
    
    // Verificar si el bucket Ecoswap existe
    const ecoswapBucket = buckets.find(bucket => bucket.name === 'Ecoswap')
    if (!ecoswapBucket) {
      return NextResponse.json({ 
        error: 'Bucket Ecoswap no encontrado',
        availableBuckets: buckets.map(b => b.name)
      }, { status: 404 })
    }
    
    
    // Probar listado de archivos en mensajes
    const { data: files, error: filesError } = await supabaseAdmin.storage
      .from('Ecoswap')
      .list('mensajes', { limit: 10 })
    
    if (filesError) {
    } else {
    }
    
    return NextResponse.json({
      success: true,
      message: 'Conectividad con Supabase Storage OK',
      bucket: ecoswapBucket,
      filesInMensajes: files || []
    })
    
  } catch (error: any) {
    console.error('❌ [API] Error en prueba de conectividad:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    
    // Crear un archivo de prueba simple
    const testContent = Buffer.from('Archivo de prueba para verificar conectividad')
    const testFileName = `test_${Date.now()}.txt`
    const testPath = `mensajes/test/${testFileName}`
    
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Ecoswap')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        cacheControl: '3600'
      })
    
    if (uploadError) {
      console.error('❌ [API] Error subiendo archivo de prueba:', uploadError)
      return NextResponse.json({ 
        error: 'Error subiendo archivo de prueba',
        details: uploadError.message 
      }, { status: 500 })
    }
    
    
    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('Ecoswap')
      .getPublicUrl(testPath)
    
    
    // Limpiar archivo de prueba
    const { error: deleteError } = await supabaseAdmin.storage
      .from('Ecoswap')
      .remove([testPath])
    
    if (deleteError) {
      console.warn('⚠️ [API] Error eliminando archivo de prueba:', deleteError.message)
    } else {
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subida de prueba exitosa',
      uploadData,
      publicUrl,
      cleaned: !deleteError
    })
    
  } catch (error: any) {
    console.error('❌ [API] Error en prueba de subida:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}
